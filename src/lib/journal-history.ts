import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from './db';
import { HttpError } from './security';
import { journalSnapshot, journalDelete } from './validation';
import { recordChange } from './vehicle-workspace';
import type { Prisma, User, VehicleEntry } from '@/generated/prisma/client';
export const VERSION_LIMIT = 20;
export const VERSION_DAYS = 30;
export function assertRevision(current: number, expected: number) {
  if (current !== expected)
    throw new HttpError(
      409,
      'Dieser Eintrag wurde inzwischen geändert. Deine Eingaben bleiben erhalten. Lade den aktuellen Stand, bevor du erneut speicherst.',
    );
}
export async function rememberEntry(
  tx: Prisma.TransactionClient,
  entry: VehicleEntry,
  actorId: string,
) {
  if (!entry.keepVersions) return;
  const now = new Date();
  const snapshot = journalSnapshot.parse({
    kind: entry.kind,
    title: entry.title,
    body: entry.body,
    category: entry.category,
    progress: entry.progress,
    occurredOn: entry.occurredOn.toISOString().slice(0, 10),
  });
  await tx.vehicleEntryVersion.create({
    data: {
      entryId: entry.id,
      revision: entry.revision,
      actorId,
      snapshot,
      createdAt: now,
      expiresAt: new Date(now.getTime() + VERSION_DAYS * 86400000),
    },
  });
  await tx.vehicleEntryVersion.deleteMany({
    where: { entryId: entry.id, expiresAt: { lte: now } },
  });
  const surplus = await tx.vehicleEntryVersion.findMany({
    where: { entryId: entry.id },
    orderBy: { revision: 'desc' },
    skip: VERSION_LIMIT,
    select: { id: true },
  });
  if (surplus.length)
    await tx.vehicleEntryVersion.deleteMany({ where: { id: { in: surplus.map((r) => r.id) } } });
}
const response = (value: unknown) =>
  NextResponse.json(value, {
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
export async function journalHistory(
  request: Request,
  path: string[],
  user: User | null,
  body: (r: Request) => Promise<unknown>,
  rate: (key: string, limit?: number) => Promise<void>,
) {
  if (!user) throw new HttpError(401, 'Bitte zuerst anmelden.');
  const vehicleId = path[1],
    entryId = path[3],
    operation = path[4];
  const entry = await db.vehicleEntry.findFirst({
    where: { id: entryId, vehicleId, vehicle: { ownerId: user.id } },
  });
  if (!entry) throw new HttpError(404, 'Eintrag nicht gefunden.');
  if (request.method === 'GET' && operation === 'versions') {
    const versions = entry.keepVersions
      ? await db.vehicleEntryVersion.findMany({
          where: { entryId, expiresAt: { gt: new Date() } },
          orderBy: { revision: 'desc' },
          take: VERSION_LIMIT,
        })
      : [];
    return response({
      revision: entry.revision,
      keepVersions: entry.keepVersions,
      versions,
      retentionDays: VERSION_DAYS,
      limit: VERSION_LIMIT,
    });
  }
  await rate(`history:${user.id}`, 60);
  if (request.method === 'DELETE' && operation === 'versions') {
    const input = journalDelete.parse(await body(request));
    return db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Vehicle" WHERE "id"=${vehicleId} FOR UPDATE`;
      const current = await tx.vehicleEntry.findFirst({
        where: { id: entryId, vehicleId, vehicle: { ownerId: user.id } },
      });
      if (!current) throw new HttpError(404, 'Eintrag nicht gefunden.');
      assertRevision(current.revision, input.expectedRevision);
      await tx.vehicleEntryVersion.deleteMany({ where: { entryId } });
      await tx.vehicleEntry.update({
        where: { id: entryId },
        data: { keepVersions: false, revision: { increment: 1 } },
      });
      await recordChange(tx, vehicleId, user.id, entryId, 'entries', 'PURGE_VERSIONS', [
        'keepVersions',
      ]);
      return response({ ok: true, revision: current.revision + 1 });
    });
  }
  if (request.method !== 'POST' || operation !== 'restore')
    throw new HttpError(405, 'Methode nicht unterstützt.');
  const input = z
    .object({
      versionId: z.string().min(1).max(100),
      expectedRevision: z.number().int().min(1),
      confirmPrivate: z.literal(true),
    })
    .strict()
    .parse(await body(request));
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Vehicle" WHERE "id"=${vehicleId} FOR UPDATE`;
    const current = await tx.vehicleEntry.findFirst({
      where: { id: entryId, vehicleId, vehicle: { ownerId: user.id } },
    });
    if (!current) throw new HttpError(404, 'Eintrag nicht gefunden.');
    assertRevision(current.revision, input.expectedRevision);
    const version = await tx.vehicleEntryVersion.findFirst({
      where: { id: input.versionId, entryId, expiresAt: { gt: new Date() } },
    });
    if (!version || !current.keepVersions)
      throw new HttpError(404, 'Version nicht verfügbar oder abgelaufen.');
    const restored = journalSnapshot.parse(version.snapshot);
    await rememberEntry(tx, current, user.id);
    const result = await tx.vehicleEntry.update({
      where: { id: entryId },
      data: {
        ...restored,
        occurredOn: new Date(restored.occurredOn),
        visibility: 'PRIVATE',
        revision: { increment: 1 },
      },
    });
    // Costs/mileage, consent, links, pictures and social snapshots are intentionally never restored.
    await recordChange(tx, vehicleId, user.id, entryId, 'entries', 'RESTORE', [
      ...Object.keys(restored),
      'visibility',
    ]);
    return response({ ok: true, revision: result.revision, visibility: result.visibility });
  });
}
