/** Isolated cold-cluster restore drill. Never accepts an existing database or directory.
 * Requires EMBEDDED_PG_MODULE pointing to an installed embedded-postgres ESM entry.
 * Development fixture only; never a live-cluster or cross-version backup mechanism.
 */
import { mkdtemp, appendFile, cp, readdir, readFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash, randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { Client } from 'pg';
import sharp from 'sharp';
if (process.env.TEST_DATABASE_CONFIRM !== 'isolated' || !process.env.EMBEDDED_PG_MODULE)
  throw new Error('Explicit isolated fixture runtime required');
const { default: EmbeddedPostgres } = await import(
  pathToFileURL(resolve(process.env.EMBEDDED_PG_MODULE)).href
);
process.umask(0o077);
const root = process.cwd();
const temp = await mkdtemp(join(root, '.local/restore-drill-'));
const original = join(temp, 'original'),
  backup = join(temp, 'backup'),
  restored = join(temp, 'restored');
const password = randomBytes(24).toString('hex');
const options = {
  user: 'restore_fixture',
  password,
  port: 55435,
  persistent: true,
  authMethod: 'scram-sha-256',
  initdbFlags: ['--encoding=UTF8', '--locale=C'],
  onLog: () => {},
  onError: () => {},
};
const source = new EmbeddedPostgres({ ...options, databaseDir: original });
let target;
let running;
const connectionString = `postgresql://restore_fixture:${password}@127.0.0.1:55435/restore_fixture_test`;
async function connect() {
  const c = new Client({ connectionString });
  await c.connect();
  return c;
}
async function fingerprints(client) {
  const tables = (
    await client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename",
    )
  ).rows;
  const result = {};
  for (const { tablename } of tables) {
    const quoted = '"' + tablename.replaceAll('"', '""') + '"';
    const rows = (
      await client.query(
        `SELECT row_to_json(t)::text AS value FROM ${quoted} t ORDER BY row_to_json(t)::text`,
      )
    ).rows.map((r) => r.value);
    result[tablename] = {
      rows: rows.length,
      sha256: createHash('sha256').update(JSON.stringify(rows)).digest('hex'),
    };
  }
  return result;
}
async function files(dir, prefix = '') {
  const out = {};
  for (const item of await readdir(join(dir, prefix), { withFileTypes: true })) {
    const name = join(prefix, item.name);
    if (item.isDirectory()) Object.assign(out, await files(dir, name));
    else if (item.isFile())
      out[name] = createHash('sha256')
        .update(await readFile(join(dir, name)))
        .digest('hex');
    else throw new Error('Unexpected symlink in fixture cluster');
  }
  return out;
}
try {
  await source.initialise();
  await appendFile(join(original, 'postgresql.conf'), "\nunix_socket_directories = ''\n");
  await source.start();
  running = source;
  await source.createDatabase('restore_fixture_test');
  const env = { ...process.env, DATABASE_URL: connectionString };
  const migrate = () => {
    const r = spawnSync(
      process.execPath,
      ['node_modules/prisma/build/index.js', 'migrate', 'deploy'],
      { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    assert.equal(r.status, 0, 'Migration failed');
  };
  migrate();
  const c = await connect();
  await c.query(
    `INSERT INTO "User" (id,email,username,"passwordHash","verifiedAt") VALUES ('restore-owner','restore@example.test','restore_owner','unusable-fixture',now())`,
  );
  await c.query(
    `INSERT INTO "Vehicle" (id,"ownerId",name,variant,year,color,"updatedAt") VALUES ('restore-car','restore-owner','Private restore fixture','1.7',2000,'Green',now())`,
  );
  await c.query(
    `INSERT INTO "VehicleEntry" (id,"vehicleId",kind,title,body,"occurredOn","costCents","updatedAt","keepVersions") VALUES ('restore-entry','restore-car','BUILD','Private notes','Synthetic private history',CURRENT_DATE,19234,now(),true)`,
  );
  await c.query(
    `INSERT INTO "VehicleEntryVersion" (id,"entryId",revision,"actorId",snapshot,"expiresAt") VALUES ('restore-version','restore-entry',1,'restore-owner','{"title":"Earlier notes","body":"Synthetic earlier history","kind":"BUILD","category":"OTHER","progress":0,"occurredOn":"2026-01-01"}',now()+interval '1 day')`,
  );
  await c.query(
    `INSERT INTO "Content" (id,"authorId",kind,title,body,category,"updatedAt") VALUES ('restore-topic','restore-owner','TOPIC','Fixture topic','Synthetic discussion content','QA',now())`,
  );
  await c.query(
    `INSERT INTO "Subscription" ("userId","contentId") VALUES ('restore-owner','restore-topic')`,
  );
  const image = await sharp({
    create: { width: 64, height: 64, channels: 3, background: '#52643a' },
  })
    .webp()
    .toBuffer();
  await c.query(
    `INSERT INTO "VehicleMedia" (id,"vehicleId","entryId",width,height,image,thumbnail,"updatedAt") VALUES ('restore-image','restore-car','restore-entry',64,64,$1,$1,now())`,
    [image],
  );
  const before = await fingerprints(c);
  await c.end();
  await source.stop();
  running = null;
  const originalFiles = await files(original);
  await cp(original, backup, { recursive: true, errorOnExist: true, force: false });
  assert.deepEqual(await files(backup), originalFiles);
  await cp(backup, restored, { recursive: true, errorOnExist: true, force: false });
  assert.deepEqual(await files(restored), originalFiles);
  target = new EmbeddedPostgres({ ...options, databaseDir: restored });
  await target.start();
  running = target;
  const check = await connect();
  assert.deepEqual(await fingerprints(check), before);
  assert.equal(
    (await check.query(`SELECT visibility FROM "Vehicle" WHERE id='restore-car'`)).rows[0]
      .visibility,
    'PRIVATE',
  );
  assert.equal(
    (await check.query(`SELECT "costCents" FROM "VehicleEntry" WHERE id='restore-entry'`)).rows[0]
      .costCents,
    19234,
  );
  await check.end();
  migrate();
  const after = await connect();
  assert.deepEqual(await fingerprints(after), before);
  await after.end();
  console.log(
    JSON.stringify({
      passed: true,
      method: 'offline physical cluster copy, same PostgreSQL runtime',
      tables: Object.keys(before).length,
      rows: Object.values(before).reduce((a, t) => a + t.rows, 0),
      files: Object.keys(originalFiles).length,
      binaryVerified: true,
      migrationReplay: true,
    }),
  );
} finally {
  if (running) await running.stop();
  await rm(temp, { recursive: true, force: true });
}
