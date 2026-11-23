CREATE TABLE "VehicleEntry" (
 "id" TEXT NOT NULL PRIMARY KEY, "vehicleId" TEXT NOT NULL,
 "kind" TEXT NOT NULL CHECK ("kind" IN ('BUILD','MAINTENANCE','REPAIR')),
 "title" TEXT NOT NULL, "body" TEXT NOT NULL, "occurredOn" DATE NOT NULL,
 "mileage" INTEGER CHECK ("mileage" BETWEEN 0 AND 2000000),
 "costCents" INTEGER CHECK ("costCents" BETWEEN 0 AND 100000000),
 "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "VehicleEntry_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "VehicleEntry_vehicleId_occurredOn_id_idx" ON "VehicleEntry"("vehicleId", "occurredOn", "id");
