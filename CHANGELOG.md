# 0.6 — Community Engine

Persistent replies/comment edits, topic subscriptions and moderator lock/pin, scoped notifications and preferences, public discovery, richer profiles, pagination, responsive community surfaces. Additive migration; synthetic PostgreSQL cold-restore drill. Central 488-requirement matrix and prioritized 1.0 acceptance plan. See docs/HANDOFF_06.md and docs/TESTS.md for limits. No production deployment.

# 0.5 — safe journal recovery

Owner-only opt-in content versions, private restoration, revision conflict protection, bounded retention and verified Git/source export. Additive migration; no production deployment. See docs/HANDOFF_05.md and docs/TESTS.md for acceptance limits.

# 0.4.0 — 14 November 2026 (development checkpoint)

- Secure private-by-default vehicle/journal/part/milestone galleries, content-based image validation,
  metadata-free optimized variants, captions, cover/order/replacement/deletion and bounded quotas.
- PostgreSQL transactional media storage and cascading cleanup; visibility checked on every fetch.
- Parts CRUD with owner-only prices/sources, validated same-vehicle links and installation metadata.
- Milestone CRUD with status/progress/date invariants, privacy, images and journal/part links.
- Owner-only field-name change events; no sensitive snapshots or claimed restore function.
- Responsive dossier sections, gallery comparison/lightbox/swipe/fullscreen controls and filters.
- Expanded upload/privacy/concurrency/API tests and additive migration preservation test.
- Browser test now waits for milestone save before reload; alternative Webpack runner investigated.
- No public GitHub push or deployment. Exact verification and remaining limits: docs/TESTS.md.

# Changelog

## 0.3.0 — 2026-11-14 (development)

- Link vehicle journals to explicitly published Community-Builds without copying source notes or costs.
- Apply source/vehicle visibility to details, interactions, searches, feed and saved results.
- Add category/progress, journal search/type filtering, content direct links and vehicle preview panels.
- Extend CI browser matrix to Firefox, Chromium/Android and WebKit/iOS; record actual local runs in TESTS.md.
- Fix verification/reset link consumption during React Strict Mode effect replay.
- Preserve legacy builds and all prior Git history; no production changes.

## 0.2.0 — 2026-11-14 (development, not production)

- Add shareable vehicle dossier routes linked from garage cards.
- Persist vehicle-specific build, maintenance and repair entries with full owner CRUD.
- Keep journal entries private by default and costs owner-only even on public entries.
- Add cursor pagination, strict date/cost validation, relational deletion and journal export.
- Add responsive Onyx dossier styling and editor focus handling.
- Cover privacy transitions, ownership, export, cursor scope and cascades in PostgreSQL tests.
- Extend Playwright dossier cases (execution pending); include feature branches in CI and
  generate Next route types before type checking fresh checkouts.
- No production deployment, VPS migration, private GitHub push or browser acceptance.


## 0.1.0 — 2026-11-13 — isolated development baseline

- Verified GitHub/VPS access limitations; no production changes.
- Added Next.js/TypeScript/Prisma/PostgreSQL foundation with locked dependencies.
- Added versioned schema and region-only seed, auth/session primitives, validation and RBAC.
- Added account, coarse-region profile, garage and initial persisted content workflows.
- Added comments/reactions/saves, event attendance, wiki approval, moderation/audit and notifications.
- Added original Onyx/Lime UI, mobile drawer, reduced motion and Leaflet marker-bound popups.
- Added unit/integration tests, Playwright/axe test definitions and GitHub Actions workflow.
- Corrected development start argument compatibility, privacy export fields, SVG identifier reuse,
  hidden mobile navigation focus behavior and development dependency advisory.
- Documented incomplete scope, blocked browser execution, deployment/restore procedures and milestones.

This is not the final master-spec release, not migrated VPS source and not a puma-map.de deployment.
