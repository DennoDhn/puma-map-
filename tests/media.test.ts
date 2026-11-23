import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { normalizeImage, MAX_UPLOAD } from '../src/lib/media';
import { HttpError } from '../src/lib/security';
import { milestoneInput, partInput } from '../src/lib/workspace-validation';
const request = (bytes: Uint8Array) =>
  new Request('http://localhost/upload', { method: 'POST', body: new Uint8Array(bytes) });
test('image normalization decodes, rotates, bounds dimensions and removes metadata', async () => {
  const source = await sharp({
    create: { width: 2400, height: 1200, channels: 3, background: '#468542' },
  })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .withExif({ IFD0: { Artist: 'private-owner' } })
    .toBuffer();
  const result = await normalizeImage(request(source));
  const meta = await sharp(result.image).metadata();
  assert.equal(meta.format, 'webp');
  assert.ok(result.width <= 1920 && result.height <= 1920);
  assert.equal(meta.exif, undefined);
  assert.equal(meta.icc, undefined);
  assert.equal(meta.xmp, undefined);
  assert.equal(meta.orientation, undefined);
  assert.ok((await sharp(result.thumbnail).metadata()).width! <= 640);
});
test('rejects SVG, executable and forged PNG payloads', async () => {
  for (const bytes of [
    Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
    Buffer.from('MZpretend.jpg'),
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1, 2]),
  ])
    await assert.rejects(
      normalizeImage(request(bytes)),
      (e) => e instanceof HttpError && e.status === 415,
    );
});
test('rejects oversized streamed upload without Content-Length', async () => {
  await assert.rejects(
    normalizeImage(request(new Uint8Array(MAX_UPLOAD + 1))),
    (e) => e instanceof HttpError && e.status === 413,
  );
});
test('rejects decoded image above pixel limit', async () => {
  const source = await sharp({
    create: { width: 5000, height: 5000, channels: 3, background: '#111' },
  })
    .png()
    .toBuffer();
  await assert.rejects(
    normalizeImage(request(source)),
    (e) => e instanceof HttpError && e.status === 415,
  );
});
test('accepts JPEG PNG and WebP based on bytes rather than filename or claimed MIME', async () => {
  for (const format of ['jpeg', 'png', 'webp'] as const) {
    const source = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#111' } })
      .toFormat(format)
      .toBuffer();
    assert.equal((await normalizeImage(request(source))).width, 8);
  }
});
test('part defaults private and rejects injected ownership and negative price', () => {
  assert.equal(partInput.parse({ name: 'Testteil', category: 'OTHER' }).visibility, 'PRIVATE');
  for (const extra of [{ ownerId: 'attacker' }, { priceCents: -1 }, { mileage: 1.2 }])
    assert.equal(
      partInput.safeParse({ name: 'Testteil', category: 'OTHER', ...extra }).success,
      false,
    );
});
test('milestone status, progress and completion date must agree', () => {
  const base = { title: 'Projektziel', category: 'OTHER' };
  assert.equal(
    milestoneInput.safeParse({ ...base, status: 'COMPLETED', progress: 100 }).success,
    false,
  );
  assert.equal(
    milestoneInput.safeParse({ ...base, status: 'ACTIVE', progress: 100 }).success,
    false,
  );
  assert.equal(
    milestoneInput.safeParse({
      ...base,
      status: 'COMPLETED',
      progress: 100,
      completedOn: '2026-01-01',
    }).success,
    true,
  );
});
