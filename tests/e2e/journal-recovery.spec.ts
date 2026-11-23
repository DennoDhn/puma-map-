import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { randomBytes, createHash } from 'node:crypto';
import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

test('journal versions restore privately and survive reload', async ({ page, context }, info) => {
  test.setTimeout(120000);
  test.skip(
    process.env.TEST_DATABASE_CONFIRM !== 'isolated',
    'Requires explicitly isolated fixture database.',
  );
  const url = new URL(process.env.DATABASE_URL!);
  expect(url.pathname).toMatch(/_(test|preview)$/);
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  const token = randomBytes(32).toString('hex');
  const user = await db.user.create({
    data: {
      email: `fixture-${token.slice(0, 12)}@example.test`,
      username: `qa_${token.slice(0, 12)}`,
      passwordHash: 'unusable-test-fixture',
      verifiedAt: new Date(),
      sessions: {
        create: {
          tokenHash: createHash('sha256').update(token).digest('hex'),
          expiresAt: new Date(Date.now() + 3600000),
        },
      },
    },
  });
  const v = await db.vehicle.create({
    data: {
      ownerId: user.id,
      name: 'QA Werkstatt',
      variant: '1.7',
      year: 2000,
      color: 'Grün',
      description: 'Isoliertes Browser-Testfahrzeug',
    },
  });
  const entry = await db.vehicleEntry.create({
    data: {
      vehicleId: v.id,
      kind: 'BUILD',
      title: 'Aktueller Inhalt',
      body: 'Aktuelle Beschreibung des Projekts.',
      occurredOn: new Date('2026-01-10'),
      visibility: 'PUBLIC',
      keepVersions: true,
      revision: 2,
      costCents: 9900,
    },
  });
  await db.vehicleEntryVersion.create({
    data: {
      entryId: entry.id,
      revision: 1,
      actorId: user.id,
      snapshot: {
        kind: 'BUILD',
        title: 'Früherer Inhalt',
        body: 'Frühere Beschreibung des Projekts.',
        category: 'OTHER',
        progress: 20,
        occurredOn: '2026-01-10',
      },
      expiresAt: new Date(Date.now() + 86400000),
    },
  });
  try {
    await context.addCookies([
      {
        name: 'pumamap',
        value: token,
        url: info.project.use.baseURL!,
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
    await page.goto(`/fahrzeuge/${v.id}`);
    await expect(page.getByRole('heading', { name: 'Dein Projekt. Jedes Detail.' })).toBeVisible();
    await page.getByRole('button', { name: 'Versionen', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(
      dialog.getByRole('heading', { name: 'Früherer Inhalt', exact: true }),
    ).toBeVisible();
    await dialog.getByRole('button', { name: 'Version 1 wiederherstellen' }).click();
    await dialog.getByLabel('Ich bestätige die Wiederherstellung als privaten Eintrag.').check();
    await dialog.getByRole('button', { name: 'Privat wiederherstellen', exact: true }).click();
    await expect(dialog.getByRole('status')).toContainText('Version wiederhergestellt');
    expect((await db.vehicleEntry.findUniqueOrThrow({ where: { id: entry.id } })).visibility).toBe(
      'PRIVATE',
    );
    const scan = await new AxeBuilder({ page }).analyze();
    expect(scan.violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Früherer Inhalt', exact: true })).toBeVisible();
    expect((await db.vehicleEntry.findUniqueOrThrow({ where: { id: entry.id } })).costCents).toBe(
      9900,
    );
  } finally {
    await db.user.delete({ where: { id: user.id } });
    await db.$disconnect();
  }
});
