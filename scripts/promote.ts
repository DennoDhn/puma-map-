import { db } from '../src/lib/db';
const email = process.argv[2];
if (!email) throw new Error('Provide the verified administrator email as the single argument.');
const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
if (!user?.verifiedAt) throw new Error('Account must exist and have verified its email.');
await db.$transaction([
  db.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } }),
  db.audit.create({ data: { actorId: 'operator-cli', action: 'GRANT_ADMIN', targetId: user.id } }),
]);
await db.$disconnect();
console.log('Administrator role granted and audited.');
