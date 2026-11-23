import { db } from '../src/lib/db';
// Regional reference points, never residential coordinates. No members or activity are seeded.
const regions = [
  { id: 'bremen-nord', name: 'Bremen-Nord', latitude: 53.18, longitude: 8.62 },
  { id: 'bremen', name: 'Bremen', latitude: 53.08, longitude: 8.8 },
  { id: 'hamburg', name: 'Hamburg', latitude: 53.55, longitude: 10.0 },
  { id: 'hannover', name: 'Hannover', latitude: 52.37, longitude: 9.74 },
  { id: 'berlin', name: 'Berlin', latitude: 52.52, longitude: 13.4 },
  { id: 'ruhrgebiet', name: 'Ruhrgebiet', latitude: 51.46, longitude: 7.01 },
  { id: 'rhein-main', name: 'Rhein-Main', latitude: 50.11, longitude: 8.68 },
  { id: 'muenchen', name: 'München', latitude: 48.14, longitude: 11.58 },
];
for (const region of regions)
  await db.region.upsert({ where: { id: region.id }, create: region, update: region });
await db.$disconnect();
console.log('8 coarse regions installed. No sample accounts or activity created.');
