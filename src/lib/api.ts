import { discussion, notify, preferences, preferenceFields, publicCommunity } from './community';
import { journalHistory, rememberEntry, assertRevision } from './journal-history';
import { workspace, mediaMetadata, recordChange } from './vehicle-workspace';
import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { db } from './db';
import {
  canModerate,
  checkOrigin,
  checkPassword,
  digest,
  hashPassword,
  HttpError,
  newToken,
} from './security';
import {
  registration,
  profile,
  vehicle,
  content,
  password,
  vehicleEntry,
  journalUpdate,
  journalDelete,
  publishBuild,
} from './validation';
import { requireMail, sendAuthMail } from './mail';
import type { User, Prisma } from '@/generated/prisma/client';
const publicUser = { id: true, username: true, bio: true, createdAt: true } as const;
const cookieName = process.env.NODE_ENV === 'production' ? '__Host-pumamap' : 'pumamap';
const publicStatuses = ['PUBLISHED', 'RESERVED', 'SOLD'] as const;
function listPagination(request: Request) {
  const raw = new URL(request.url).searchParams.get('page');
  const page = raw === null ? null : z.coerce.number().int().min(1).max(1000000).parse(raw);
  return {
    query: { skip: page === null ? 0 : (page - 1) * 20, take: page === null ? 50 : 21 },
    result<T>(rows: T[]) {
      return page === null ? rows : { items: rows.slice(0, 20), hasMore: rows.length > 20, page };
    },
  };
}

