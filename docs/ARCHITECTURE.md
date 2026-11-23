# Architecture

## Current implementation

Next.js 16 App Router, React 19, TypeScript strict, Prisma 7, PostgreSQL. All versions are
exactly pinned in package.json and package-lock.json. Node 24 LTS is the runtime baseline.
The old VPS was not available; there is no claim of compatibility with its schema yet.

| Layer               | Location                           | Responsibility                                               |
| ------------------- | ---------------------------------- | ------------------------------------------------------------ |
| App shell           | src/app                            | Metadata, document, CSS, error boundary                      |
| Product interface   | src/components/platform.tsx        | Navigation, forms, data fetching, loading/error/empty states |
| Shared visuals      | src/components/car.tsx, dialog.tsx | Original vector illustration, native modal behavior          |
| Map                 | src/components/community-map.tsx   | Client-only Leaflet, regional grouping, native popups        |
| HTTP adapter        | src/app/api/[...path]/route.ts     | Next route handlers, Node runtime                            |
| Application API     | src/lib/api.ts                     | Auth, ownership, moderation, persisted commands and queries  |
| Input rules         | src/lib/validation.ts              | Strict Zod schemas, unknown-field rejection                  |
| Security primitives | src/lib/security.ts                | Password hashing, random tokens, origin checks, role checks  |
| Persistence         | src/lib/db.ts, prisma              | Prisma client, schema and versioned SQL                      |
| Transactional mail  | src/lib/mail.ts                    | TLS SMTP or local-only development capture                   |

The server is authoritative. UI hiding never grants or denies access. Private vehicle queries
always scope by owner; public queries always filter visibility. Moderation checks execute
before writes. Account deletion uses foreign-key cascades in a transaction.

## Deliberate boundaries

No Redis, PM2, payment SDK, background queues, message system or object storage has been added
without an implemented need. Atomic PostgreSQL rate buckets coordinate across application
processes. Their global limits are a temporary protective baseline, not a completed distributed
abuse-prevention strategy.

Content kinds share common text authoring, comments and moderation. This supplies real initial
workflows, but does not substitute for a complete forum hierarchy, event recurrence, a vehicle
build timeline, or a marketplace messaging system.

Dialog rendering is lazy-loaded separately; navigation definitions, shared UI primitives, client transport and DTO types are separate modules.

The current UI is a state-driven single-page shell. Durable entity URLs, server-rendered public
entity pages, query pagination, route-level bundles, full-text search and next-intl localization
remain explicit work items before broader release. Client and API orchestration should be split
into domain modules as those entity routes are introduced.

## Runtime and deployment

The standalone Next.js output expects a Node process with TCP access to PostgreSQL and SMTP.
It is not a Cloudflare Worker bundle. The available Sites Worker environment cannot run this
Node/PostgreSQL deployment unchanged. No substitute static demo was deployed.

Development preview uses the provided preview daemon; scripts/dev.mjs normalizes its host/port
arguments. A local-only optional bootstrap environment variable is supported for isolated test
infrastructure. No workspace paths, development database credentials or bootstrap code are tracked.

## Dependency decisions

- Next 16.4.6 installed from npm after checking official support/security guidance.
- Prisma 7.10.1 chosen deliberately: official documentation identified Prisma 8 as release-candidate,
  so the implementation does not use an experimental ORM release.
- A scoped minimatch 11.0.1 override addresses GHSA-g3hv-75wg-m249 in the ESLint development tree;
  typecheck and lint are rerun to verify the consumer still works. Remove when upstream resolves it.
- Exact dependencies plus a lockfile make the build reproducible. Dependabot is configured.

Sources checked 2026-11-13: https://nextjs.org/support-policy,
https://github.com/vercel/next.js/security/advisories,
https://www.prisma.io/docs/orm/release-status.

## Vehicle dossier routing

`/fahrzeuge/[id]` renders a dedicated client dossier using the existing no-store session API.
`GET /api/vehicles/:id` supplies public data or owner-authorized private data and canEdit.
`GET/POST /api/vehicles/:id/entries` list/create journal entries; PATCH/DELETE with an entry
ID modify owned entries scoped to the vehicle. Cursor references must be visible within that
same vehicle. API origin, bounded body parsing, rate limiting and strict validation are reused.
Client authorization is presentation only. Server checks remain mandatory. This page currently
uses client data fetching; public SSR metadata and search indexing are intentionally deferred.

## Explicit Community-Build publication (0.3)

A Content may reference one VehicleEntry through a unique optional FK. Legacy BUILD records
remain untouched. Publication is a separate POST to /api/vehicles/:vehicle/entries/:entry/publish
with confirmPublic=true and a separately supplied public title/body. It locks the source entry,
checks owner, BUILD kind and public vehicle/source, and rejects duplicates. Cost and source
body are not copied. Public source entries themselves remain visible in the vehicle dossier.

A shared publicContentWhere predicate filters community lists, searches, feed and saved items
by both source and vehicle visibility. accessContent applies the same source visibility gate,
including for moderators who do not own the source. Owners retain access to their own content.
A visibility withdrawal therefore blocks subsequent reads/interactions without a background job.
Already downloaded content cannot be remotely erased. Republishing vehicle/source restores
access to an existing previously consented publication; this behavior is intentionally documented.
Deletion of a source cascades its community publication, comments and reactions. Direct URLs
/beitraege/:id reuse the platform detail dialog and its existing interaction APIs.

## 0.4 vehicle workspace

The existing catch-all API delegates media/parts/milestones/history to `src/lib/vehicle-workspace.ts`.
Validation is isolated in `workspace-validation.ts`, decoding in `media.ts`, and the dossier embeds
`VehicleWorkspace`. No second app, public media directory, external image host or storage credential
was introduced. See [the complete storage/API/privacy contract](VEHICLE_WORKSPACE.md).

## 0.5 continuation

See [HANDOFF_05.md](HANDOFF_05.md) for the current revision protocol, snapshot whitelist, retention, private recovery, preservation checks and remaining work. This supersedes earlier statements that journal recovery is absent.

## 0.6 Community-Service

src/lib/community.ts zentralisiert Diskussionsaktionen, Präferenzen, öffentliche Sichtbarkeitsfilter
und Benachrichtigungs-Deduplizierung. Content bleibt gemeinsame Datenbasis; keine duplizierten
Forum-/Build-Posts. Schreibaktionen sperren den Content-Datensatz im Transaktionskontext.
Die neuen UI-Komponenten CommunityDiscussion, CommunityDiscovery und NotificationCenter verwenden
reale API-Endpunkte. Öffentliche Profilvorschauen werden durch dieselben Freigabegrenzen beschränkt.
Die Master-Abnahme wird in MASTER_FEATURE_MATRIX.md gepflegt; Versionsnummern sind keine Prozentwerte.
