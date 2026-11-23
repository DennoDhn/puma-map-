import test from 'node:test';
import assert from 'node:assert/strict';
import { registration, vehicle, content } from '../src/lib/validation';
import {
  hashPassword,
  checkPassword,
  digest,
  newToken,
  canModerate,
  checkOrigin,
} from '../src/lib/security';
test('password hashes use unique salts and verify only the correct password', async () => {
  const a = await hashPassword('a secure test passphrase');
  const b = await hashPassword('a secure test passphrase');
  assert.notEqual(a, b);
  assert.equal(await checkPassword('a secure test passphrase', a), true);
  assert.equal(await checkPassword('wrong', a), false);
  assert.equal(await checkPassword('wrong', 'malformed'), false);
});
test('tokens have high entropy and are stored through a digest', () => {
  const a = newToken(),
    b = newToken();
  assert.notEqual(a, b);
  assert.equal(digest(a).length, 64);
  assert.notEqual(a, digest(a));
  assert.ok(a.length >= 43);
});
test('registration rejects privilege escalation fields and missing regional consent data', () => {
  const valid = {
    username: 'collective',
    email: 'person@example.org',
    password: 'a very long password',
  };
  assert.equal(registration.safeParse({ ...valid, role: 'ADMIN' }).success, false);
  assert.equal(registration.safeParse({ ...valid, shareRegion: true }).success, false);
  assert.equal(registration.parse(valid).shareRegion, false);
});
test('vehicle validation rejects unsupported years and invalid mileage', () => {
  const base = {
    name: 'Puma',
    variant: '1.7',
    year: 2000,
    powerKw: null,
    mileage: 100000,
    color: 'Grün',
    description: '',
    visibility: 'PRIVATE',
  };
  assert.equal(vehicle.safeParse(base).success, true);
  assert.equal(vehicle.safeParse({ ...base, year: 2024 }).success, false);
  assert.equal(vehicle.safeParse({ ...base, mileage: -1 }).success, false);
});
test('wiki requires a real HTTPS source field; arbitrary schemes are rejected', () => {
  const base = {
    kind: 'WIKI',
    title: 'Prüfartikel',
    body: 'Ein ausreichend langer Artikeltext.',
    category: 'Wartung',
  };
  assert.equal(content.safeParse(base).success, false);
  assert.equal(content.safeParse({ ...base, sourceUrl: 'javascript:alert(1)' }).success, false);
  assert.equal(
    content.safeParse({ ...base, sourceUrl: 'https://example.org/source' }).success,
    true,
  );
});
test('events require a future time and public meeting place', () => {
  const base = {
    kind: 'EVENT',
    title: 'Treffen',
    body: 'Wir treffen uns zum Austausch.',
    category: 'Treffen',
  };
  assert.equal(content.safeParse(base).success, false);
  assert.equal(
    content.safeParse({ ...base, startsAt: '2000-01-01T12:00:00Z', location: 'Parkplatz' }).success,
    false,
  );
});
test('RBAC denies members and unknown roles', () => {
  assert.equal(canModerate('MEMBER'), false);
  assert.equal(canModerate('owner'), false);
  assert.equal(canModerate('MODERATOR'), true);
  assert.equal(canModerate('ADMIN'), true);
});
test('cross-origin writes and absent origin are rejected', () => {
  process.env.APP_ORIGIN = 'https://puma-map.de';
  assert.throws(() =>
    checkOrigin(
      new Request('https://puma-map.de/api/profile', {
        headers: { origin: 'https://evil.example' },
      }),
    ),
  );
  assert.throws(() => checkOrigin(new Request('https://puma-map.de/api/profile')));
  assert.doesNotThrow(() =>
    checkOrigin(
      new Request('https://puma-map.de/api/profile', {
        headers: { origin: 'https://puma-map.de' },
      }),
    ),
  );
});
