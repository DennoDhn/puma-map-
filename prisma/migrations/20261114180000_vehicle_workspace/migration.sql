-- CreateTable
CREATE TABLE "VehicleMedia" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "entryId" TEXT,
    "caption" TEXT NOT NULL DEFAULT '',
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "position" INTEGER NOT NULL DEFAULT 0,
    "cover" BOOLEAN NOT NULL DEFAULT false,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "image" BYTEA NOT NULL,
    "thumbnail" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehiclePart" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "entryId" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL DEFAULT '',
    "partNumber" TEXT NOT NULL DEFAULT '',
    "condition" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "installedOn" DATE,
    "mileage" INTEGER,
    "source" TEXT NOT NULL DEFAULT '',
    "priceCents" INTEGER,
    "notes" TEXT NOT NULL DEFAULT '',
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehiclePart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleMilestone" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "entryId" TEXT,
    "partId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "targetOn" DATE,
    "completedOn" DATE,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleChange" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fields" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VehicleMedia_vehicleId_position_id_idx" ON "VehicleMedia"("vehicleId", "position", "id");

-- CreateIndex
CREATE INDEX "VehiclePart_vehicleId_createdAt_id_idx" ON "VehiclePart"("vehicleId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "VehicleMilestone_vehicleId_createdAt_id_idx" ON "VehicleMilestone"("vehicleId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "VehicleChange_vehicleId_createdAt_id_idx" ON "VehicleChange"("vehicleId", "createdAt", "id");

-- AddForeignKey
ALTER TABLE "VehicleMedia" ADD CONSTRAINT "VehicleMedia_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleMedia" ADD CONSTRAINT "VehicleMedia_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "VehicleEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiclePart" ADD CONSTRAINT "VehiclePart_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiclePart" ADD CONSTRAINT "VehiclePart_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "VehicleEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleMilestone" ADD CONSTRAINT "VehicleMilestone_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleMilestone" ADD CONSTRAINT "VehicleMilestone_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "VehicleEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleMilestone" ADD CONSTRAINT "VehicleMilestone_partId_fkey" FOREIGN KEY ("partId") REFERENCES "VehiclePart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleChange" ADD CONSTRAINT "VehicleChange_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Bounded storage and database-level value integrity.
ALTER TABLE "VehicleMedia" ADD CONSTRAINT "media_size" CHECK (octet_length("image") + octet_length("thumbnail") <= 2097152 AND "width" BETWEEN 1 AND 1920 AND "height" BETWEEN 1 AND 1920 AND "position" BETWEEN 0 AND 999);
CREATE UNIQUE INDEX "one_vehicle_cover" ON "VehicleMedia" ("vehicleId") WHERE "cover" = true;
ALTER TABLE "VehiclePart" ADD CONSTRAINT "part_numbers" CHECK (("priceCents" IS NULL OR "priceCents" BETWEEN 0 AND 100000000) AND ("mileage" IS NULL OR "mileage" BETWEEN 0 AND 2000000));
ALTER TABLE "VehicleMilestone" ADD CONSTRAINT "milestone_progress" CHECK ("progress" BETWEEN 0 AND 100 AND (("status"='COMPLETED' AND "progress"=100 AND "completedOn" IS NOT NULL) OR ("status" IN ('PLANNED','PREPARING','ACTIVE','PAUSED') AND "progress"<100 AND "completedOn" IS NULL)));

ALTER TABLE "VehicleMedia" ADD COLUMN "partId" TEXT, ADD COLUMN "milestoneId" TEXT;
ALTER TABLE "VehicleMedia" ADD CONSTRAINT "VehicleMedia_partId_fkey" FOREIGN KEY ("partId") REFERENCES "VehiclePart"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VehicleMedia" ADD CONSTRAINT "VehicleMedia_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "VehicleMilestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "VehicleMedia_entryId_idx" ON "VehicleMedia"("entryId");
CREATE INDEX "VehicleMedia_partId_idx" ON "VehicleMedia"("partId");
CREATE INDEX "VehicleMedia_milestoneId_idx" ON "VehicleMedia"("milestoneId");
CREATE INDEX "VehiclePart_entryId_idx" ON "VehiclePart"("entryId");
CREATE INDEX "VehicleMilestone_entryId_idx" ON "VehicleMilestone"("entryId");
CREATE INDEX "VehicleMilestone_partId_idx" ON "VehicleMilestone"("partId");
