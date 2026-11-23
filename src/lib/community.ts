import { z } from 'zod';
import { db } from './db';
import { HttpError, canModerate } from './security';
import type { Prisma, User } from '@/generated/prisma/client';

export const publicCommunity: Prisma.ContentWhereInput = {
  status: { in: ['PUBLISHED', 'RESERVED', 'SOLD'] },
  OR: [
    { vehicleEntryId: null },
    { vehicleEntry: { visibility: 'PUBLIC', vehicle: { visibility: 'PUBLIC' } } },
  ],
};
export const preferences = z
  .object({
    notifyComments: z.boolean(),
    notifyReplies: z.boolean(),
    notifySubscriptions: z.boolean(),
    notifyReactions: z.boolean(),
    notifyMentions: z.boolean().optional(),
  })
  .strict();
export const preferenceFields = {
  notifyComments: true,
  notifyReplies: true,
  notifySubscriptions: true,
  notifyReactions: true,
  notifyMentions: true,
} as const;
export const commentInput = z
  .object({
    body: z.string().trim().min(1).max(3000),
    parentId: z.string().min(1).max(100).nullable().default(null),
  })
  .strict();
export const publicAuthor = { id: true, username: true } as const;
export async function mentionedMembers(
  tx: Prisma.TransactionClient,
  body: string,
  authorId: string,
) {
  const names = [
    ...new Set(
      Array.from(
        body.matchAll(/(?:^|[^\p{L}\p{N}_@.+-])@([a-z0-9_]{3,24})(?![\p{L}\p{N}_])/giu),
        (match) => match[1].toLowerCase(),
      ),
    ),
  ].slice(0, 10);
  if (!names.length) return [];
  return tx.user.findMany({
    where: {
      username: { in: names },
      id: { not: authorId },
      verifiedAt: { not: null },
      notifyMentions: true,
    },
    select: { id: true },
  });
}
export async function notify(
  tx: Prisma.TransactionClient,
  userId: string,
  contentId: string,
  kind: string,
  eventKey: string,
) {
  // No copied titles or private source text: availability is checked whenever notices are read.
  await tx.notification.upsert({
    where: { eventKey },
    create: {
      userId,
      contentId,
      kind,
      eventKey,
      text:
        kind === 'MENTION'
          ? 'Du wurdest in der Community erwähnt.'
          : kind === 'REACTION'
            ? 'Neue Reaktion auf deinen Beitrag.'
            : kind === 'REPLY'
              ? 'Neue Antwort auf deinen Kommentar.'
              : 'Neuer Diskussionsbeitrag.',
    },
    update: {},
  });
}
export async function discussion(
  contentId: string,
  action: string,
  targetId: string | undefined,
  method: string,
  user: User | null,
  input: unknown,
) {
  if (!user) throw new HttpError(401, 'Bitte zuerst anmelden.');
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Content" WHERE "id"=${contentId} FOR UPDATE`;
    const item = await tx.content.findFirst({
      where: {
        id: contentId,
        OR: [
          { authorId: user.id },
          publicCommunity,
          ...(canModerate(user.role) ? [{ status: 'HIDDEN' as const }] : []),
        ],
      },
    });
    if (!item) throw new HttpError(404, 'Inhalt nicht gefunden.');
    if (action === 'discussion' && method === 'PATCH') {
      if (!canModerate(user.role) || item.kind !== 'TOPIC')
        throw new HttpError(403, 'Nur die Moderation darf Themen verwalten.');
      const data = z.object({ locked: z.boolean(), pinned: z.boolean() }).strict().parse(input);
      await tx.content.update({ where: { id: contentId }, data });
      await tx.audit.create({
        data: {
          actorId: user.id,
          action: `TOPIC_STATE locked=${data.locked} pinned=${data.pinned}`,
          targetId: contentId,
        },
      });
      return { ok: true };
    }
    if (action === 'subscription' && ['POST', 'DELETE'].includes(method)) {
      if (item.kind !== 'TOPIC' || item.status !== 'PUBLISHED')
        throw new HttpError(409, 'Abonnement nicht verfügbar.');
      const key = { userId: user.id, contentId };
      if (method === 'DELETE') await tx.subscription.deleteMany({ where: key });
      else {
        if (
          !(await tx.subscription.findUnique({ where: { userId_contentId: key } })) &&
          (await tx.subscription.count({ where: { contentId } })) >= 500
        )
          throw new HttpError(409, 'Dieses Thema hat die aktuelle Abonnementgrenze erreicht.');
        await tx.subscription.upsert({ where: { userId_contentId: key }, create: key, update: {} });
      }
      return { ok: true };
    }
    if (action !== 'comments') throw new HttpError(405, 'Methode nicht unterstützt.');
    if (method === 'POST' && !targetId) {
      if (item.status !== 'PUBLISHED' || item.locked)
        throw new HttpError(409, 'Diese Diskussion ist geschlossen.');
      const data = commentInput.parse(input);
      const parent = data.parentId
        ? await tx.comment.findFirst({ where: { id: data.parentId, contentId, removed: false } })
        : null;
      if (data.parentId && !parent) throw new HttpError(404, 'Antwortbezug nicht gefunden.');
      if (parent?.parentId) throw new HttpError(400, 'Bitte auf den Hauptkommentar antworten.');
      const created = await tx.comment.create({ data: { ...data, contentId, authorId: user.id } });
      const recipients = new Map<string, string>();
      const author = await tx.user.findUniqueOrThrow({ where: { id: item.authorId } });
      if (author.notifyComments) recipients.set(author.id, 'COMMENT');
      if (parent) {
        const recipient = await tx.user.findUniqueOrThrow({ where: { id: parent.authorId } });
        if (recipient.notifyReplies) recipients.set(recipient.id, 'REPLY');
      }
      if (item.kind === 'TOPIC')
        for (const sub of await tx.subscription.findMany({
          where: { contentId, user: { notifySubscriptions: true } },
          take: 500,
        }))
          if (!recipients.has(sub.userId)) recipients.set(sub.userId, 'SUBSCRIPTION');
      for (const member of await mentionedMembers(tx, data.body, user.id))
        recipients.set(member.id, 'MENTION');
      recipients.delete(user.id);
      for (const [id, kind] of recipients)
        await notify(tx, id, contentId, kind, `comment:${created.id}:${id}`);
      return created;
    }
    if (targetId && ['PATCH', 'DELETE'].includes(method)) {
      const current = await tx.comment.findFirst({ where: { id: targetId, contentId } });
      if (!current || current.removed) throw new HttpError(404, 'Kommentar nicht gefunden.');
      if (current.authorId !== user.id && !(method === 'DELETE' && canModerate(user.role)))
        throw new HttpError(403, 'Keine Berechtigung.');
      if (method === 'PATCH') {
        if (item.status !== 'PUBLISHED' || item.locked)
          throw new HttpError(409, 'Diese Diskussion ist geschlossen.');
        const data = z
          .object({ body: z.string().trim().min(1).max(3000) })
          .strict()
          .parse(input);
        await tx.comment.update({ where: { id: targetId }, data });
      } else {
        await tx.comment.update({ where: { id: targetId }, data: { body: '', removed: true } });
        await tx.report.updateMany({
          where: { commentId: targetId, resolved: false },
          data: { resolved: true },
        });
        if (current.authorId !== user.id)
          await tx.audit.create({ data: { actorId: user.id, action: 'COMMENT_REMOVE', targetId } });
      }
      return { ok: true };
    }
    throw new HttpError(405, 'Methode nicht unterstützt.');
  });
}
