import { z } from 'zod';
export const username = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,24}$/, 'Benutzername: 3–24 Buchstaben, Zahlen oder Unterstriche.');
export const password = z.string().min(12, 'Mindestens 12 Zeichen verwenden.').max(128);
export const registration = z
  .object({
    username,
    email: z
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    password,
    shareRegion: z.boolean().default(false),
    regionId: z.string().max(80).nullable().default(null),
  })
  .strict()
  .refine((v) => !v.shareRegion || !!v.regionId, {
    message: 'Für die Freigabe bitte eine Region wählen.',
  });
export const profile = z
  .object({
    bio: z.string().trim().max(1000),
    regionId: z.string().max(80).nullable(),
    shareRegion: z.boolean(),
  })
  .strict()
  .refine((v) => !v.shareRegion || !!v.regionId, { message: 'Bitte eine Region wählen.' });
export const vehicle = z
  .object({
    name: z.string().trim().min(2).max(80),
    variant: z.string().trim().min(1).max(80),
    year: z.number().int().min(1997).max(2002),
    powerKw: z.number().int().min(1).max(1000).nullable(),
    mileage: z.number().int().min(0).max(2000000).nullable(),
    color: z.string().trim().min(2).max(60),
    description: z.string().trim().max(5000),
    visibility: z.enum(['PRIVATE', 'PUBLIC']),
  })
  .strict();
export const content = z
  .object({
    kind: z.enum(['POST', 'TOPIC', 'LISTING', 'EVENT', 'WIKI', 'BUILD']),
    title: z.string().trim().min(3).max(140),
    body: z.string().trim().min(10).max(15000),
    category: z.string().trim().min(1).max(60),
    priceCents: z.number().int().min(0).max(100000000).nullable().default(null),
    region: z.string().trim().max(100).nullable().default(null),
    startsAt: z.iso.datetime().nullable().default(null),
    location: z.string().trim().max(200).nullable().default(null),
    sourceUrl: z
      .url()
      .refine((v) => v.startsWith('https://'), 'Nur HTTPS-Quellen verwenden.')
      .nullable()
      .default(null),
  })
  .strict()
  .superRefine((v, c) => {
    if (v.kind === 'LISTING' && v.priceCents === null)
      c.addIssue({ code: 'custom', message: 'Preis fehlt.' });
    if (v.kind === 'EVENT' && (!v.startsAt || !v.location || Date.parse(v.startsAt) < Date.now()))
      c.addIssue({
        code: 'custom',
        message: 'Zukünftigen Termin und öffentlichen Treffpunkt angeben.',
      });
    if (v.kind === 'WIKI' && !v.sourceUrl)
      c.addIssue({ code: 'custom', message: 'Eine überprüfbare Quelle ist erforderlich.' });
  });
export const comment = z.object({ body: z.string().trim().min(1).max(3000) }).strict();

export const vehicleEntry = z
  .object({
    keepVersions: z.boolean().default(false),
    kind: z.enum(['BUILD', 'MAINTENANCE', 'REPAIR']),
    category: z
      .enum([
        'ENGINE',
        'GEARBOX',
        'SUSPENSION',
        'BRAKES',
        'BODY',
        'INTERIOR',
        'ELECTRICAL',
        'WHEELS',
        'OTHER',
      ])
      .default('OTHER'),
    progress: z.number().int().min(0).max(100).default(0),
    title: z.string().trim().min(3).max(120),
    body: z.string().trim().min(10).max(10000),
    occurredOn: z.iso
      .date()
      .refine(
        (v) => v <= new Date().toISOString().slice(0, 10),
        'Datum darf nicht in der Zukunft liegen.',
      ),
    mileage: z.number().int().min(0).max(2000000).nullable(),
    costCents: z.number().int().min(0).max(100000000).nullable(),
    visibility: z.enum(['PRIVATE', 'PUBLIC']).default('PRIVATE'),
  })
  .strict();

export const publishBuild = z
  .object({
    title: z.string().trim().min(3).max(120),
    body: z.string().trim().min(10).max(10000),
    confirmPublic: z.literal(true),
  })
  .strict();

export const journalUpdate = vehicleEntry.extend({ expectedRevision: z.number().int().min(1) });
export const journalDelete = z.object({ expectedRevision: z.number().int().min(1) }).strict();
export const journalSnapshot = vehicleEntry.pick({
  kind: true,
  title: true,
  body: true,
  category: true,
  progress: true,
  occurredOn: true,
});
