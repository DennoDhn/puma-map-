import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from 'pg';
import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
test('0.4 through 0.6 additive migrations retains old vehicles, journals and builds and enforces new constraints', async () => {
  const url = new URL(process.env.DATABASE_URL!);
  assert.match(url.pathname, /_test$/);
  assert.equal(process.env.TEST_DATABASE_CONFIRM, 'isolated');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const schema = `migration_${randomBytes(8).toString('hex')}`;
  try {
    await client.query(`CREATE SCHEMA "${schema}"`);
    await client.query(`SET search_path TO "${schema}"`);
    for (const name of [
      '202611130001_foundation',
      '20261113220000_vehicle_journal',
      '20261114120000_community_builds',
    ])
      await client.query(await readFile(`prisma/migrations/${name}/migration.sql`, 'utf8'));
    await client.query(
      `INSERT INTO "User" (id,email,username,"passwordHash") VALUES ('owner','qa@example.test','qa','fixture')`,
    );
    await client.query(
      `INSERT INTO "Vehicle" (id,"ownerId",name,variant,year,color,"updatedAt") VALUES ('car','owner','Preserved','1.7',2000,'Green',now())`,
    );
    await client.query(
      `INSERT INTO "VehicleEntry" (id,"vehicleId",kind,title,body,"occurredOn","costCents","updatedAt") VALUES ('entry','car','BUILD','Preserved journal','Private notes','2026-01-01',9900,now())`,
    );
    await client.query(
      `INSERT INTO "Content" (id,"authorId",kind,title,body,category,"vehicleEntryId","updatedAt") VALUES ('build','owner','BUILD','Preserved build','Consented public snapshot','OTHER','entry',now())`,
    );
    await client.query(
      await readFile('prisma/migrations/20261114180000_vehicle_workspace/migration.sql', 'utf8'),
    );
    await client.query(
      await readFile('prisma/migrations/20261114193000_journal_versions/migration.sql', 'utf8'),
    );
    await client.query(
      await readFile('prisma/migrations/20261115120000_community_engine/migration.sql', 'utf8'),
    );
    assert.deepEqual(
      (await client.query(`SELECT locked,pinned FROM "Content" WHERE id='build'`)).rows[0],
      { locked: false, pinned: false },
    );
    const retained = (
      await client.query(`SELECT revision,"keepVersions" FROM "VehicleEntry" WHERE id='entry'`)
    ).rows[0];
    assert.deepEqual(retained, { revision: 1, keepVersions: false });
    assert.equal(
      (await client.query(`SELECT "vehicleEntryId" FROM "Content" WHERE id='build'`)).rows[0]
        .vehicleEntryId,
      'entry',
    );
    const row = (
      await client.query(`SELECT "costCents",visibility FROM "VehicleEntry" WHERE id='entry'`)
    ).rows[0];
    assert.equal(row.costCents, 9900);
    assert.equal(row.visibility, 'PRIVATE');
    await assert.rejects(
      client.query(
        `INSERT INTO "VehicleMilestone" (id,"vehicleId",title,category,status,progress,"updatedAt") VALUES ('bad','car','Invalid','OTHER','COMPLETED',100,now())`,
      ),
      /milestone_progress/,
    );
    await assert.rejects(
      client.query(
        `INSERT INTO "VehiclePart" (id,"vehicleId",name,category,"priceCents","updatedAt") VALUES ('bad','car','Invalid','OTHER',-1,now())`,
      ),
      /part_numbers/,
    );
  } finally {
    await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await client.end();
  }
});
