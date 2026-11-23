import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { db } from '../src/lib/db';
import { handle, rate } from '../src/lib/api';
import { newToken, digest } from '../src/lib/security';
const origin = process.env.APP_ORIGIN ?? 'http://localhost:3000';
const pass = 'a unique test password 123';
const runId = newToken().slice(0, 12).toLowerCase();
const emails = {
  alice: `${runId}.alice@example.test`,
  bob: `${runId}.bob@example.test`,
  moderator: `${runId}.moderator@example.test`,
};
async function call(
  path: string,
  method = 'GET',
  data?: unknown,
  cookie = '',
  customOrigin = origin,
) {
  // Legacy workflow fixtures supply the current revision; conflict cases pass it explicitly.
  if (/^vehicles\/[^/]+\/entries\/[^/]+$/.test(path) && ['PATCH', 'DELETE'].includes(method)) {
    const input = (data ?? {}) as Record<string, unknown>;
    if (!('expectedRevision' in input)) {
      const row = await db.vehicleEntry.findUnique({ where: { id: path.split('/')[3] } });
      data = { ...input, expectedRevision: row?.revision ?? 1 };
    }
  }
  const response = await handle(
    new Request(`${origin}/api/${path}`, {
      method,
      headers: {
        origin: customOrigin,
        cookie,
        ...(data ? { 'Content-Type': 'application/json' } : {}),
      },
      body: data ? JSON.stringify(data) : undefined,
    }),
    path.split('?')[0].split('/'),
  );
  return {
    status: response.status,
    data: await response.json(),
    cookie: response.headers.get('set-cookie')?.split(';')[0] ?? '',
    headers: response.headers,
  };
}
async function mailToken(email: string, purpose = 'verify') {
  for (const file of (await readdir('.local/mail')).reverse()) {
    const mail = JSON.parse(await readFile(`.local/mail/${file}`, 'utf8'));
    if (mail.to === email && mail.text.includes(`?${purpose}=`)) {
      return new URL(mail.text.match(/https?:\/\/[^\s]+/)[0]).searchParams.get(purpose)!;
    }
  }
  throw new Error('Expected transactional mail was not generated.');
}
test('PostgreSQL-backed API integration suite', async (t) => {
  const url = new URL(process.env.DATABASE_URL!);
  assert.match(url.pathname, /_test$/, 'Refusing to mutate a database without _test suffix');
  assert.equal(process.env.TEST_DATABASE_CONFIRM, 'isolated');
  await db.$executeRawUnsafe('TRUNCATE "User", "Region", "Audit", "RateBucket" CASCADE');
  await db.region.create({
    data: { id: 'bremen-nord', name: 'Bremen-Nord', latitude: 53.18, longitude: 8.62 },
  });
  let alice = '',
    bob = '',
    moderator = '',
    vehicleId = '',
    postId = '',
    wikiId = '',
    eventId = '';
  const vehicle = {
    name: 'Pacific Project',
    variant: '1.7',
    year: 2000,
    powerKw: 92,
    mileage: 180000,
    color: 'Pacific Green',
    description: 'Ein privates Testfahrzeug.',
    visibility: 'PRIVATE',
  };
  const post = {
    kind: 'POST',
    title: 'Erster Fortschritt',
    body: 'Heute habe ich meinen Puma dokumentiert.',
    category: 'Allgemein',
  };
  await t.test('health and real zero counts', async () => {
    assert.equal((await call('health')).status, 200);
    assert.deepEqual((await call('stats')).data, { members: 0, vehicles: 0, posts: 0, events: 0 });
  });
  await t.test('validation and CSRF reject bad writes', async () => {
    assert.equal(
      (await call('auth/register', 'POST', { username: 'x', email: 'invalid', password: 'short' }))
        .status,
      400,
    );
    assert.equal((await call('auth/register', 'POST', {}, '', 'https://evil.example')).status, 403);
    assert.equal((await call('vehicles', 'POST', vehicle)).status, 401);
  });
  await t.test('register sends verification, login stays blocked until verification', async () => {
    assert.equal(
      (
        await call('auth/register', 'POST', {
          username: 'alice',
          email: emails.alice,
          password: pass,
          shareRegion: true,
          regionId: 'bremen-nord',
        })
      ).status,
      201,
    );
    assert.equal(
      (await call('auth/login', 'POST', { email: emails.alice, password: pass })).status,
      401,
    );
    const token = await mailToken(emails.alice);
    assert.equal((await call('auth/verify', 'POST', { token })).status, 200);
    assert.equal((await call('auth/verify', 'POST', { token })).status, 400);
    const login = await call('auth/login', 'POST', { email: emails.alice, password: pass });
    assert.equal(login.status, 200);
    assert.match(login.headers.get('set-cookie')!, /HttpOnly/);
    assert.match(login.headers.get('set-cookie')!, /SameSite=lax/i);
    assert.equal(login.data.passwordHash, undefined);
    alice = login.cookie;
  });
  await t.test('second member and moderator verified; roles cannot be registered', async () => {
    assert.equal(
      (
        await call('auth/register', 'POST', {
          username: 'evil',
          email: 'evil@example.test',
          password: pass,
          role: 'ADMIN',
        })
      ).status,
      400,
    );
    for (const username of ['bob', 'moderator']) {
      await call('auth/register', 'POST', {
        username,
        email: `${runId}.${username}@example.test`,
        password: pass,
      });
      await call('auth/verify', 'POST', {
        token: await mailToken(`${runId}.${username}@example.test`),
      });
    }
    await db.user.update({ where: { username: 'moderator' }, data: { role: 'MODERATOR' } });
    bob = (await call('auth/login', 'POST', { email: emails.bob, password: pass })).cookie;
    moderator = (await call('auth/login', 'POST', { email: emails.moderator, password: pass }))
      .cookie;
    assert.ok(bob);
    assert.ok(moderator);
  });
  await t.test(
    'vehicles persist and private vehicles never leak through public lists',
    async () => {
      const created = await call('vehicles', 'POST', vehicle, alice);
      assert.equal(created.status, 201);
      vehicleId = created.data.id;
      assert.equal((await call('vehicles')).data.length, 0);
      assert.equal((await call('vehicles?mine=true', 'GET', undefined, alice)).data.length, 1);
      assert.equal((await call('vehicles?mine=true', 'GET', undefined, bob)).data.length, 0);
      assert.equal(
        (await call(`vehicles/${vehicleId}`, 'PATCH', { ...vehicle, name: 'Stolen' }, bob)).status,
        404,
      );
      assert.equal((await call(`vehicles/${vehicleId}`, 'DELETE', undefined, bob)).status, 404);
      await call(`vehicles/${vehicleId}`, 'PATCH', { ...vehicle, visibility: 'PUBLIC' }, alice);
      assert.equal((await call('vehicles')).data.length, 1);
    },
  );
  await t.test(
    'vehicle journal persists edits, hides private entries and never exposes costs',
    async () => {
      const path = `vehicles/${vehicleId}/entries`;
      const entry = {
        kind: 'BUILD',
        title: 'Fahrwerk dokumentiert',
        body: 'Ein dokumentierter Arbeitsschritt am Fahrzeug.',
        occurredOn: '2026-01-10',
        mileage: 180000,
        costCents: 49999,
        visibility: 'PRIVATE',
      };
      assert.equal((await call(path, 'POST', entry)).status, 401);
      assert.equal((await call(path, 'POST', entry, bob)).status, 404);
      assert.equal((await call(path, 'POST', { ...entry, costCents: -1 }, alice)).status, 400);
      assert.equal(
        (await call(path, 'POST', { ...entry, occurredOn: '2026-02-30' }, alice)).status,
        400,
      );
      assert.equal(
        (await call(path, 'POST', { ...entry, occurredOn: '2099-01-01' }, alice)).status,
        400,
      );
      const created = await call(path, 'POST', entry, alice);
      assert.equal(created.status, 201);
      const eid = created.data.id;
      assert.equal((await call(path)).data.entries.length, 0);
      assert.equal((await call(path, 'GET', undefined, alice)).data.entries[0].costCents, 49999);
      assert.equal(
        (await call(`${path}/${eid}`, 'PATCH', { ...entry, visibility: 'PUBLIC' }, bob)).status,
        404,
      );
      assert.equal(
        (await call(`${path}/${eid}`, 'PATCH', { ...entry, visibility: 'PUBLIC' }, alice)).status,
        200,
      );
      const publicEntry = (await call(path)).data.entries[0];
      assert.equal(publicEntry.title, entry.title);
      assert.equal('costCents' in publicEntry, false);
      assert.equal('costCents' in (await call(path, 'GET', undefined, bob)).data.entries[0], false);
      assert.equal((await call(`vehicles/${vehicleId}`)).data.canEdit, false);
      assert.equal(
        (await call(`vehicles/${vehicleId}`, 'GET', undefined, alice)).data.canEdit,
        true,
      );
      await call(`vehicles/${vehicleId}`, 'PATCH', { ...vehicle, visibility: 'PRIVATE' }, alice);
      assert.equal((await call(path)).status, 404);
      assert.equal((await call(`vehicles/${vehicleId}`)).status, 404);
      assert.equal((await call(path, 'GET', undefined, alice)).status, 200);
      const exported = (await call('profile/export', 'GET', undefined, alice)).data;
      assert.equal(exported.vehicles[0].entries[0].costCents, 49999);
      await call(`vehicles/${vehicleId}`, 'PATCH', { ...vehicle, visibility: 'PUBLIC' }, alice);
      assert.equal((await call(`${path}/${eid}`, 'DELETE', undefined, bob)).status, 404);
      assert.equal((await call(`${path}/${eid}`, 'DELETE', undefined, alice)).status, 200);
      assert.equal((await call(path)).data.entries.length, 0);
      assert.equal((await call(`${path}/${eid}`, 'DELETE', undefined, alice)).status, 404);
    },
  );
  await t.test('journal pagination, vehicle isolation and cascading deletion', async () => {
    const other = (await call('vehicles', 'POST', vehicle, alice)).data;
    const entry = {
      kind: 'REPAIR',
      title: 'Reparaturbericht',
      body: 'Eine weitere dokumentierte Reparatur.',
      occurredOn: '2026-01-01',
      mileage: null,
      costCents: null,
      visibility: 'PUBLIC',
    };
    const foreignEntry = (await call(`vehicles/${other.id}/entries`, 'POST', entry, alice)).data;
    assert.equal(
      (await call(`vehicles/${vehicleId}/entries/${foreignEntry.id}`, 'PATCH', entry, alice))
        .status,
      404,
    );
    assert.equal(
      (await call(`vehicles/${vehicleId}/entries/${foreignEntry.id}`, 'DELETE', undefined, alice))
        .status,
      404,
    );
    await db.vehicleEntry.createMany({
      data: Array.from({ length: 52 }, (_, i) => ({
        ...entry,
        id: `journal-page-${i.toString().padStart(3, '0')}`,
        vehicleId,
        visibility: 'PUBLIC' as const,
        occurredOn: new Date(entry.occurredOn),
      })),
    });
    const first = (await call(`vehicles/${vehicleId}/entries`)).data;
    const second = (await call(`vehicles/${vehicleId}/entries?cursor=${first.nextCursor}`)).data;
    assert.equal(
      (await call(`vehicles/${vehicleId}/entries?cursor=${foreignEntry.id}`)).status,
      400,
    );
    assert.equal((await call(`vehicles/${vehicleId}/entries?cursor=missing`)).status, 400);
    assert.equal(first.entries.length, 50);
    assert.equal(second.entries.length, 2);
    assert.equal(second.nextCursor, null);
    assert.equal(new Set([...first.entries, ...second.entries].map((e) => e.id)).size, 52);
    await call(`vehicles/${other.id}`, 'DELETE', undefined, alice);
    assert.equal(await db.vehicleEntry.count({ where: { vehicleId: other.id } }), 0);
  });
  await t.test(
    'explicit linked builds enforce consent and revoke every public read path',
    async () => {
      const path = `vehicles/${vehicleId}/entries`;
      const entry = {
        kind: 'BUILD',
        title: 'Privater Quelltext',
        body: 'INTERNAL-NOTE-DO-NOT-COPY',
        occurredOn: '2026-01-01',
        mileage: null,
        costCents: 98765,
        visibility: 'PRIVATE',
        category: 'BRAKES',
        progress: 40,
      };
      const created = await call(path, 'POST', entry, alice);
      assert.equal(created.status, 201);
      const sourceId = created.data.id;
      const publishPath = `${path}/${sourceId}/publish`;
      const payload = {
        title: 'Öffentlicher Bremsen-Build',
        body: 'Ein bewusst freigegebener öffentlicher Projektbericht.',
        confirmPublic: true,
      };
      assert.equal((await call(publishPath, 'POST', payload, bob)).status, 404);
      assert.equal((await call(publishPath, 'POST', payload, alice)).status, 409);
      await call(`${path}/${sourceId}`, 'PATCH', { ...entry, visibility: 'PUBLIC' }, alice);
      assert.equal(
        (await call(publishPath, 'POST', { ...payload, confirmPublic: false }, alice)).status,
        400,
      );
      const published = await call(publishPath, 'POST', payload, alice);
      assert.equal(published.status, 201);
      const buildId = published.data.id;
      assert.equal((await call(publishPath, 'POST', payload, alice)).status, 409);
      const detail = (await call(`contents/${buildId}`)).data;
      assert.equal(detail.vehicleEntry.progress, 40);
      await call(
        'admin/moderate',
        'POST',
        { contentId: buildId, action: 'HIDE', reason: 'Test der Build-Moderationsgrenze.' },
        moderator,
      );
      assert.equal((await call(`contents/${buildId}`)).status, 404);
      const sourcePublic = (await call(`${path}?kind=BUILD&q=Privater`)).data.entries[0];
      assert.equal(sourcePublic.communityBuild, null);
      await call(`${path}/${sourceId}`, 'PATCH', { ...entry, visibility: 'PUBLIC' }, alice);
      assert.equal((await call(`contents/${buildId}`)).status, 404);
      await call(
        'admin/moderate',
        'POST',
        {
          contentId: buildId,
          action: 'PUBLISH',
          reason: 'Freigabe nach erfolgreicher Testprüfung.',
        },
        moderator,
      );

      assert.equal(detail.vehicleEntry.vehicleId, vehicleId);
      assert.equal(JSON.stringify(detail).includes('98765'), false);
      assert.equal(JSON.stringify(detail).includes('INTERNAL-NOTE'), false);
      assert.equal(
        (
          await call(
            `contents/${buildId}/comments`,
            'POST',
            { body: 'Ein hilfreicher Build!' },
            bob,
          )
        ).status,
        201,
      );
      await call(`contents/${buildId}/reaction`, 'POST', { type: 'SAVE' }, bob);
      assert.equal(
        (await call('saved', 'GET', undefined, bob)).data.some(
          (x: { id: string }) => x.id === buildId,
        ),
        true,
      );
      await call(`${path}/${sourceId}`, 'PATCH', { ...entry, visibility: 'PRIVATE' }, alice);
      for (const cookie of ['', bob, moderator])
        assert.equal((await call(`contents/${buildId}`, 'GET', undefined, cookie)).status, 404);
      assert.equal((await call('contents?kind=BUILD&q=Bremsen')).data.length, 0);
      assert.equal((await call('contents?kind=POST&feed=true&q=Bremsen')).data.length, 0);
      assert.equal(
        (await call('saved', 'GET', undefined, bob)).data.some(
          (x: { id: string }) => x.id === buildId,
        ),
        false,
      );
      assert.equal(
        (
          await call(
            `contents/${buildId}/comments`,
            'POST',
            { body: 'Unzulässiger Kommentar' },
            bob,
          )
        ).status,
        404,
      );
      await call(`${path}/${sourceId}`, 'PATCH', { ...entry, visibility: 'PUBLIC' }, alice);
      await call(`vehicles/${vehicleId}`, 'PATCH', { ...vehicle, visibility: 'PRIVATE' }, alice);
      assert.equal((await call(`contents/${buildId}`)).status, 404);
      assert.equal(
        (await call('contents?kind=BUILD')).data.some((x: { id: string }) => x.id === buildId),
        false,
      );
      await call(`vehicles/${vehicleId}`, 'PATCH', { ...vehicle, visibility: 'PUBLIC' }, alice);
      assert.equal((await call(`contents/${buildId}`)).status, 200);
      const filtered = (await call(`${path}?kind=BUILD&q=Privater`, 'GET', undefined, alice)).data;
      assert.equal(filtered.entries.length, 1);
      assert.equal(
        (await call(`${path}/${sourceId}`, 'PATCH', { ...entry, progress: 101 }, alice)).status,
        400,
      );
      await call(`${path}/${sourceId}`, 'DELETE', undefined, alice);
      assert.equal((await call(`contents/${buildId}`)).status, 404);
      assert.equal(await db.comment.count({ where: { contentId: buildId } }), 0);
      assert.equal(await db.reaction.count({ where: { contentId: buildId } }), 0);
      // Remove this case's notification so pre-existing notification assertions stay isolated.
      await db.notification.deleteMany({ where: { text: { contains: payload.title } } });
    },
  );
  await t.test(
    'member map is opt-in, coarse, and never returns private account fields',
    async () => {
      assert.equal((await call('members', 'GET', undefined, bob)).status, 403);
      const map = await call('members', 'GET', undefined, alice);
      assert.equal(map.status, 200);
      assert.equal(map.data.length, 1);
      assert.equal(map.data[0].email, undefined);
      assert.equal(map.data[0].passwordHash, undefined);
      assert.equal(map.data[0].region.name, 'Bremen-Nord');
      await call(
        'profile',
        'PATCH',
        { bio: 'Privat', regionId: 'bremen-nord', shareRegion: false },
        alice,
      );
      assert.equal((await call('members', 'GET', undefined, alice)).status, 403);
      const id = (await call('me', 'GET', undefined, alice)).data.id;
      assert.equal((await call(`members/${id}`)).data.region, null);
    },
  );
  await t.test('posts are persisted, edits are owner-scoped and rendered as text', async () => {
    const created = await call(
      'contents',
      'POST',
      { ...post, body: '<script>alert(1)</script> stays plain text.' },
      alice,
    );
    assert.equal(created.status, 201);
    postId = created.data.id;
    assert.equal((await call(`contents/${postId}`, 'PATCH', post, bob)).status, 403);
    assert.equal((await call(`contents/${postId}`, 'DELETE', undefined, bob)).status, 403);
    assert.equal((await call('contents?kind=POST')).data[0].id, postId);
  });
  await t.test('comments notify the author; idempotent reactions can be removed', async () => {
    assert.equal(
      (await call(`contents/${postId}/comments`, 'POST', { body: 'Sieht gut aus!' }, bob)).status,
      201,
    );
    assert.equal((await call('notifications', 'GET', undefined, alice)).data.length, 1);
    await call(`contents/${postId}/reaction`, 'POST', { type: 'LIKE' }, bob);
    await call(`contents/${postId}/reaction`, 'POST', { type: 'LIKE' }, bob);
    assert.equal(await db.reaction.count(), 1);
    await call(`contents/${postId}/reaction`, 'DELETE', { type: 'LIKE' }, bob);
    assert.equal(await db.reaction.count(), 0);
    await call(`contents/${postId}/reaction`, 'POST', { type: 'SAVE' }, bob);
    assert.equal((await call('saved', 'GET', undefined, bob)).data.length, 1);
  });
  await t.test('forum, marketplace and builds have independent persistent types', async () => {
    for (const kind of ['TOPIC', 'LISTING', 'BUILD']) {
      const r = await call(
        'contents',
        'POST',
        { ...post, kind, ...(kind === 'LISTING' ? { priceCents: 4500 } : {}) },
        alice,
      );
      assert.equal(r.status, 201);
      assert.equal((await call(`contents?kind=${kind}`)).data.length, 1);
      if (kind === 'LISTING') {
        assert.equal(
          (await call(`contents/${r.data.id}/status`, 'PATCH', { status: 'SOLD' }, bob)).status,
          403,
        );
        assert.equal(
          (await call(`contents/${r.data.id}/status`, 'PATCH', { status: 'SOLD' }, alice)).status,
          200,
        );
      }
    }
  });
  await t.test('event signup is idempotent and cancellable', async () => {
    const r = await call(
      'contents',
      'POST',
      {
        ...post,
        kind: 'EVENT',
        startsAt: new Date(Date.now() + 86400000).toISOString(),
        location: 'Öffentlicher Testtreffpunkt',
      },
      alice,
    );
    eventId = r.data.id;
    assert.equal(r.status, 201);
    await call(`contents/${eventId}/attend`, 'POST', undefined, bob);
    await call(`contents/${eventId}/attend`, 'POST', undefined, bob);
    assert.equal(await db.attendance.count(), 1);
    assert.equal((await call(`contents/${eventId}`, 'GET', undefined, bob)).data.attending, true);
    await call(`contents/${eventId}/attend`, 'DELETE', undefined, bob);
    assert.equal(await db.attendance.count(), 0);
  });
  await t.test('wiki stays private until independent editorial approval', async () => {
    const r = await call(
      'contents',
      'POST',
      { ...post, kind: 'WIKI', sourceUrl: 'https://example.org/test-source' },
      alice,
    );
    wikiId = r.data.id;
    assert.equal(r.data.status, 'DRAFT');
    assert.equal((await call('contents?kind=WIKI')).data.length, 0);
    assert.equal((await call(`contents/${wikiId}`, 'GET', undefined, bob)).status, 404);
    assert.equal((await call('admin', 'GET', undefined, alice)).status, 403);
    assert.equal(
      (
        await call(
          'admin/moderate',
          'POST',
          { contentId: wikiId, action: 'PUBLISH', reason: 'Quelle im Testverfahren geprüft.' },
          moderator,
        )
      ).status,
      200,
    );
    assert.equal((await call('contents?kind=WIKI')).data.length, 1);
    await call(
      `contents/${wikiId}`,
      'PATCH',
      {
        ...post,
        kind: 'WIKI',
        title: 'Überarbeiteter Artikel',
        sourceUrl: 'https://example.org/test-source',
      },
      alice,
    );
    assert.equal((await call('contents?kind=WIKI')).data.length, 0);
    assert.equal(await db.revision.count(), 1);
  });
  await t.test('reports, moderation, audit and hidden-content access rules', async () => {
    assert.equal(
      (
        await call(
          `contents/${postId}/report`,
          'POST',
          { reason: 'Bitte diesen Testinhalt überprüfen.' },
          bob,
        )
      ).status,
      201,
    );
    assert.equal((await call('admin', 'GET', undefined, moderator)).data.reports.length, 1);
    assert.equal(
      (
        await call(
          'admin/moderate',
          'POST',
          { contentId: postId, action: 'HIDE', reason: 'Regelverletzung im Testfall bestätigt.' },
          moderator,
        )
      ).status,
      200,
    );
    assert.equal((await call(`contents/${postId}`, 'GET', undefined, bob)).status, 404);
    assert.equal((await call(`contents/${postId}`, 'PATCH', post, alice)).status, 403);
    assert.equal((await call('saved', 'GET', undefined, bob)).data.length, 0);
    assert.ok((await db.audit.count()) >= 2);
  });
  await t.test('export excludes credentials and other members data', async () => {
    const r = await call('profile/export', 'GET', undefined, alice);
    assert.equal(r.status, 200);
    assert.match(r.headers.get('content-disposition')!, /attachment/);
    assert.equal(r.data.profile.passwordHash, undefined);
    assert.equal(r.data.vehicles.length, 1);
    assert.equal(JSON.stringify(r.data).includes(emails.bob), false);
  });
  await t.test(
    'media persists normalized bytes, guards ownership, scope and visibility, and cascades deletion',
    async () => {
      const sharp = (await import('sharp')).default;
      const bytes = await sharp({
        create: { width: 32, height: 24, channels: 3, background: '#c8ff28' },
      })
        .png()
        .toBuffer();
      const v = (await call('vehicles', 'POST', { ...vehicle, visibility: 'PUBLIC' }, alice)).data;
      const base = `vehicles/${v.id}`;
      async function upload(cookie: string, payload = bytes, suffix = '') {
        return handle(
          new Request(`${origin}/api/${base}/media${suffix}`, {
            method: 'POST',
            headers: { origin, cookie, 'Content-Type': 'application/octet-stream' },
            body: new Uint8Array(payload),
          }),
          `${base}/media${suffix}`.split('/'),
        );
      }
      const first = await upload(alice);
      assert.equal(first.status, 201);
      const m = await first.json();
      assert.equal(m.visibility, 'PRIVATE');
      assert.equal(m.image, undefined);
      assert.equal((await upload(bob)).status, 404);
      assert.equal((await upload('')).status, 401);
      const filePath = `${base}/media/${m.id}/file`;
      const file = async (cookie = '') =>
        handle(
          new Request(`${origin}/api/${filePath}`, { headers: { cookie } }),
          filePath.split('/'),
        );
      assert.equal((await file()).status, 404);
      assert.equal((await file(bob)).status, 404);
      const owned = await file(alice);
      assert.equal(owned.status, 200);
      assert.equal(owned.headers.get('cache-control'), 'private, no-store');
      assert.equal((await sharp(await owned.arrayBuffer()).metadata()).format, 'webp');
      const data = {
        caption: 'Eigene Testaufnahme',
        visibility: 'PUBLIC',
        cover: true,
        position: 2,
        entryId: null,
      };
      assert.equal((await call(`${base}/media/${m.id}`, 'PATCH', data, bob)).status, 404);
      assert.equal((await call(`${base}/media/${m.id}`, 'PATCH', data, alice)).status, 200);
      assert.equal((await file()).status, 200);
      assert.equal((await call(`${base}/media`)).data.length, 1);
      assert.equal((await upload(alice, Buffer.from('<svg/>'))).status, 415);
      assert.equal(await db.vehicleMedia.count({ where: { vehicleId: v.id } }), 1);
      const entryData = {
        kind: 'BUILD',
        title: 'Privater Umbau',
        body: 'Vertrauliche Werkstattbeschreibung.',
        occurredOn: '2026-01-01',
        mileage: null,
        costCents: 12345,
        visibility: 'PRIVATE',
      };
      const entry = (await call(`${base}/entries`, 'POST', entryData, alice)).data;
      assert.equal(
        (await call(`${base}/media/${m.id}`, 'PATCH', { ...data, entryId: entry.id }, alice))
          .status,
        200,
      );
      assert.equal((await file()).status, 404);
      assert.equal((await call(`${base}/media`)).data.length, 0);
      await call(
        `${base}/entries/${entry.id}`,
        'PATCH',
        { ...entryData, visibility: 'PUBLIC' },
        alice,
      );
      assert.equal((await file()).status, 200);
      await call(`vehicles/${v.id}`, 'PATCH', { ...vehicle, visibility: 'PRIVATE' }, alice);
      assert.equal((await file()).status, 404);
      assert.equal((await upload(alice, bytes, `/${m.id}`)).status, 200);
      assert.equal(
        (await call(`${base}/media/${m.id}`, 'PATCH', { ...data, entryId: 'foreign-entry' }, alice))
          .status,
        400,
      );
      const exp = (await call('profile/export', 'GET', undefined, alice)).data.vehicles.find(
        (x: { id: string }) => x.id === v.id,
      );
      assert.equal(exp.media.length, 1);
      assert.equal(exp.media[0].image, undefined);
      await call(`${base}/entries/${entry.id}`, 'DELETE', undefined, alice);
      assert.equal(await db.vehicleMedia.count({ where: { vehicleId: v.id } }), 0);
      await call(base, 'DELETE', undefined, alice);
      assert.equal(await db.vehicleChange.count({ where: { vehicleId: v.id } }), 0);
    },
  );
  await t.test(
    'parts and milestones persist, redact prices, validate cross-vehicle references and privatize on unlink',
    async () => {
      const v = (await call('vehicles', 'POST', { ...vehicle, visibility: 'PUBLIC' }, alice)).data;
      const other = (await call('vehicles', 'POST', vehicle, bob)).data;
      const base = `vehicles/${v.id}`;
      const data = {
        name: 'Selbst dokumentiertes Teil',
        category: 'BRAKES',
        priceCents: 12345,
        source: 'Private Bezugsquelle',
        visibility: 'PUBLIC',
      };
      const p = await call(`${base}/parts`, 'POST', data, alice);
      assert.equal(p.status, 201);
      const publicPart = (await call(`${base}/parts`)).data[0];
      assert.equal(publicPart.priceCents, undefined);
      assert.equal(publicPart.source, undefined);
      assert.equal(
        (await call(`${base}/parts`, 'GET', undefined, alice)).data[0].priceCents,
        12345,
      );
      assert.equal((await call(`${base}/parts/${p.data.id}`, 'PATCH', data, bob)).status, 404);
      assert.equal(
        (await call(`vehicles/${other.id}/parts/${p.data.id}`, 'DELETE', undefined, bob)).status,
        404,
      );
      const foreign = (
        await call(
          `vehicles/${other.id}/parts`,
          'POST',
          { name: 'Fremdes Teil', category: 'OTHER' },
          bob,
        )
      ).data;
      const target = {
        title: 'Fahrwerk Etappe',
        category: 'SUSPENSION',
        status: 'ACTIVE',
        progress: 35,
        visibility: 'PUBLIC',
        partId: p.data.id,
      };
      assert.equal(
        (await call(`${base}/milestones`, 'POST', { ...target, partId: foreign.id }, alice)).status,
        400,
      );
      const m = await call(`${base}/milestones`, 'POST', target, alice);
      assert.equal(m.status, 201);
      assert.equal((await call(`${base}/milestones`)).data[0].progress, 35);
      assert.equal(
        (
          await call(
            `${base}/milestones/${m.data.id}`,
            'PATCH',
            { ...target, status: 'COMPLETED', progress: 100 },
            alice,
          )
        ).status,
        400,
      );
      assert.equal(
        (
          await call(
            `${base}/milestones/${m.data.id}`,
            'PATCH',
            { ...target, status: 'COMPLETED', progress: 100, completedOn: '2026-01-01' },
            alice,
          )
        ).status,
        200,
      );
      await call(`${base}/parts/${p.data.id}`, 'PATCH', { ...data, visibility: 'PRIVATE' }, alice);
      assert.equal((await call(`${base}/milestones`)).data.length, 0);
      await call(`${base}/parts/${p.data.id}`, 'DELETE', undefined, alice);
      const saved = (await call(`${base}/milestones`, 'GET', undefined, alice)).data[0];
      assert.equal(saved.partId, null);
      assert.equal(saved.visibility, 'PRIVATE');
      assert.equal((await call(`${base}/changes`, 'GET', undefined, bob)).status, 404);
      const history = (await call(`${base}/changes`, 'GET', undefined, alice)).data.changes;
      assert.ok(history.length >= 5);
      assert.equal(JSON.stringify(history).includes('12345'), false);
      assert.equal(JSON.stringify(history).includes('Private Bezugsquelle'), false);
      assert.equal((await call(`${base}/changes`, 'DELETE', undefined, alice)).status, 405);
      assert.equal(
        (await call(`${base}/milestones/${m.data.id}`, 'DELETE', undefined, alice)).status,
        200,
      );
      await call(base, 'DELETE', undefined, alice);
      await call(`vehicles/${other.id}`, 'DELETE', undefined, bob);
    },
  );
  await t.test(
    'private journal deletion cannot implicitly publish dependent parts or milestones',
    async () => {
      const v = (await call('vehicles', 'POST', { ...vehicle, visibility: 'PUBLIC' }, alice)).data;
      const base = `vehicles/${v.id}`;
      const e = (
        await call(
          `${base}/entries`,
          'POST',
          {
            kind: 'REPAIR',
            title: 'Privater Eintrag',
            body: 'Vertrauliche Testnotiz.',
            occurredOn: '2026-01-01',
            mileage: null,
            costCents: null,
          },
          alice,
        )
      ).data;
      const p = (
        await call(
          `${base}/parts`,
          'POST',
          { name: 'Verknüpftes Teil', category: 'OTHER', entryId: e.id, visibility: 'PUBLIC' },
          alice,
        )
      ).data;
      await call(
        `${base}/milestones`,
        'POST',
        { title: 'Verknüpftes Ziel', category: 'OTHER', partId: p.id, visibility: 'PUBLIC' },
        alice,
      );
      assert.equal((await call(`${base}/parts`)).data.length, 0);
      assert.equal((await call(`${base}/milestones`)).data.length, 0);
      await call(`${base}/entries/${e.id}`, 'DELETE', undefined, alice);
      assert.equal((await call(`${base}/parts`)).data.length, 0);
      assert.equal((await call(`${base}/milestones`)).data.length, 0);
      assert.equal(
        (await call(`${base}/parts`, 'GET', undefined, alice)).data[0].visibility,
        'PRIVATE',
      );
      await call(base, 'DELETE', undefined, alice);
    },
  );
  await t.test(
    'media links respect parts and milestone privacy; concurrent covers remain unique and quota is enforced',
    async () => {
      const sharp = (await import('sharp')).default;
      const bytes = await sharp({
        create: { width: 8, height: 8, channels: 3, background: '#333' },
      })
        .png()
        .toBuffer();
      const v = (await call('vehicles', 'POST', { ...vehicle, visibility: 'PUBLIC' }, alice)).data;
      const base = `vehicles/${v.id}`;
      const upload = () =>
        handle(
          new Request(`${origin}/api/${base}/media`, {
            method: 'POST',
            headers: { origin, cookie: alice },
            body: new Uint8Array(bytes),
          }),
          `${base}/media`.split('/'),
        );
      const a = await (await upload()).json(),
        b = await (await upload()).json();
      const meta = {
        caption: 'Testbild',
        visibility: 'PUBLIC',
        cover: true,
        position: 0,
        entryId: null,
      };
      const results = await Promise.all([
        call(`${base}/media/${a.id}`, 'PATCH', meta, alice),
        call(`${base}/media/${b.id}`, 'PATCH', meta, alice),
      ]);
      assert.ok(results.every((r) => r.status === 200));
      assert.equal(await db.vehicleMedia.count({ where: { vehicleId: v.id, cover: true } }), 1);
      const p = (
        await call(`${base}/parts`, 'POST', { name: 'Privates Teil', category: 'OTHER' }, alice)
      ).data;
      assert.equal(
        (await call(`${base}/media/${a.id}`, 'PATCH', { ...meta, partId: p.id }, alice)).status,
        200,
      );
      const filePath = `${base}/media/${a.id}/file`;
      const read = () => handle(new Request(`${origin}/api/${filePath}`), filePath.split('/'));
      assert.equal((await read()).status, 404);
      await call(
        `${base}/parts/${p.id}`,
        'PATCH',
        { name: 'Freigegebenes Teil', category: 'OTHER', visibility: 'PUBLIC' },
        alice,
      );
      assert.equal((await read()).status, 200);
      const m = (
        await call(
          `${base}/milestones`,
          'POST',
          { title: 'Privates Ziel', category: 'OTHER' },
          alice,
        )
      ).data;
      await call(`${base}/media/${a.id}`, 'PATCH', { ...meta, milestoneId: m.id }, alice);
      assert.equal((await read()).status, 404);
      await call(`${base}/milestones/${m.id}`, 'DELETE', undefined, alice);
      assert.equal(
        (await call(`${base}/media`, 'GET', undefined, alice)).data.find(
          (r: { id: string }) => r.id === a.id,
        ).visibility,
        'PRIVATE',
      );
      assert.equal(
        (await call(`${base}/media/${a.id}`, 'PATCH', { ...meta, partId: 'foreign' }, alice))
          .status,
        400,
      );
      assert.equal(
        (await call(`${base}/media/${a.id}`, 'PATCH', { ...meta, milestoneId: 'foreign' }, alice))
          .status,
        400,
      );
      const source = await db.vehicleMedia.findUniqueOrThrow({ where: { id: a.id } });
      await db.vehicleMedia.createMany({
        data: Array.from({ length: 22 }, () => ({
          vehicleId: v.id,
          image: source.image,
          thumbnail: source.thumbnail,
          width: 8,
          height: 8,
        })),
      });
      assert.equal((await upload()).status, 409);
      assert.equal(await db.vehicleMedia.count({ where: { vehicleId: v.id } }), 24);
      await call(base, 'DELETE', undefined, alice);
      assert.equal(await db.vehicleMedia.count({ where: { vehicleId: v.id } }), 0);
    },
  );
  await t.test(
    'journal recovery: consent, ownership, private restore, conflict and purge',
    async () => {
      const car = (await call('vehicles', 'POST', vehicle, alice)).data;
      const path = `vehicles/${car.id}/entries`;
      const initial = {
        kind: 'BUILD',
        title: 'Original project',
        body: 'Original private description.',
        occurredOn: '2026-01-10',
        mileage: 1000,
        costCents: 12345,
        visibility: 'PUBLIC',
        keepVersions: true,
      };
      const created = await call(path, 'POST', initial, alice);
      assert.equal(created.status, 201);
      const base = `${path}/${created.data.id}`;
      assert.equal((await call(`${base}/versions`)).status, 401);
      assert.equal((await call(`${base}/versions`, 'GET', undefined, bob)).status, 404);
      assert.equal((await call(`${base}/versions`, 'GET', undefined, moderator)).status, 404);
      assert.equal(
        (
          await call(
            base,
            'PATCH',
            { ...initial, title: 'Changed project', costCents: 22222, expectedRevision: 1 },
            alice,
          )
        ).status,
        200,
      );
      await call(`vehicles/${car.id}`, 'PATCH', { ...vehicle, visibility: 'PUBLIC' }, alice);
      const published = await call(
        `${base}/publish`,
        'POST',
        {
          title: 'Explicit public build',
          body: 'An explicitly shared project update.',
          confirmPublic: true,
        },
        alice,
      );
      assert.equal(published.status, 201);
      assert.equal((await call(`contents/${published.data.id}`)).status, 200);
      const history = (await call(`${base}/versions`, 'GET', undefined, alice)).data;
      assert.equal(history.revision, 2);
      assert.equal(history.versions.length, 1);
      assert.deepEqual(Object.keys(history.versions[0].snapshot).sort(), [
        'body',
        'category',
        'kind',
        'occurredOn',
        'progress',
        'title',
      ]);
      const restore = {
        versionId: history.versions[0].id,
        expectedRevision: 2,
        confirmPrivate: true,
      };
      assert.equal((await call(`${base}/restore`, 'POST', restore, bob)).status, 404);
      assert.equal(
        (await call(`${base}/restore`, 'POST', { ...restore, confirmPrivate: false }, alice))
          .status,
        400,
      );
      assert.equal((await call(`${base}/restore`, 'POST', restore, alice)).status, 200);
      const restored = await db.vehicleEntry.findUniqueOrThrow({ where: { id: created.data.id } });
      assert.equal(restored.title, initial.title);
      assert.equal(restored.visibility, 'PRIVATE');
      assert.equal(restored.costCents, 22222);
      assert.equal(restored.revision, 3);
      assert.equal((await call(`contents/${published.data.id}`)).status, 404);
      assert.equal(
        (await call(`contents/${published.data.id}`, 'GET', undefined, bob)).status,
        404,
      );
      assert.equal((await call(base, 'DELETE', { expectedRevision: 2 }, alice)).status, 409);
      const writes = await Promise.all(
        ['Concurrent one', 'Concurrent two'].map((title) =>
          call(base, 'PATCH', { ...initial, title, expectedRevision: 3 }, alice),
        ),
      );
      assert.deepEqual(writes.map((r) => r.status).sort(), [200, 409]);
      assert.equal(
        (await call(`${base}/versions`, 'DELETE', { expectedRevision: 4 }, alice)).status,
        200,
      );
      assert.equal(await db.vehicleEntryVersion.count({ where: { entryId: created.data.id } }), 0);
      assert.equal(
        (await call(`${base}/restore`, 'POST', { ...restore, expectedRevision: 5 }, alice)).status,
        404,
      );
      // Opted-out saves retain nothing; enabling consent does not backfill prior text.
      assert.equal(
        (await call(base, 'PATCH', { ...initial, keepVersions: false, expectedRevision: 5 }, alice))
          .status,
        200,
      );
      assert.equal(await db.vehicleEntryVersion.count({ where: { entryId: created.data.id } }), 0);
      await call(base, 'PATCH', { ...initial, expectedRevision: 6 }, alice);
      assert.equal(await db.vehicleEntryVersion.count({ where: { entryId: created.data.id } }), 0);
      for (let revision = 7; revision < 29; revision++) {
        assert.equal(
          (
            await call(
              base,
              'PATCH',
              { ...initial, title: `Retained revision ${revision}`, expectedRevision: revision },
              alice,
            )
          ).status,
          200,
        );
      }
      assert.equal(await db.vehicleEntryVersion.count({ where: { entryId: created.data.id } }), 20);
      const expired = await db.vehicleEntryVersion.findFirstOrThrow({
        where: { entryId: created.data.id },
      });
      await db.vehicleEntryVersion.update({
        where: { id: expired.id },
        data: {
          createdAt: new Date(Date.now() - 86400000),
          expiresAt: new Date(Date.now() - 1000),
        },
      });
      assert.equal(
        (
          await call(
            `${base}/restore`,
            'POST',
            { versionId: expired.id, expectedRevision: 29, confirmPrivate: true },
            alice,
          )
        ).status,
        404,
      );
      assert.equal(
        (await call(`${base}/versions`, 'GET', undefined, alice)).data.versions.length,
        19,
      );
      assert.equal((await call(`vehicles/${car.id}`, 'DELETE', undefined, alice)).status, 200);
    },
  );
  await t.test('reset tokens expire and reset revokes existing sessions', async () => {
    const user = await db.user.findUniqueOrThrow({ where: { username: 'bob' } });
    const expired = newToken();
    await db.authToken.create({
      data: {
        userId: user.id,
        tokenHash: digest(expired),
        purpose: 'reset',
        expiresAt: new Date(0),
      },
    });
    assert.equal(
      (await call('auth/reset', 'POST', { token: expired, password: pass })).status,
      400,
    );
    await call('auth/request-reset', 'POST', { email: emails.bob });
    const token = await mailToken(emails.bob, 'reset');
    assert.equal(
      (await call('auth/reset', 'POST', { token, password: 'changed test password 456' })).status,
      200,
    );
    assert.equal((await call('me', 'GET', undefined, bob)).data, null);
    assert.equal(
      (await call('auth/login', 'POST', { email: emails.bob, password: pass })).status,
      401,
    );
  });
  await t.test('server-side throttling is atomic', async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, () => rate('atomic-test', 3)),
    );
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 3);
  });
  await t.test(
    'account deletion requires password, cascades records and revokes sessions',
    async () => {
      assert.equal((await call('profile', 'DELETE', { password: 'wrong' }, alice)).status, 403);
      assert.equal((await call('profile', 'DELETE', { password: pass }, alice)).status, 200);
      assert.equal((await call('me', 'GET', undefined, alice)).data, null);
      assert.equal(await db.vehicle.count(), 0);
      assert.equal(await db.content.count(), 0);
      assert.equal(await db.comment.count(), 0);
      assert.equal(await db.reaction.count(), 0);
    },
  );
  await db.$disconnect();
});
