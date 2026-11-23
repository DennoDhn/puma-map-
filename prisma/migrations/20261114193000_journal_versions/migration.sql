ALTER TABLE "VehicleEntry" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 1,
 ADD COLUMN "keepVersions" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "VehicleEntry" ADD CONSTRAINT "entry_positive_revision" CHECK ("revision" > 0);
CREATE TABLE "VehicleEntryVersion" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "entryId" TEXT NOT NULL REFERENCES "VehicleEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "revision" INTEGER NOT NULL CHECK ("revision" > 0),
 "actorId" TEXT NOT NULL,
 "snapshot" JSONB NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "expiresAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "version_bounded_lifetime" CHECK ("expiresAt" > "createdAt" AND "expiresAt" <= "createdAt" + INTERVAL '30 days'),
 CONSTRAINT "version_snapshot_fields" CHECK (
  jsonb_typeof("snapshot") = 'object' AND
  "snapshot" - ARRAY['kind','title','body','category','progress','occurredOn']::text[] = '{}'::jsonb
 )
);
CREATE UNIQUE INDEX "VehicleEntryVersion_entryId_revision_key" ON "VehicleEntryVersion"("entryId","revision");
CREATE INDEX "VehicleEntryVersion_expiresAt_idx" ON "VehicleEntryVersion"("expiresAt");
