# PumaMap — The Mk1 Collective

An independent Ford Puma Mk1 community platform in the DriveOnyx-inspired Onyx/Lime visual language.

**Version 0.6 is a tested development checkpoint, not the completed master specification and not
published to puma-map.de.** The historic VPS code was inaccessible. No production data has been imported.

See [0.6 handoff](docs/HANDOFF_06.md), [master completion matrix](docs/MASTER_FEATURE_MATRIX.md) and [release plan to 1.0](docs/ROADMAP_1_0.md). Versions do not represent completion percentages.

## Implemented now

- PostgreSQL-backed accounts: register, verify email, sign in/out, reset password, revoke sessions.
- Profile editing, opt-in coarse regions, account data export and password-confirmed account deletion.
- Private-by-default vehicle records, owner-scoped editing/deletion and public garage.
- Linked vehicle dossiers with persisted build, maintenance and repair journals; owner-only costs, private entries, pagination and export.
- Explicit journal-to-community Build publication, linked content URLs, progress/categories, journal filters and public visibility withdrawal.
- Text content: feed posts, forum topics, marketplace listings, events, wiki drafts and build updates.
- Comments, likes, saved items, event signup/cancellation, listing status.
- Wiki editorial approval, snapshots on edit, content reports, moderator actions and audit records.
- In-app notifications for comments and moderation.
- Dark responsive interface, native dialogs, reduced motion, mobile drawer (no bottom navigation).
- Leaflet region markers with anchored popups and explicit opt-in before external map tiles load.

These are initial workflows, **not complete implementations of every module**. See
[feature matrix](docs/FEATURE_MATRIX.md) and [open work](docs/OPEN_POINTS.md).

## Quick start

Use Node.js 24 LTS and PostgreSQL 18. Copy `.env.example` to `.env`, supply your development
connection and mail configuration. Never commit real environment files.

```sh
npm ci
npm run db:generate
node --env-file=.env node_modules/prisma/build/index.js migrate deploy
node --env-file=.env --import tsx scripts/seed.ts
npm run dev
```

`MAIL_MODE=file` may be used only in development/test: mail is written under ignored `.local/mail`
with owner-only permissions; no mail is sent. Production rejects this mode. Production SMTP
requires TLS. See [setup](docs/SETUP.md).

## Vehicle workspace 0.4

Protected image galleries, parts, milestones and private change events are implemented.
See [storage, privacy and API contract](docs/VEHICLE_WORKSPACE.md) for limits and outstanding work.

## Validation

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm audit --audit-level=moderate
```

Integration tests require an **isolated database with a `_test` suffix** and
`TEST_DATABASE_CONFIRM=isolated`; they erase its test records. Never use production credentials.
Browser tests run with Playwright and axe. Current execution results and limitations are in
[TESTS.md](docs/TESTS.md). A committed CI workflow is not the same as a successful GitHub run.

## Documentation

- [Verified inventory](docs/INVENTORY.md)
- [Architecture](docs/ARCHITECTURE.md) · [Data model](docs/DATA_MODEL.md)
- [Setup](docs/SETUP.md) · [Deployment / rollback](docs/DEPLOYMENT.md)
- [Backup / restore](docs/BACKUP_RESTORE.md)
- [Security](docs/SECURITY.md) · [Design system](docs/DESIGN_SYSTEM.md)
- [Tests](docs/TESTS.md) · [Feature matrix](docs/FEATURE_MATRIX.md)
- [Milestones / open points](docs/OPEN_POINTS.md) · [Changelog](CHANGELOG.md)

All public statistics are database counts. Region reference entries are the only seeded content.
No fake members, sample market listings or unverified technical wiki facts are published.
