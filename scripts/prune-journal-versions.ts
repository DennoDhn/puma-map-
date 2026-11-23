import { db } from '../src/lib/db';
// Run hourly in the operator's scheduler. No content or identifiers enter the log.
try {
  const result = await db.vehicleEntryVersion.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  });
  console.log(JSON.stringify({ expiredVersionsDeleted: result.count }));
} finally {
  await db.$disconnect();
}
