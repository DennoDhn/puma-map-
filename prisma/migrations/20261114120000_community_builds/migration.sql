ALTER TABLE "VehicleEntry" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'OTHER', ADD COLUMN "progress" INTEGER NOT NULL DEFAULT 0 CHECK ("progress" BETWEEN 0 AND 100);
ALTER TABLE "Content" ADD COLUMN "vehicleEntryId" TEXT;
CREATE UNIQUE INDEX "Content_vehicleEntryId_key" ON "Content"("vehicleEntryId");
ALTER TABLE "Content" ADD CONSTRAINT "Content_vehicleEntryId_fkey" FOREIGN KEY ("vehicleEntryId") REFERENCES "VehicleEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
