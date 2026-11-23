import { z } from 'zod';
export const technicalCategory = z.enum([
  'ENGINE',
  'GEARBOX',
  'SUSPENSION',
  'BRAKES',
  'BODY',
  'ELECTRICAL',
  'INTERIOR',
  'EXHAUST',
  'WHEELS',
  'OTHER',
]);
const visibility = z.enum(['PRIVATE', 'PUBLIC']).default('PRIVATE');
const ref = z.string().min(1).max(100).nullable().default(null);
const pastDate = z.iso
  .date()
  .refine((v) => v <= new Date().toISOString().slice(0, 10), 'Datum liegt in der Zukunft.')
  .nullable()
  .default(null);
export const partInput = z
  .object({
    name: z.string().trim().min(2).max(120),
    category: technicalCategory,
    manufacturer: z.string().trim().max(120).default(''),
    partNumber: z.string().trim().max(120).default(''),
    condition: z.enum(['UNKNOWN', 'NEW', 'USED', 'REFURBISHED']).default('UNKNOWN'),
    status: z.enum(['PLANNED', 'ORDERED', 'STORED', 'INSTALLED', 'REMOVED']).default('PLANNED'),
    installedOn: pastDate,
    mileage: z.number().int().min(0).max(2000000).nullable().default(null),
    source: z.string().trim().max(300).default(''),
    priceCents: z.number().int().min(0).max(100000000).nullable().default(null),
    notes: z.string().trim().max(5000).default(''),
    entryId: ref,
    visibility,
  })
  .strict();
export const milestoneInput = z
  .object({
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().max(5000).default(''),
    category: technicalCategory,
    status: z.enum(['PLANNED', 'PREPARING', 'ACTIVE', 'PAUSED', 'COMPLETED']).default('PLANNED'),
    targetOn: z.iso.date().nullable().default(null),
    completedOn: pastDate,
    progress: z.number().int().min(0).max(100).default(0),
    entryId: ref,
    partId: ref,
    visibility,
  })
  .strict()
  .refine(
    (v) =>
      v.status === 'COMPLETED'
        ? v.progress === 100 && v.completedOn !== null
        : v.completedOn === null && v.progress < 100,
    'Abgeschlossene Meilensteine benötigen 100 % und Abschlussdatum; offene bleiben unter 100 %.',
  );
export const mediaInput = z
  .object({
    caption: z.string().trim().max(300),
    visibility,
    cover: z.boolean(),
    position: z.number().int().min(0).max(999),
    entryId: ref,
    partId: ref,
    milestoneId: ref,
  })
  .strict();
