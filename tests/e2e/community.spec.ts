import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { randomBytes, createHash } from 'node:crypto';
import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
async function fixture() {
  expect(process.env.TEST_DATABASE_CONFIRM).toBe('isolated');
  expect(new URL(process.env.DATABASE_URL!).pathname).toMatch(/_(test|preview)$/);
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  const token = randomBytes(32).toString('hex');
  const user = await db.user.create({
    data: {
      email: `${token}@example.test`,
      username: `qa_${token.slice(0, 12)}`,
      passwordHash: 'unusable-fixture',
      verifiedAt: new Date(),
      role: 'MODERATOR',
      sessions: {
        create: {
          tokenHash: createHash('sha256').update(token).digest('hex'),
          expiresAt: new Date(Date.now() + 3600000),
        },
      },
    },
  });
  const topic = await db.content.create({
    data: {
      authorId: user.id,
      kind: 'TOPIC',
      title: `Community QA ${token.slice(0, 6)}`,
      body: 'Ein isoliertes Thema zur Browserprüfung.',
      category: 'Werkstatt',
    },
  });
  return {
    db,
    user,
    token,
    topic,
    cleanup: async () => {
      await db.user.delete({ where: { id: user.id } });
      await db.$disconnect();
    },
  };
}
async function navigate(page: Page, label: string) {
  const menu = page.getByRole('button', { name: 'Menü öffnen', exact: true });
  if (await menu.isVisible()) await menu.click();
  await page
    .getByRole('navigation', { name: 'Hauptnavigation', exact: true })
    .getByRole('button', { name: label, exact: true })
    .click();
}

test('forum comment editing, subscription and moderator lock persist', async ({
  page,
  context,
}, info) => {
  test.setTimeout(120000);
  const f = await fixture();
  try {
    await context.addCookies([
      {
        name: 'pumamap',
        value: f.token,
        url: info.project.use.baseURL!,
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
    await page.goto(`/beitraege/${f.topic.id}`);
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: f.topic.title, exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: 'Thema abonnieren', exact: true }).click();
    await expect(
      dialog.getByRole('button', { name: 'Abonnement beenden', exact: true }),
    ).toBeVisible();
    await dialog
      .getByLabel('Dein Kommentar', { exact: true })
      .fill('Eine echte gespeicherte Antwort.');
    await dialog.getByRole('button', { name: 'Kommentar veröffentlichen', exact: true }).click();
    await expect(dialog.locator('.community-comment')).toContainText(
      'Eine echte gespeicherte Antwort.',
    );
    await dialog.getByRole('button', { name: 'Kommentar bearbeiten', exact: true }).click();
    await dialog
      .getByLabel('Dein Kommentar', { exact: true })
      .fill('Die Antwort wurde korrigiert.');
    await dialog.getByRole('button', { name: 'Änderung speichern', exact: true }).click();
    await expect(dialog.locator('.community-comment')).toContainText(
      'Die Antwort wurde korrigiert.',
    );
    await dialog.getByRole('button', { name: 'Thema schließen', exact: true }).click();
    await expect(
      dialog.getByText('Dieses Thema ist geschlossen. Bestehende Antworten bleiben lesbar.'),
    ).toBeVisible();
    await expect(dialog.getByLabel('Dein Kommentar', { exact: true })).toHaveCount(0);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.reload();
    await expect(dialog.getByRole('button', { name: 'Thema öffnen', exact: true })).toBeVisible();
    await expect(dialog.locator('.community-comment')).toContainText(
      'Die Antwort wurde korrigiert.',
    );
    expect(
      await f.db.subscription.count({ where: { contentId: f.topic.id, userId: f.user.id } }),
    ).toBe(1);
  } finally {
    await f.cleanup();
  }
});

test('community search opens profiles and notification preferences survive reload', async ({
  page,
  context,
}, info) => {
  test.setTimeout(120000);
  const f = await fixture();
  try {
    await context.addCookies([
      {
        name: 'pumamap',
        value: f.token,
        url: info.project.use.baseURL!,
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
    await page.goto('/');
    await navigate(page, 'Community-Suche');
    await page.getByLabel('Bereich', { exact: true }).selectOption('MEMBER');
    await page.getByLabel('Community durchsuchen', { exact: true }).fill(f.user.username);
    await expect(page.locator('.discovery-card')).toHaveCount(1);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page
      .locator('.discovery-card')
      .getByRole('button', { name: f.user.username, exact: true })
      .click();
    await expect(page.getByRole('dialog')).toContainText(f.topic.title);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByRole('button', { name: 'Benachrichtigungen', exact: true }).click();
    await page.getByLabel('Reaktionen auf meine Inhalte', { exact: true }).check();
    await page.getByRole('button', { name: 'Einstellungen speichern', exact: true }).click();
    await expect(page.getByRole('status')).toContainText(
      'Benachrichtigungseinstellungen gespeichert.',
    );
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.reload();
    await page.getByRole('button', { name: 'Benachrichtigungen', exact: true }).click();
    await expect(page.getByLabel('Reaktionen auf meine Inhalte', { exact: true })).toBeChecked();
  } finally {
    await f.cleanup();
  }
});
