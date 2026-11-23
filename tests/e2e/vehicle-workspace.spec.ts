import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import sharp from 'sharp';
import { randomBytes, createHash } from 'node:crypto';
import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

test('vehicle media, parts and milestone forms persist with private access', async ({
  page,
  context,
}, info) => {
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
    const image = await sharp({
      create: { width: 800, height: 500, channels: 3, background: '#52643a' },
    })
      .png()
      .toBuffer();
    await page
      .getByLabel('Bilder hinzufügen')
      .setInputFiles({ name: 'qa.png', mimeType: 'image/png', buffer: image });
    await expect(page.locator('.gallery-card')).toHaveCount(1);
    await page.getByRole('button', { name: 'Bild bearbeiten', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Bildbeschreibung', { exact: true }).fill('Eigene Testaufnahme');
    await dialog.getByLabel('Als Titelbild anzeigen').check();
    await dialog.getByRole('button', { name: 'Speichern', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await page.getByRole('button', { name: 'Teile', exact: true }).click();
    await page.getByRole('button', { name: 'Teil hinzufügen' }).click();
    await dialog.getByLabel('Teilebezeichnung').fill('Testbauteil ohne Kompatibilitätsbehauptung');
    await dialog.getByLabel('Kaufpreis in € · privat').fill('24.50');
    await dialog.getByRole('button', { name: 'Speichern', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Testbauteil ohne Kompatibilitätsbehauptung' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Meilensteine', exact: true }).click();
    await page.getByRole('button', { name: 'Meilenstein hinzufügen' }).click();
    await dialog.getByLabel('Titel', { exact: true }).fill('Erste Werkstatt-Etappe');
    await dialog.getByLabel('Fortschritt in %', { exact: true }).fill('25');
    await dialog.getByRole('combobox', { name: 'Projektstatus' }).selectOption('ACTIVE');
    await dialog.getByRole('button', { name: 'Speichern', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Erste Werkstatt-Etappe' })).toBeVisible();
    await page.reload();
    await page.getByRole('button', { name: 'Meilensteine', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Erste Werkstatt-Etappe' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
    await page.screenshot({
      path: `test-results/${info.project.name}-workspace.png`,
      fullPage: true,
    });
    await page.getByRole('button', { name: 'Galerie', exact: true }).click();
    await page.getByRole('button', { name: 'Bild vergrößern: Eigene Testaufnahme' }).click();
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await context.clearCookies();
    await page.reload();
    await expect(
      page.getByText('Das Fahrzeug ist privat, nicht verfügbar', { exact: false }),
    ).toBeVisible();
  } finally {
    await db.user.deleteMany({ where: { id: user.id } });
    await db.$disconnect();
  }
});
