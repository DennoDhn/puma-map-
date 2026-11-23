import { NextResponse } from 'next/server';
import { db } from './db';
import { HttpError } from './security';
import { normalizeImage } from './media';
import { partInput, milestoneInput, mediaInput } from './workspace-validation';
import type { User, Prisma } from '@/generated/prisma/client';
const metadata = {
  id: true,
  vehicleId: true,
  entryId: true,
  partId: true,
  milestoneId: true,
  caption: true,
  visibility: true,
  cover: true,
  position: true,
  width: true,
  height: true,
  createdAt: true,
  updatedAt: true,
} as const;
export const mediaMetadata = metadata;
const reply = (data: unknown, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
const missing = () => new HttpError(404, 'Eintrag nicht gefunden.');
export async function recordChange(
  tx: Prisma.TransactionClient,
  vehicleId: string,
  actorId: string,
  entityId: string,
  entityType: string,
  action: string,
  fields: string[],
) {
  await tx.vehicleChange.create({
    data: { vehicleId, actorId, entityId, entityType, action, fields },
  });
}
export async function workspace(
  request: Request,
  path: string[],
  user: User | null,
  readBody: (r: Request) => Promise<unknown>,
  rate: (key: string, limit?: number) => Promise<void>,
) {
  const vehicleId = path[1],
    resource = path[2],
    id = path[3],
    method = request.method;
  const vehicle = await db.vehicle.findFirst({
    where: {
      id: vehicleId,
      OR: [{ visibility: 'PUBLIC' }, ...(user ? [{ ownerId: user.id }] : [])],
    },
  });
  if (!vehicle) throw missing();
  const owner = vehicle.ownerId === user?.id;
  const visibleEntry = { OR: [{ entryId: null }, { entry: { visibility: 'PUBLIC' as const } }] };
  const visiblePart = { visibility: 'PUBLIC' as const, ...visibleEntry };
  const visibleMilestone = {
    visibility: 'PUBLIC' as const,
    AND: [visibleEntry, { OR: [{ partId: null }, { part: visiblePart }] }],
  };
  if (method === 'GET') {
    if (resource === 'changes' && path.length === 3) {
      if (!owner) throw missing();
      const cursor = new URL(request.url).searchParams.get('cursor');
      if (cursor && !(await db.vehicleChange.findFirst({ where: { id: cursor, vehicleId } })))
        throw new HttpError(400, 'Ungültige Seite.');
      const rows = await db.vehicleChange.findMany({
        where: { vehicleId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 51,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });
      return reply({
        changes: rows.slice(0, 50),
        nextCursor: rows.length > 50 ? rows[49].id : null,
      });
    }
    if (resource === 'media') {
      const where = {
        vehicleId,
        ...(!owner
          ? {
              visibility: 'PUBLIC' as const,
              vehicle: { visibility: 'PUBLIC' as const },
              AND: [
                visibleEntry,
                { OR: [{ partId: null }, { part: visiblePart }] },
                { OR: [{ milestoneId: null }, { milestone: visibleMilestone }] },
              ],
            }
          : {}),
      };
      if (path.length === 3)
        return reply(
          await db.vehicleMedia.findMany({
            where,
            select: metadata,
            orderBy: [{ cover: 'desc' }, { position: 'asc' }, { id: 'asc' }],
          }),
        );
      if (path.length === 5 && path[4] === 'file') {
        const thumb = new URL(request.url).searchParams.get('size') === 'thumb';
        const media = await db.vehicleMedia.findFirst({
          where: { ...where, id },
          select: { image: !thumb, thumbnail: thumb },
        });
        if (!media) throw missing();
        return new Response(new Uint8Array(thumb ? media.thumbnail : media.image), {
          headers: {
            'Content-Type': 'image/webp',
            'Cache-Control': 'private, no-store',
            'X-Content-Type-Options': 'nosniff',
            'Cross-Origin-Resource-Policy': 'same-origin',
            'Content-Disposition': 'inline; filename="pumamap.webp"',
          },
        });
      }
    }
    if (resource === 'parts' && path.length === 3)
      return reply(
        await db.vehiclePart.findMany({
          where: {
            vehicleId,
            ...(!owner
              ? { visibility: 'PUBLIC', vehicle: { visibility: 'PUBLIC' }, ...visibleEntry }
              : {}),
          },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          select: {
            id: true,
            vehicleId: true,
            entryId: true,
            name: true,
            category: true,
            manufacturer: true,
            partNumber: true,
            condition: true,
            status: true,
            installedOn: true,
            mileage: true,
            notes: true,
            visibility: true,
            createdAt: true,
            updatedAt: true,
            source: owner,
            priceCents: owner,
          },
        }),
      );
    if (resource === 'milestones' && path.length === 3)
      return reply(
        await db.vehicleMilestone.findMany({
          where: {
            vehicleId,
            ...(!owner
              ? {
                  visibility: 'PUBLIC',
                  vehicle: { visibility: 'PUBLIC' },
                  AND: [
                    visibleEntry,
                    {
                      OR: [
                        { partId: null },
                        {
                          part: {
                            visibility: 'PUBLIC',
                            vehicle: { visibility: 'PUBLIC' },
                            ...visibleEntry,
                          },
                        },
                      ],
                    },
                  ],
                }
              : {}),
          },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        }),
      );
    throw missing();
  }
  if (!user) throw new HttpError(401, 'Bitte zuerst anmelden.');
  if (!owner) throw missing();
  await rate(`workspace:${user.id}`, 120);
  if (resource === 'changes') throw new HttpError(405, 'Änderungsverlauf ist schreibgeschützt.');
  if (
    path.length > 4 ||
    !['POST', 'PATCH', 'DELETE'].includes(method) ||
    (method !== 'POST' && !id)
  )
    throw missing();
  if (resource !== 'media' && method === 'POST' && id) throw missing();
  let data:
    | ReturnType<typeof partInput.parse>
    | ReturnType<typeof milestoneInput.parse>
    | ReturnType<typeof mediaInput.parse>
    | null = null;
  let image: Awaited<ReturnType<typeof normalizeImage>> | null = null;
  if (resource === 'media' && method === 'POST') {
    await rate(`image:${user.id}`, 30);
    image = await normalizeImage(request);
  } else if (method !== 'DELETE')
    data = (
      resource === 'media' ? mediaInput : resource === 'parts' ? partInput : milestoneInput
    ).parse(await readBody(request));
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id"=${user.id} FOR UPDATE`;
    // Serialize caps, cover changes and linked writes per vehicle, including concurrent uploads.
    await tx.$queryRaw`SELECT "id" FROM "Vehicle" WHERE "id"=${vehicleId} FOR UPDATE`;
    if (!(await tx.vehicle.findFirst({ where: { id: vehicleId, ownerId: user.id } })))
      throw missing();
    if (
      data?.entryId &&
      !(await tx.vehicleEntry.findFirst({ where: { id: data.entryId, vehicleId } }))
    )
      throw new HttpError(400, 'Historieneintrag gehört nicht zu diesem Fahrzeug.');
    if (
      data &&
      'partId' in data &&
      data.partId &&
      !(await tx.vehiclePart.findFirst({ where: { id: data.partId, vehicleId } }))
    )
      throw new HttpError(400, 'Teil gehört nicht zu diesem Fahrzeug.');
    if (
      data &&
      'milestoneId' in data &&
      data.milestoneId &&
      !(await tx.vehicleMilestone.findFirst({ where: { id: data.milestoneId, vehicleId } }))
    )
      throw new HttpError(400, 'Meilenstein gehört nicht zu diesem Fahrzeug.');
    let result;
    let changed: string[] = image ? ['image'] : [];
    const changedKeys = (before: object | null, after: object) =>
      Object.keys(after).filter((key) => {
        const old = (before as Record<string, unknown> | null)?.[key];
        const value = (after as Record<string, unknown>)[key];
        return (old instanceof Date ? old.toISOString().slice(0, 10) : old) !== value;
      });
    if (resource === 'media') {
      const existing = id
        ? await tx.vehicleMedia.findFirst({ where: { id, vehicleId }, select: metadata })
        : null;
      if (id && !existing) throw missing();
      if (data) changed = changedKeys(existing, data);
      if (method === 'DELETE')
        result = await tx.vehicleMedia.delete({ where: { id }, select: { id: true } });
      else if (image) {
        if (id)
          result = await tx.vehicleMedia.update({ where: { id }, data: image, select: metadata });
        else {
          if ((await tx.vehicleMedia.count({ where: { vehicle: { ownerId: user.id } } })) >= 240)
            throw new HttpError(409, 'Maximal 240 Bilder pro Konto.');
          const count = await tx.vehicleMedia.count({ where: { vehicleId } });
          if (count >= 24) throw new HttpError(409, 'Maximal 24 Bilder pro Fahrzeug.');
          result = await tx.vehicleMedia.create({
            data: { ...image, vehicleId, position: count },
            select: metadata,
          });
        }
      } else {
        const input = data as ReturnType<typeof mediaInput.parse>;
        if (input.cover)
          await tx.vehicleMedia.updateMany({
            where: { vehicleId, cover: true },
            data: { cover: false },
          });
        result = await tx.vehicleMedia.update({ where: { id }, data: input, select: metadata });
      }
    } else if (resource === 'parts') {
      const before = id ? await tx.vehiclePart.findFirst({ where: { id, vehicleId } }) : null;
      if (id && !before) throw missing();
      if (data) changed = changedKeys(before, data);
      if (method === 'DELETE') {
        await tx.vehicleMilestone.updateMany({
          where: { partId: id },
          data: { visibility: 'PRIVATE' },
        });
        await tx.vehicleMedia.updateMany({
          where: { OR: [{ partId: id }, { milestone: { partId: id } }] },
          data: { visibility: 'PRIVATE' },
        });
        result = await tx.vehiclePart.delete({ where: { id } });
      } else {
        const input = data as ReturnType<typeof partInput.parse>;
        const normalized = {
          ...input,
          installedOn: input.installedOn ? new Date(input.installedOn) : null,
        };
        if (id) result = await tx.vehiclePart.update({ where: { id }, data: normalized });
        else {
          if ((await tx.vehiclePart.count({ where: { vehicleId } })) >= 200)
            throw new HttpError(409, 'Maximal 200 Teile pro Fahrzeug.');
          result = await tx.vehiclePart.create({ data: { ...normalized, vehicleId } });
        }
      }
    } else if (resource === 'milestones') {
      const before = id ? await tx.vehicleMilestone.findFirst({ where: { id, vehicleId } }) : null;
      if (id && !before) throw missing();
      if (data) changed = changedKeys(before, data);
      if (method === 'DELETE') {
        await tx.vehicleMedia.updateMany({
          where: { milestoneId: id },
          data: { visibility: 'PRIVATE' },
        });
        result = await tx.vehicleMilestone.delete({ where: { id } });
      } else {
        const input = data as ReturnType<typeof milestoneInput.parse>;
        const normalized = {
          ...input,
          targetOn: input.targetOn ? new Date(input.targetOn) : null,
          completedOn: input.completedOn ? new Date(input.completedOn) : null,
        };
        if (id) result = await tx.vehicleMilestone.update({ where: { id }, data: normalized });
        else {
          if ((await tx.vehicleMilestone.count({ where: { vehicleId } })) >= 100)
            throw new HttpError(409, 'Maximal 100 Meilensteine pro Fahrzeug.');
          result = await tx.vehicleMilestone.create({ data: { ...normalized, vehicleId } });
        }
      }
    } else throw missing();
    if (method === 'DELETE' || !id || changed.length)
      await recordChange(
        tx,
        vehicleId,
        user.id,
        result.id,
        resource,
        method === 'DELETE' ? 'DELETE' : id ? 'UPDATE' : 'CREATE',
        changed,
      );
    return reply(method === 'DELETE' ? { ok: true } : result, method === 'POST' && !id ? 201 : 200);
  });
}
