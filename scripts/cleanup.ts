import { db } from '../src/lib/db';
const now = new Date();
await db.$transaction([
  db.vehicleEntryVersion.deleteMany({ where: { expiresAt: { lte: now } } }),
  db.session.deleteMany({ where: { expiresAt: { lt: now } } }),
  db.authToken.deleteMany({ where: { expiresAt: { lt: now } } }),
  db.rateBucket.deleteMany({ where: { expiresAt: { lt: now } } }),
  db.user.deleteMany({
    where: { verifiedAt: null, createdAt: { lt: new Date(Date.now() - 7 * 86400000) } },
  }),
]);
await db.$disconnect();
console.log('Expired ephemeral records removed.');