const publicContentWhere: Prisma.ContentWhereInput = {
  status: { in: [...publicStatuses] },
  OR: [
    { vehicleEntryId: null },
    { vehicleEntry: { visibility: 'PUBLIC', vehicle: { visibility: 'PUBLIC' } } },
  ],
};
const contentInclude = {
  vehicleEntry: {
    select: {
      id: true,
      category: true,
      progress: true,
      vehicleId: true,
      visibility: true,
      vehicle: { select: { name: true, visibility: true } },
    },
  },
  author: { select: publicUser },
  _count: { select: { comments: true, reactions: true, attendance: true } },
} as const;
function reply(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}
async function body(request: Request) {
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    throw new HttpError(415, 'JSON erwartet.');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'Eingaben fehlen.');
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 65536) {
      await reader.cancel();
      throw new HttpError(413, 'Anfrage ist zu groß.');
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'Ungültiges JSON.');
  }
}
export async function rate(key: string, limit = 30, seconds = 900) {
  const window = Math.floor(Date.now() / (seconds * 1000));
  const bucket = await db.rateBucket.upsert({
    where: { key: digest(`${key}:${window}`) },
    create: { key: digest(`${key}:${window}`), expiresAt: new Date((window + 1) * seconds * 1000) },
    update: { count: { increment: 1 } },
  });
  if (bucket.count > limit)
    throw new HttpError(429, 'Zu viele Anfragen. Bitte später erneut versuchen.');
}
function sessionToken(request: Request) {
  return request.headers
    .get('cookie')
    ?.split(';')
    .map((v) => v.trim())
    .find((v) => v.startsWith(cookieName + '='))
    ?.slice(cookieName.length + 1);
}
async function currentUser(request: Request) {
  const token = sessionToken(request);
  if (!token || token.length > 128) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: digest(token) },
    include: { user: true },
  });
  return session && session.expiresAt > new Date() && session.user.verifiedAt ? session.user : null;
}
async function requireUser(request: Request) {
  const user = await currentUser(request);
  if (!user) throw new HttpError(401, 'Bitte zuerst anmelden.');
  return user;
}
function requireModerator(user: User) {
  if (!canModerate(user.role)) throw new HttpError(403, 'Moderationsberechtigung erforderlich.');
}
async function regionExists(id: string | null) {
  if (id && !(await db.region.findUnique({ where: { id } })))
    throw new HttpError(400, 'Unbekannte Region.');
}
function ownProfile(user: User) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    bio: user.bio,
    regionId: user.regionId,
    shareRegion: user.shareRegion,
    role: user.role,
    createdAt: user.createdAt,
  };
}
function setSession(response: NextResponse, token: string, maxAge: number) {
  response.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
  return response;
}
async function accessContent(id: string, user: User | null) {
  const item = await db.content.findUnique({ where: { id }, include: contentInclude });
  if (
    !item ||
    (!publicStatuses.includes(item.status as (typeof publicStatuses)[number]) &&
      item.authorId !== user?.id &&
      !canModerate(user?.role ?? ''))
  )
    throw new HttpError(404, 'Inhalt nicht gefunden.');
  if (
    item.vehicleEntry &&
    item.authorId !== user?.id &&
    (item.vehicleEntry.visibility !== 'PUBLIC' || item.vehicleEntry.vehicle.visibility !== 'PUBLIC')
  )
    throw new HttpError(404, 'Inhalt nicht gefunden.');
  return item;
}
export async function handle(request: Request, path: string[]) {
  try {
    const method = request.method;
    const route = path.join('/');
    if (method !== 'GET') {
      checkOrigin(request);
      await rate('write-global', 600);
    }
    if (method === 'GET' && route === 'health') {
      await db.$queryRaw`SELECT 1`;
      return reply({ status: 'ok' });
    }
    if (method === 'GET' && route === 'regions')
      return reply(await db.region.findMany({ orderBy: { name: 'asc' } }));
    if (method === 'GET' && route === 'me') {
      const user = await currentUser(request);
      return reply(user ? ownProfile(user) : null);
    }
    if (method === 'GET' && route === 'stats') {
      const [members, vehicles, posts, events] = await Promise.all([
        db.user.count({ where: { verifiedAt: { not: null } } }),
        db.vehicle.count({ where: { visibility: 'PUBLIC' } }),
        db.content.count({ where: { kind: 'POST', status: 'PUBLISHED' } }),
        db.content.count({
          where: { kind: 'EVENT', status: 'PUBLISHED', startsAt: { gte: new Date() } },
        }),
      ]);
      return reply({ members, vehicles, posts, events });
    }
    if (method === 'POST' && route === 'auth/register') {
      requireMail();
      const data = registration.parse(await body(request));
      await rate('registration', 20);
      await rate(`auth:${data.email}`, 5);
      await regionExists(data.regionId);
      const existing = await db.user.findFirst({
        where: { OR: [{ email: data.email }, { username: data.username }] },
      });
      if (existing)
        return reply(
          {
            message:
              'Falls die Angaben verfügbar sind, erhältst du eine Bestätigungs-E-Mail. Ansonsten Anmeldung oder Wiederherstellung nutzen.',
          },
          202,
        );
      const token = newToken();
      const user = await db.user.create({
        data: {
          email: data.email,
          username: data.username,
          passwordHash: await hashPassword(data.password),
          regionId: data.regionId,
          shareRegion: data.shareRegion,
          consentAt: data.shareRegion ? new Date() : null,
          tokens: {
            create: {
              tokenHash: digest(token),
              purpose: 'verify',
              expiresAt: new Date(Date.now() + 1800000),
            },
          },
        },
      });
      try {
        await sendAuthMail(user.email, token, 'verify');
      } catch {
        throw new HttpError(
          503,
          'Bestätigung konnte nicht versendet werden. Bitte „Bestätigung erneut senden“ verwenden.',
        );
      }
      return reply(
        { message: 'Bitte bestätige deine E-Mail-Adresse. Der Link ist 30 Minuten gültig.' },
        201,
      );
    }
    if (method === 'POST' && (route === 'auth/request-reset' || route === 'auth/resend')) {
      requireMail();
      const { email } = z
        .object({
          email: z
            .email()
            .max(254)
            .transform((v) => v.toLowerCase()),
        })
        .strict()
        .parse(await body(request));
      await rate(`auth:${email}`, 5);
      await rate('mail-global', 40);
      const user = await db.user.findUnique({ where: { email } });
      const purpose = route === 'auth/resend' ? 'verify' : 'reset';
      if (user && (purpose === 'reset' ? !!user.verifiedAt : !user.verifiedAt)) {
        const token = newToken();
        await db.$transaction([
          db.authToken.deleteMany({ where: { userId: user.id, purpose } }),
          db.authToken.create({
            data: {
              userId: user.id,
              purpose,
              tokenHash: digest(token),
              expiresAt: new Date(Date.now() + 1800000),
            },
          }),
        ]);
        await sendAuthMail(email, token, purpose);
      }
      return reply({ message: 'Falls ein passendes Konto existiert, erhältst du eine E-Mail.' });
    }
    if (method === 'POST' && (route === 'auth/verify' || route === 'auth/reset')) {
      const data = z
        .object({ token: z.string().min(32).max(128), password: password.optional() })
        .strict()
        .parse(await body(request));
      await rate('token-global', 100);
      const purpose = route === 'auth/verify' ? 'verify' : 'reset';
      if (purpose === 'reset' && !data.password) throw new HttpError(400, 'Neues Passwort fehlt.');
      const newHash = data.password ? await hashPassword(data.password) : null;
      await db.$transaction(async (tx) => {
        const token = await tx.authToken.findUnique({ where: { tokenHash: digest(data.token) } });
        if (!token || token.purpose !== purpose || token.expiresAt < new Date())
          throw new HttpError(400, 'Link ungültig oder abgelaufen.');
        const consumed = await tx.authToken.deleteMany({ where: { tokenHash: token.tokenHash } });
        if (!consumed.count) throw new HttpError(400, 'Link bereits verwendet.');
        await tx.user.update({
          where: { id: token.userId },
          data: purpose === 'verify' ? { verifiedAt: new Date() } : { passwordHash: newHash! },
        });
        if (purpose === 'reset') await tx.session.deleteMany({ where: { userId: token.userId } });
      });
      return reply({
        message:
          purpose === 'verify'
            ? 'E-Mail bestätigt. Du kannst dich jetzt anmelden.'
            : 'Passwort geändert. Bitte erneut anmelden.',
      });
    }
    if (method === 'POST' && route === 'auth/login') {
      const data = z
        .object({
          email: z
            .email()
            .max(254)
            .transform((v) => v.toLowerCase()),
          password: z.string().min(1).max(128),
        })
        .strict()
        .parse(await body(request));
      await rate(`login:${data.email}`, 10);
      await rate('login-global', 100);
      const user = await db.user.findUnique({ where: { email: data.email } });
      // The same costly KDF also runs for unknown accounts.
      const hash =
        user?.passwordHash ?? `scrypt-v1$00000000000000000000000000000000$${'0'.repeat(128)}`;
      if (!(await checkPassword(data.password, hash)) || !user || !user.verifiedAt)
        throw new HttpError(
          401,
          'Anmeldung fehlgeschlagen. Angaben und E-Mail-Bestätigung prüfen.',
        );
      const token = newToken();
      await db.session.create({
        data: {
          tokenHash: digest(token),
          userId: user.id,
          expiresAt: new Date(Date.now() + 604800000),
        },
      });
      return setSession(reply(ownProfile(user)), token, 604800);
    }
    if (method === 'POST' && route === 'auth/logout') {
      const token = sessionToken(request);
      if (token) await db.session.deleteMany({ where: { tokenHash: digest(token) } });
      return setSession(reply({ ok: true }), '', 0);
    }
    if (route === 'profile') {
      const user = await requireUser(request);
      if (method === 'PATCH') {
        const data = profile.parse(await body(request));
        await regionExists(data.regionId);
        return reply(
          ownProfile(
            await db.user.update({
              where: { id: user.id },
              data: {
                ...data,
                consentAt: data.shareRegion ? (user.consentAt ?? new Date()) : null,
              },
            }),
          ),
        );
      }
      if (method === 'DELETE') {
        const data = z
          .object({ password: z.string().max(128) })
          .strict()
          .parse(await body(request));
        await rate(`delete:${user.id}`, 5);
        if (!(await checkPassword(data.password, user.passwordHash)))
          throw new HttpError(403, 'Passwort nicht korrekt.');
        await db.$transaction([
          db.audit.updateMany({
            where: { actorId: user.id },
            data: { actorId: 'deleted-account' },
          }),
          db.user.delete({ where: { id: user.id } }),
        ]);
        return setSession(reply({ ok: true }), '', 0);
      }
    }
    if (method === 'GET' && route === 'profile/export') {
      const user = await requireUser(request);
      await rate(`export:${user.id}`, 5);
      const [
        vehicles,
        contents,
        comments,
        reactions,
        attendance,
        notifications,
        reports,
        sessions,
        subscriptions,
      ] = await Promise.all([
        db.vehicle.findMany({
          where: { ownerId: user.id },
          include: {
            entries: { include: { versions: { where: { expiresAt: { gt: new Date() } } } } },
            parts: true,
            milestones: true,
            changes: true,
            media: { select: mediaMetadata },
          },
        }),
        db.content.findMany({ where: { authorId: user.id } }),
        db.comment.findMany({ where: { authorId: user.id } }),
        db.reaction.findMany({ where: { userId: user.id } }),
        db.attendance.findMany({ where: { userId: user.id } }),
        db.notification.findMany({ where: { userId: user.id } }),
        db.report.findMany({ where: { reporterId: user.id } }),
        db.session.findMany({ where: { userId: user.id }, select: { expiresAt: true } }),
        db.subscription.findMany({ where: { userId: user.id } }),
      ]);
      const response = reply({
        exportedAt: new Date(),
        profile: { ...ownProfile(user), consentAt: user.consentAt },
        notificationPreferences: {
          notifyComments: user.notifyComments,
          notifyReplies: user.notifyReplies,
          notifySubscriptions: user.notifySubscriptions,
          notifyReactions: user.notifyReactions,
        },
        subscriptions,
        reports,
        sessions,
        vehicles,
        contents,
        comments,
        reactions,
        attendance,
        notifications,
      });
      response.headers.set('Content-Disposition', 'attachment; filename="pumamap-export.json"');
      return response;
    }
    if (method === 'GET' && route === 'members') {
      const user = await requireUser(request);
      if (!user.shareRegion)
        throw new HttpError(
          403,
          'Die Mitgliederkarte setzt deine freiwillige regionale Freigabe voraus. Öffentliche Inhalte bleiben zugänglich.',
        );
      return reply(
        await db.user.findMany({
          where: { shareRegion: true, verifiedAt: { not: null } },
          select: {
            ...publicUser,
            region: { select: { id: true, name: true, latitude: true, longitude: true } },
            vehicles: {
              where: { visibility: 'PUBLIC' },
              select: { id: true, name: true, variant: true, year: true, color: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 200,
        }),
      );
    }
    if (method === 'GET' && path[0] === 'members' && path[1]) {
      const member = await db.user.findUnique({
        where: { id: path[1] },
        select: {
          ...publicUser,
          verifiedAt: true,
          shareRegion: true,
          region: { select: { name: true } },
          vehicles: { where: { visibility: 'PUBLIC' } },
          contents: {
            where: publicContentWhere,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: 20,
            select: { id: true, kind: true, title: true, createdAt: true },
          },
          _count: {
            select: {
              vehicles: { where: { visibility: 'PUBLIC' } },
              contents: { where: publicContentWhere },
            },
          },
        },
      });
      if (!member?.verifiedAt) throw new HttpError(404, 'Profil nicht gefunden.');
      const { verifiedAt: _verified, shareRegion, region, ...rest } = member;
      void _verified;
      return reply({ ...rest, region: shareRegion ? region : null });
    }
    if (
      path[0] === 'vehicles' &&
      path[1] &&
      ['media', 'parts', 'milestones', 'changes'].includes(path[2])
    ) {
      return await workspace(request, path, await currentUser(request), body, rate);
    }
    if (route === 'vehicles') {
      if (method === 'GET') {
        const mine = new URL(request.url).searchParams.get('mine') === 'true';
        const user = mine ? await requireUser(request) : null;
        return reply(
          await db.vehicle.findMany({
            where: mine ? { ownerId: user!.id } : { visibility: 'PUBLIC' },
            include: { owner: { select: publicUser } },
            orderBy: { createdAt: 'desc' },
            take: 100,
          }),
        );
      }
      if (method === 'POST') {
        const user = await requireUser(request);
        await rate(`vehicle:${user.id}`, 20);
        const data = vehicle.parse(await body(request));
        return reply(await db.vehicle.create({ data: { ...data, ownerId: user.id } }), 201);
      }
    }
    if (path[0] === 'vehicles' && path[1] && path.length === 2 && method === 'GET') {
      const user = await currentUser(request);
      const item = await db.vehicle.findFirst({
        where: {
          id: path[1],
          OR: [{ visibility: 'PUBLIC' }, ...(user ? [{ ownerId: user.id }] : [])],
        },
        include: { owner: { select: publicUser } },
      });
      if (!item) throw new HttpError(404, 'Fahrzeug nicht gefunden.');
      return reply({ ...item, canEdit: item.ownerId === user?.id });
    }
    if (
      path[0] === 'vehicles' &&
      path[2] === 'entries' &&
      path.length === 5 &&
      ['versions', 'restore'].includes(path[4])
    )
      return await journalHistory(request, path, await currentUser(request), body, rate);
    if (path[0] === 'vehicles' && path[1] && path[2] === 'entries' && path.length <= 5) {
      const user = await currentUser(request);
      const item = await db.vehicle.findFirst({
        where: {
          id: path[1],
          OR: [{ visibility: 'PUBLIC' }, ...(user ? [{ ownerId: user.id }] : [])],
        },
      });
      if (!item) throw new HttpError(404, 'Fahrzeug nicht gefunden.');
      const owner = item.ownerId === user?.id;
      if (method === 'GET' && path.length === 3) {
        const cursor = new URL(request.url).searchParams.get('cursor');
        if (
          cursor &&
          (cursor.length > 100 ||
            !(await db.vehicleEntry.findFirst({
              where: {
                id: cursor,
                vehicleId: item.id,
                ...(!owner ? { visibility: 'PUBLIC' as const } : {}),
              },
              select: { id: true },
            })))
        )
          throw new HttpError(400, 'Ungültige Seitenreferenz. Bitte die Historie neu laden.');
        const params = new URL(request.url).searchParams;
        const kind = z
          .enum(['BUILD', 'MAINTENANCE', 'REPAIR'])
          .optional()
          .parse(params.get('kind') ?? undefined);
        const q = (params.get('q') ?? '').slice(0, 100);
        const rows = await db.vehicleEntry.findMany({
          where: {
            vehicleId: item.id,
            ...(!owner ? { visibility: 'PUBLIC' as const } : {}),
            ...(kind ? { kind } : {}),
            ...(q
              ? {
                  OR: [
                    { title: { contains: q, mode: 'insensitive' } },
                    { body: { contains: q, mode: 'insensitive' } },
                  ],
                }
              : {}),
          },
          orderBy: [{ occurredOn: 'desc' }, { id: 'desc' }],
          take: 51,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
          select: {
            id: true,
            vehicleId: true,
            kind: true,
            title: true,
            body: true,
            occurredOn: true,
            mileage: true,
            visibility: true,
            updatedAt: true,
            costCents: owner,
            revision: true,
            keepVersions: owner,
            category: true,
            progress: true,
            communityBuild: { select: { id: true, status: true } },
          },
        });
        return reply({
          entries: rows.slice(0, 50).map((row) => ({
            ...row,
            communityBuild:
              owner || row.communityBuild?.status === 'PUBLISHED' ? row.communityBuild : null,
          })),
          nextCursor: rows.length > 50 ? rows[49].id : null,
        });
      }
      if (!user) throw new HttpError(401, 'Bitte zuerst anmelden.');
      if (!owner) throw new HttpError(404, 'Fahrzeug nicht gefunden.');
      await rate(`journal:${user.id}`, 60);
      if (method === 'POST' && path.length === 3) {
        const data = vehicleEntry.parse(await body(request));
        const created = await db.$transaction(async (tx) => {
          const entry = await tx.vehicleEntry.create({
            data: { ...data, occurredOn: new Date(data.occurredOn), vehicleId: item.id },
          });
          await recordChange(
            tx,
            item.id,
            user.id,
            entry.id,
            'entries',
            'CREATE',
            Object.keys(data),
          );
          return entry;
        });
        return reply(created, 201);
      }
      if (path[3] && path[4] === 'publish' && method === 'POST') {
        const data = publishBuild.parse(await body(request));
        const result = await db.$transaction(async (tx) => {
          await tx.$queryRaw`SELECT "id" FROM "Vehicle" WHERE "id"=${item.id} FOR UPDATE`;
          // Consistent vehicle-then-entry lock order for publication and recovery.
          await tx.$queryRaw`SELECT "id" FROM "VehicleEntry" WHERE "id" = ${path[3]} AND "vehicleId" = ${item.id} FOR UPDATE`;
          const entry = await tx.vehicleEntry.findFirst({
            where: { id: path[3], vehicleId: item.id },
            include: { communityBuild: true, vehicle: true },
          });
          if (!entry) throw new HttpError(404, 'Eintrag nicht gefunden.');
          if (
            entry.kind !== 'BUILD' ||
            entry.visibility !== 'PUBLIC' ||
            entry.vehicle.visibility !== 'PUBLIC'
          )
            throw new HttpError(
              409,
              'Fahrzeug und Build-Eintrag müssen zuvor ausdrücklich öffentlich freigegeben sein.',
            );
          if (entry.communityBuild)
            throw new HttpError(409, 'Dieser Eintrag besitzt bereits einen Community-Build.');
          return tx.content.create({
            data: {
              ...{ title: data.title, body: data.body },
              kind: 'BUILD',
              category: entry.category,
              authorId: user.id,
              vehicleEntryId: entry.id,
              status: 'PUBLISHED',
            },
          });
        });
        return reply(result, 201);
      }
      if (path.length === 4 && path[3] && (method === 'PATCH' || method === 'DELETE')) {
        const input =
          method === 'PATCH'
            ? journalUpdate.parse(await body(request))
            : journalDelete.parse(await body(request));
        const { expectedRevision, ...rest } = input;
        const data = method === 'PATCH' ? vehicleEntry.parse(rest) : null;
        await db.$transaction(async (tx) => {
          await tx.$queryRaw`SELECT "id" FROM "Vehicle" WHERE "id"=${item.id} FOR UPDATE`;
          const before = await tx.vehicleEntry.findFirst({
            where: { id: path[3], vehicleId: item.id },
          });
          if (!before) throw new HttpError(404, 'Eintrag nicht gefunden.');
          assertRevision(before.revision, expectedRevision);
          if (method === 'DELETE') {
            // Removing a private link must never make dependent records public again.
            await tx.vehiclePart.updateMany({
              where: { entryId: before.id },
              data: { visibility: 'PRIVATE' },
            });
            await tx.vehicleMilestone.updateMany({
              where: { OR: [{ entryId: before.id }, { part: { entryId: before.id } }] },
              data: { visibility: 'PRIVATE' },
            });
            await tx.vehicleMedia.updateMany({
              where: {
                OR: [
                  { part: { entryId: before.id } },
                  { milestone: { OR: [{ entryId: before.id }, { part: { entryId: before.id } }] } },
                ],
              },
              data: { visibility: 'PRIVATE' },
            });
            await tx.vehicleEntry.delete({ where: { id: before.id } });
          } else if (data) {
            if (data.keepVersions) await rememberEntry(tx, before, user.id);
            else await tx.vehicleEntryVersion.deleteMany({ where: { entryId: before.id } });
            await tx.vehicleEntry.update({
              where: { id: before.id },
              data: { ...data, occurredOn: new Date(data.occurredOn), revision: { increment: 1 } },
            });
          }
          const fields = data
            ? Object.keys(data).filter((key) => {
                const old = before[key as keyof typeof before];
                return (
                  (old instanceof Date ? old.toISOString().slice(0, 10) : old) !==
                  data[key as keyof typeof data]
                );
              })
            : [];
          if (method === 'DELETE' || fields.length)
            await recordChange(
              tx,
              item.id,
              user.id,
              before.id,
              'entries',
              method === 'DELETE' ? 'DELETE' : 'UPDATE',
              fields,
            );
        });
        return reply({ ok: true });
      }
    }
    if (
      path[0] === 'vehicles' &&
      path[1] &&
      path.length === 2 &&
      (method === 'PATCH' || method === 'DELETE')
    ) {
      const user = await requireUser(request);
      const item = await db.vehicle.findUnique({ where: { id: path[1] } });
      if (!item || item.ownerId !== user.id) throw new HttpError(404, 'Fahrzeug nicht gefunden.');
      if (method === 'DELETE') {
        await db.vehicle.delete({ where: { id: item.id } });
        return reply({ ok: true });
      }
      const data = vehicle.parse(await body(request));
      return reply(
        await db.$transaction(async (tx) => {
          await tx.$queryRaw`SELECT "id" FROM "Vehicle" WHERE "id"=${item.id} FOR UPDATE`;
          const before = await tx.vehicle.findUniqueOrThrow({ where: { id: item.id } });
          const updated = await tx.vehicle.update({ where: { id: item.id }, data });
          const fields = Object.keys(data).filter(
            (key) => before[key as keyof typeof before] !== data[key as keyof typeof data],
          );
          if (fields.length)
            await recordChange(tx, item.id, user.id, item.id, 'vehicle', 'UPDATE', fields);
          return updated;
        }),
      );
    }
    if (route === 'notification-preferences') {
      const user = await requireUser(request);
      if (method === 'GET')
        return reply(
          await db.user.findUnique({ where: { id: user.id }, select: preferenceFields }),
        );
      if (method === 'PATCH')
        return reply(
          await db.user.update({
            where: { id: user.id },
            data: preferences.parse(await body(request)),
            select: preferenceFields,
          }),
        );
    }
    if (route === 'discover' && method === 'GET') {
      const params = new URL(request.url).searchParams;
      const kind = z
        .enum(['MEMBER', 'VEHICLE', 'POST', 'TOPIC', 'BUILD'])
        .parse(params.get('kind') ?? 'POST');
      const q = z
        .string()
        .trim()
        .max(100)
        .parse(params.get('q') ?? '');
      const page = z.coerce
        .number()
        .int()
        .min(1)
        .max(1000)
        .parse(params.get('page') ?? 1);
      const order = z.enum(['newest', 'oldest']).parse(params.get('sort') ?? 'newest');
      const direction = order === 'newest' ? ('desc' as const) : ('asc' as const);
      const paging = {
        take: 21,
        skip: (page - 1) * 20,
        orderBy: [{ createdAt: direction }, { id: direction }],
      };
      let results;
      if (kind === 'MEMBER')
        results = await db.user.findMany({
          where: { verifiedAt: { not: null }, username: { contains: q, mode: 'insensitive' } },
          ...paging,
          select: publicUser,
        });
      else if (kind === 'VEHICLE')
        results = await db.vehicle.findMany({
          where: {
            visibility: 'PUBLIC',
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { variant: { contains: q, mode: 'insensitive' } },
            ],
          },
          ...paging,
          select: {
            id: true,
            name: true,
            variant: true,
            year: true,
            owner: { select: publicUser },
          },
        });
      else
        results = await db.content.findMany({
          where: {
            AND: [publicCommunity],
            kind,
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { body: { contains: q, mode: 'insensitive' } },
            ],
          },
          ...paging,
          include: contentInclude,
        });
      return reply({ results: results.slice(0, 20), hasMore: results.length > 20, page, kind });
    }
    if (route === 'contents') {
      if (method === 'GET') {
        const params = new URL(request.url).searchParams;
        const kind = z
          .enum(['POST', 'TOPIC', 'LISTING', 'EVENT', 'WIKI', 'BUILD'])
          .parse(params.get('kind') ?? 'POST');
        const q = (params.get('q') ?? '').slice(0, 100);
        const mine = params.get('mine') === 'true';
        const user = mine ? await requireUser(request) : null;
        const page = z.coerce
          .number()
          .int()
          .min(1)
          .max(1000)
          .parse(params.get('page') ?? 1);
        const rows = await db.content.findMany({
          where: {
            ...(params.get('feed') === 'true' && kind === 'POST'
              ? { kind: { in: ['POST' as const, 'BUILD' as const] } }
              : { kind }),
            ...(mine ? { authorId: user!.id } : { AND: [publicContentWhere] }),
            ...(q
              ? {
                  OR: [
                    { title: { contains: q, mode: 'insensitive' } },
                    { body: { contains: q, mode: 'insensitive' } },
                  ],
                }
              : {}),
          },
          include: contentInclude,
          orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
          skip: params.has('page') ? (page - 1) * 20 : 0,
          take: params.has('page') ? 21 : 50,
        });
        return reply(
          params.has('page') ? { items: rows.slice(0, 20), hasMore: rows.length > 20, page } : rows,
        );
      }
      if (method === 'POST') {
        const user = await requireUser(request);
        await rate(`content:${user.id}`, 20);
        const data = content.parse(await body(request));
        return reply(
          await db.content.create({
            data: {
              ...data,
              startsAt: data.startsAt ? new Date(data.startsAt) : null,
              authorId: user.id,
              status: data.kind === 'WIKI' ? 'DRAFT' : 'PUBLISHED',
            },
          }),
          201,
        );
      }
    }
    if (path[0] === 'contents' && path[1]) {
      const user = await currentUser(request);
      const item = await accessContent(path[1], user);
      if (method === 'GET' && path[2] === 'comments') {
        const page = z.coerce
          .number()
          .int()
          .min(1)
          .max(1000)
          .parse(new URL(request.url).searchParams.get('page') ?? 1);
        const rows = await db.comment.findMany({
          where: { contentId: item.id },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          skip: (page - 1) * 20,
          take: 21,
          include: {
            author: { select: publicUser },
            parent: { select: { id: true, author: { select: { username: true } }, removed: true } },
          },
        });
        return reply({ items: rows.slice(0, 20), hasMore: rows.length > 20, page });
      }
      if (method === 'GET' && path.length === 2) {
        const [comments, reactions, attendance, revisions] = await Promise.all([
          db.comment.findMany({
            where: { contentId: item.id },
            include: { author: { select: publicUser } },
            orderBy: { createdAt: 'asc' },
            take: 100,
          }),
          user ? db.reaction.findMany({ where: { contentId: item.id, userId: user.id } }) : [],
          user
            ? db.attendance.findUnique({
                where: { userId_contentId: { userId: user.id, contentId: item.id } },
              })
            : null,
          item.kind === 'WIKI'
            ? db.revision.findMany({
                where: { contentId: item.id },
                orderBy: { createdAt: 'desc' },
                take: 20,
              })
            : [],
        ]);
        return reply({
          ...item,
          comments,
          myReactions: reactions,
          attending: !!attendance,
          revisions,
          subscribed: user
            ? !!(await db.subscription.findUnique({
                where: { userId_contentId: { userId: user.id, contentId: item.id } },
              }))
            : false,
        });
      }
      if (!user) throw new HttpError(401, 'Bitte zuerst anmelden.');
      await rate(`activity:${user.id}`, 60);
      if (method === 'PATCH' && path.length === 2) {
        if (item.authorId !== user.id)
          throw new HttpError(403, 'Nur eigene Inhalte können bearbeitet werden.');
        if (item.status === 'HIDDEN')
          throw new HttpError(403, 'Moderierte Inhalte können nicht bearbeitet werden.');
        const data = content.parse(await body(request));
        if (data.kind !== item.kind)
          throw new HttpError(400, 'Inhaltstyp kann nicht geändert werden.');
        return reply(
          await db.$transaction(async (tx) => {
            if (item.kind === 'WIKI')
              await tx.revision.create({
                data: {
                  contentId: item.id,
                  title: item.title,
                  body: item.body,
                  sourceUrl: item.sourceUrl,
                },
              });
            return tx.content.update({
              where: { id: item.id },
              data: {
                ...data,
                startsAt: data.startsAt ? new Date(data.startsAt) : null,
                status: item.kind === 'WIKI' ? 'DRAFT' : item.status,
              },
            });
          }),
        );
      }
      if (method === 'DELETE' && path.length === 2) {
        if (item.authorId !== user.id)
          throw new HttpError(403, 'Nur eigene Inhalte können gelöscht werden.');
        await db.content.delete({ where: { id: item.id } });
        return reply({ ok: true });
      }
      if (['comments', 'subscription', 'discussion'].includes(path[2])) {
        const input = method === 'DELETE' ? null : await body(request);
        return reply(
          await discussion(item.id, path[2], path[3], method, user, input),
          method === 'POST' && path[2] === 'comments' ? 201 : 200,
        );
      }
      if (method === 'POST' && path[2] === 'reaction') {
        const { type } = z
          .object({ type: z.enum(['LIKE', 'SAVE']) })
          .strict()
          .parse(await body(request));
        const key = { userId: user.id, contentId: item.id, type };
        await db.$transaction(async (tx) => {
          await tx.reaction.upsert({
            where: { userId_contentId_type: key },
            create: key,
            update: {},
          });
          if (type === 'LIKE' && user.id !== item.authorId) {
            const recipient = await tx.user.findUniqueOrThrow({ where: { id: item.authorId } });
            if (recipient.notifyReactions)
              await notify(tx, recipient.id, item.id, 'REACTION', `like:${item.id}:${user.id}`);
          }
        });
        return reply({ ok: true });
      }
      if (method === 'DELETE' && path[2] === 'reaction') {
        const { type } = z
          .object({ type: z.enum(['LIKE', 'SAVE']) })
          .strict()
          .parse(await body(request));
        await db.reaction.deleteMany({ where: { userId: user.id, contentId: item.id, type } });
        return reply({ ok: true });
      }
      if (path[2] === 'attend' && (method === 'POST' || method === 'DELETE')) {
        if (
          item.kind !== 'EVENT' ||
          item.status !== 'PUBLISHED' ||
          !item.startsAt ||
          item.startsAt < new Date()
        )
          throw new HttpError(409, 'Anmeldung für dieses Event nicht verfügbar.');
        const key = { userId: user.id, contentId: item.id };
        if (method === 'POST')
          await db.attendance.upsert({ where: { userId_contentId: key }, create: key, update: {} });
        else await db.attendance.deleteMany({ where: key });
        return reply({ ok: true });
      }
      if (method === 'POST' && path[2] === 'report') {
        const { reason } = z
          .object({ reason: z.string().trim().min(10).max(1000) })
          .strict()
          .parse(await body(request));
        await rate(`report:${user.id}`, 5);
        return reply(
          await db.report.create({ data: { contentId: item.id, reporterId: user.id, reason } }),
          201,
        );
      }
      if (method === 'PATCH' && path[2] === 'status') {
        if (item.authorId !== user.id || item.kind !== 'LISTING' || item.status === 'HIDDEN')
          throw new HttpError(403, 'Nicht erlaubt.');
        const { status } = z
          .object({ status: z.enum(['PUBLISHED', 'RESERVED', 'SOLD']) })
          .strict()
          .parse(await body(request));
        return reply(await db.content.update({ where: { id: item.id }, data: { status } }));
      }
    }
    if (path[0] === 'notifications' && path[1] && method === 'PATCH') {
      const user = await requireUser(request);
      const changed = await db.notification.updateMany({
        where: { id: path[1], userId: user.id },
        data: { read: true },
      });
      if (!changed.count) throw new HttpError(404, 'Benachrichtigung nicht gefunden.');
      return reply({ ok: true });
    }
    if (route === 'notifications') {
      const user = await requireUser(request);
      if (method === 'GET') {
        const paging = listPagination(request);
        const rows = await db.notification.findMany({
          where: {
            userId: user.id,
            OR: [
              { contentId: null },
              { content: { OR: [publicCommunity, { authorId: user.id }] } },
            ],
          },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          ...paging.query,
        });
        return reply(paging.result(rows));
      }
      if (method === 'PATCH') {
        await db.notification.updateMany({
          where: { userId: user.id, read: false },
          data: { read: true },
        });
        return reply({ ok: true });
      }
    }
    if (method === 'GET' && route === 'saved') {
      const user = await requireUser(request);
      const paging = listPagination(request);
      const q = (new URL(request.url).searchParams.get('q') ?? '').slice(0, 100);
      const rows = await db.content.findMany({
        where: {
          AND: [publicContentWhere],
          ...(q
            ? {
                OR: [
                  { title: { contains: q, mode: 'insensitive' } },
                  { body: { contains: q, mode: 'insensitive' } },
                ],
              }
            : {}),
          reactions: { some: { userId: user.id, type: 'SAVE' } },
        },
        include: contentInclude,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        ...paging.query,
      });
      return reply(paging.result(rows));
    }
    if (path[0] === 'admin') {
      const user = await requireUser(request);
      requireModerator(user);
      if (method === 'GET' && route === 'admin') {
        const [reports, drafts, audit] = await Promise.all([
          db.report.findMany({
            where: { resolved: false },
            include: { content: { select: { id: true, title: true } } },
            take: 100,
          }),
          db.content.findMany({
            where: { kind: 'WIKI', status: 'DRAFT' },
            include: contentInclude,
            take: 100,
          }),
          db.audit.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
        ]);
        return reply({ reports, drafts, audit });
      }
      if (method === 'POST' && route === 'admin/moderate') {
        const data = z
          .object({
            contentId: z.string().max(100),
            action: z.enum(['HIDE', 'PUBLISH']),
            reason: z.string().trim().min(10).max(500),
          })
          .strict()
          .parse(await body(request));
        const item = await db.content.findUnique({ where: { id: data.contentId } });
        if (!item) throw new HttpError(404, 'Inhalt nicht gefunden.');
        if (data.action === 'PUBLISH' && item.kind === 'WIKI' && item.authorId === user.id)
          throw new HttpError(403, 'Wiki-Freigabe benötigt eine zweite moderierende Person.');
        await db.$transaction([
          db.content.update({
            where: { id: item.id },
            data: { status: data.action === 'HIDE' ? 'HIDDEN' : 'PUBLISHED' },
          }),
          db.report.updateMany({ where: { contentId: item.id }, data: { resolved: true } }),
          db.audit.create({
            data: { actorId: user.id, action: `${data.action}: ${data.reason}`, targetId: item.id },
          }),
          db.notification.create({
            data: {
              userId: item.authorId,
              text: `Moderation: „${item.title}“ wurde ${data.action === 'HIDE' ? 'ausgeblendet' : 'freigegeben'}. ${data.reason}`,
            },
          }),
        ]);
        return reply({ ok: true });
      }
    }
    throw new HttpError(404, 'Endpunkt nicht gefunden.');
  } catch (error) {
    if (error instanceof HttpError) return reply({ error: error.message }, error.status);
    if (error instanceof ZodError)
      return reply({ error: error.issues.map((i) => i.message).join(' ') }, 400);
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002')
      return reply({ error: 'Eintrag bereits vorhanden. Bitte Angaben prüfen.' }, 409);
    const incident = newToken().slice(0, 12);
    console.error('pumamap_error', {
      incident,
      type: error instanceof Error ? error.name : 'Unknown',
    });
    return reply({ error: `Anfrage fehlgeschlagen. Referenz: ${incident}` }, 500);
  }
}
