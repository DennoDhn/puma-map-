# Verified inventory — 13 November 2026

## Access and source

- Connected GitHub identity: `DennoDhn` (confirmed by authenticated integration).
- Accessible repository: `DennoDhn/puma-map-` (trailing hyphen), public, reported size 0.
- Exact intended repository `DennoDhn/puma-map`: authenticated metadata lookup returned 404.
- Integration exposes repository file/branch/commit/PR operations but no repository-create or visibility-change operation.
- Browser fallback for GitHub repository creation reached the GitHub sign-in screen. No signed-in browser session was available. No credentials were requested in chat.
- Prior VPS address from project history: SSH connection failed with `Network is unreachable`. This does not establish whether the VPS is running or whether its application is healthy.
- `/var/www/puma-map/app` is not present in this execution environment.
- File search for PumaMap/puma-map found no source archive. This is a search result, not proof that no backup exists elsewhere.
- No production code, database, server configuration, DNS, or live deployment was modified.

## Consequences

This tree is a new isolated implementation, **not a migration or repair of the historic deployment**.
Old Next.js, Prisma, next-intl, Redis, PM2 and Nginx versions remain unverified. No assertions
are made about historic registration defects, CSS conflicts or backend vulnerabilities.
The new Leaflet implementation uses native marker-bound popups; the old popup implementation
could not be inspected.

## Import gate

Obtain a source-only export of the VPS application excluding `.env*` (except examples),
private uploads, DB dumps, credentials, `node_modules`, `.next` and backups. Preserve a
separate encrypted complete backup under the operator's control before any migration.
Review old schema, IDs, password hashes and consent semantics before planning a non-destructive
import. Never apply this new baseline migration directly to the existing production database.

## Required one-time user actions

1. Create private `DennoDhn/puma-map` (initialize with a README so a default branch exists),
   and make it accessible to the existing GitHub connection. This is needed for private source sync.
2. For migration, provide the source-only archive or an authorized reachable deployment route.
   Do not paste passwords or private keys into chat.

Local development, tests and documentation do not depend on these two actions.

## Recheck — 14 November 2026, 0.3

Authenticated lookup of DennoDhn/puma-map still returned GitHub 404. This can indicate a
missing repository OR lack of connector access; it is not proof of nonexistence. Enabling
GitHub Pages does not grant API access to a private source repository. No remote was overwritten.
Local starting HEAD c53eb1f was clean; work continues on feat/community-builds.

## Recheck — 14 November 2026, 0.4

Starting working tree was clean at b7e133a3ebe9c9a8014a5321dc242aa36be40077.
Work branch: feat/vehicle-workspace. Authenticated puma-map lookup again returned 404.
puma-map- is confirmed public, size 0, default branch main. No source pushed there. No production
systems or member records accessed. Existing local source and complete history retained.

## 0.5 continuation

See [HANDOFF_05.md](HANDOFF_05.md) for the current revision protocol, snapshot whitelist, retention, private recovery, preservation checks and remaining work. This supersedes earlier statements that journal recovery is absent.

## 0.6 verified source inventory

Base 117440741e39edf3973c9941c9998ac2f79f7b53 restored and verified before edits.
Development branch feat/community-engine. Original historical references retained.
New sources: community.ts, CommunityDiscussion, CommunityDiscovery, NotificationCenter,
community.test.ts, community.spec.ts, test-cold-restore.mjs and additive community migration.
Current whole-product inventory: MASTER_FEATURE_MATRIX.md (488 explicit requirement IDs).
GitHub exact-name recheck: private target returned 404; trailing-hyphen repository public/empty.
No public push, Pages work, production changes or production deployment.
