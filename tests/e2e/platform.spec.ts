import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdir, readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
async function browserApi(page: Page, path: string, method = 'GET', data?: unknown) {
  return page.evaluate(
    async ({ path, method, data }) => {
      const response = await fetch(path, {
        method,
        credentials: 'same-origin',
        headers: data ? { 'Content-Type': 'application/json' } : undefined,
        body: data ? JSON.stringify(data) : undefined,
      });
      return { ok: response.ok, data: await response.json() };
    },
    { path, method, data },
  );
}
async function navigate(page: Page, label: string) {
  const menu = page.getByRole('button', { name: 'Menü öffnen', exact: true });
  if (await menu.isVisible()) await menu.click();
  await page
    .getByRole('navigation', { name: 'Hauptnavigation', exact: true })
    .getByRole('button', { name: label, exact: true })
    .click();
}
test('homepage, responsive overflow, keyboard dialog and accessibility', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Willkommen im Collective.' })).toBeVisible();
  await expect(page.locator('.stats')).toContainText('0');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const axe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(',')}`)).toEqual(
    [],
  );
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await navigate(page, 'Community-Karte');
  await expect(
    page.getByText('Die Mitgliederkarte ist angemeldeten Mitgliedern', { exact: false }),
  ).toBeVisible();
  await navigate(page, 'Entdecken');
  await page.screenshot({ path: `test-results/${info.project.name}-home.png`, fullPage: true });
  expect(errors).toEqual([]);
});
test('register, verify, login, private garage persistence, regional popup and account export', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  test.skip(
    process.env.MAIL_MODE !== 'file',
    'Requires isolated local mail capture, never a live mail provider.',
  );
  const suffix = randomBytes(5).toString('hex'),
    username = `qa_${suffix}`,
    email = `${username}@example.test`,
    password = `Qa-only-${randomBytes(16).toString('hex')}`;
  await page.goto('/');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await page.getByRole('button', { name: 'Noch kein Konto? Registrieren' }).click();
  await page.getByLabel('Benutzername', { exact: true }).fill(username);
  await page.getByLabel('E-Mail-Adresse', { exact: true }).fill(email);
  await page.getByLabel('Passwort · mindestens 12 Zeichen', { exact: true }).fill(password);
  await page
    .getByRole('combobox', { name: 'Region (freiwillig)', exact: true })
    .selectOption('bremen-nord');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Konto erstellen', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Willkommen zurück.' })).toBeVisible();
  const files = await readdir('.local/mail');
  let verification = '';
  for (const file of files) {
    const mail = JSON.parse(await readFile(`.local/mail/${file}`, 'utf8'));
    if (mail.to === email) verification = mail.text.match(/https?:\/\/[^\s]+/)[0];
  }
  expect(verification).toBeTruthy();
  const token = new URL(verification).searchParams.get('verify');
  await page.goto(`/?verify=${token}`);
  await page.getByRole('button', { name: 'E-Mail jetzt bestätigen' }).click();
  await expect(page.getByRole('heading', { name: 'Willkommen zurück.' })).toBeVisible();
  await page.getByLabel('E-Mail-Adresse', { exact: true }).fill(email);
  await page.getByLabel('Passwort', { exact: true }).fill(password);
  await page.getByRole('dialog').getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  try {
    await navigate(page, 'Fahrzeuggarage');
    await page.getByRole('button', { name: 'Fahrzeug hinzufügen', exact: true }).click();
    await page.getByLabel('Fahrzeugname', { exact: true }).fill(`Testpuma ${suffix}`);
    await page.getByLabel('Variante / Motorisierung', { exact: true }).fill('1.7');
    await page.getByLabel('Farbe', { exact: true }).fill('Pacific Green');
    await page.getByRole('button', { name: 'Fahrzeug speichern' }).click();
    await expect(page.getByRole('heading', { name: `Testpuma ${suffix}` })).toBeVisible();
    await expect(page.locator('.vehicle-card')).toContainText('Privat');
    await page.reload();
    await navigate(page, 'Fahrzeuggarage');
    await page.getByRole('button', { name: 'Meine Fahrzeuge' }).click();
    await expect(page.getByRole('heading', { name: `Testpuma ${suffix}` })).toBeVisible();
    await page.getByRole('link', { name: `Testpuma ${suffix}` }).click();
    await expect(page.getByRole('heading', { name: 'Build & Fahrzeughistorie' })).toBeVisible();
    await page.getByRole('button', { name: 'Eintrag hinzufügen' }).click();
    await page.getByLabel('Titel', { exact: true }).fill('Fahrwerk überarbeitet');
    await page
      .getByLabel('Dokumentation', { exact: true })
      .fill('Die Arbeiten sind im Fahrzeugtagebuch dokumentiert.');
    await page.getByLabel('Kosten in € · nur für dich').fill('250.50');
    await page.getByRole('button', { name: 'Eintrag speichern' }).click();
    await expect(page.getByRole('heading', { name: 'Fahrwerk überarbeitet' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Fahrwerk überarbeitet' })).toBeVisible();
    await expect(page.locator('.journal-meta')).toContainText('250,50');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const dossierAxe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(dossierAxe.violations).toEqual([]);
    await page.getByRole('button', { name: 'Bearbeiten', exact: true }).click();
    await page.getByLabel('Titel', { exact: true }).fill('Fahrwerk geprüft');
    await page.getByRole('button', { name: 'Eintrag speichern' }).click();
    await expect(page.getByRole('heading', { name: 'Fahrwerk geprüft' })).toBeVisible();
    const dossierUrl = page.url();
    const vehicleId = new URL(dossierUrl).pathname.split('/').pop();
    const vehicleData = (await browserApi(page, `/api/vehicles/${vehicleId}`)).data;
    const { name, variant, year, powerKw, mileage, color, description } = vehicleData;
    expect(
      (
        await browserApi(page, `/api/vehicles/${vehicleId}`, 'PATCH', {
          name,
          variant,
          year,
          powerKw,
          mileage,
          color,
          description,
          visibility: 'PUBLIC',
        })
      ).ok,
    ).toBe(true);
    await page.getByRole('button', { name: 'Bearbeiten', exact: true }).click();
    await page.getByRole('checkbox').check();
    await page.getByLabel('Fortschritt in %').fill('60');
    await page.getByRole('button', { name: 'Eintrag speichern' }).click();
    await expect(page.getByText('Fortschritt 60 %', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Als Community-Build teilen' }).click();
    await page.getByLabel('Öffentlicher Titel', { exact: true }).fill('Mein Community-Fahrwerk');
    await page
      .getByLabel('Öffentliche Build-Beschreibung')
      .fill('Dieser Text wurde ausdrücklich für die Community geschrieben.');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Jetzt veröffentlichen' }).click();
    await page
      .getByRole('link', { name: 'Community-Build öffnen · Kommentare & Reaktionen →' })
      .click();
    await expect(page.getByRole('dialog')).toContainText('Mein Community-Fahrwerk');
    await expect(page.getByRole('dialog')).not.toContainText('250,50');
    await page.getByRole('button', { name: 'Gefällt mir', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Gefällt dir', exact: true })).toBeVisible();
    await page.getByLabel('Dein Kommentar').fill('Ein getesteter Community-Kommentar.');
    await page.getByRole('button', { name: 'Kommentieren', exact: true }).click();
    await expect(
      page.getByText('Ein getesteter Community-Kommentar.', { exact: true }),
    ).toBeVisible();
    await page.goto(dossierUrl);
    await expect(page.getByRole('heading', { name: 'Fahrwerk geprüft' })).toBeVisible();
    await page.screenshot({
      path: `test-results/${info.project.name}-dossier.png`,
      fullPage: true,
    });
    await page.getByRole('button', { name: 'Löschen', exact: true }).click();
    await page.getByRole('button', { name: 'Endgültig löschen' }).click();
    await expect(
      page.getByRole('heading', { name: 'Noch keine sichtbaren Einträge' }),
    ).toBeVisible();
    await page.getByRole('link', { name: '← PumaMap / Community' }).click();
    await navigate(page, 'Community-Karte');
    await expect(page.locator('.region-marker')).toHaveCount(1);
    await page.locator('.region-marker').click();
    await expect(page.locator('.leaflet-popup')).toContainText(username);
    const marker = await page.locator('.region-marker').boundingBox(),
      popup = await page.locator('.leaflet-popup').boundingBox();
    expect(marker && popup).toBeTruthy();
    expect(Math.abs(popup!.x + popup!.width / 2 - marker!.x - marker!.width / 2)).toBeLessThan(50);
    expect(Math.abs(popup!.y + popup!.height - marker!.y)).toBeLessThan(80);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: `test-results/${info.project.name}-map.png` });
    const exportResponse = await browserApi(page, '/api/profile/export');
    expect(exportResponse.ok).toBe(true);
    const exported = exportResponse.data;
    expect(exported.profile.email).toBe(email);
    expect(exported.profile.passwordHash).toBeUndefined();
    expect(exported.vehicles).toHaveLength(1);
  } finally {
    // Keep the original UI failure visible if the browser target crashed during the test.
    try {
      const response = await browserApi(page, '/api/profile', 'DELETE', { password });
      expect(response.ok).toBe(true);
    } catch (error) {
      if (!test.info().errors.length) throw error;
    }
  }
});
