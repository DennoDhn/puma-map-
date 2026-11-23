# PumaMap 0.5 — safe journal recovery checkpoint

This is a focused development checkpoint, not completion of the master platform or production approval.
Base: d5f9446110f59e4a22c2dc11aef747ea7a4ea334, all prior Git refs preserved.
Branch: feat/safe-journal-recovery. Exact export HEAD and refs: archive MANIFEST.json.

## Implemented

- Explicit, default-off journal version retention, at most 20 snapshots for 30 days.
- Owner-only version browser and confirmed private restoration, with current costs/mileage preserved.
- Snapshots whitelist title, body, kind, category, date and progress. No price, coordinates,
  media bytes or links. Free text may still contain personal details: opt in deliberately.
- Restoring privatizes the source entry; dependent public Build access is withdrawn.
- Compare-and-set revision checks for edits, deletes, purge and restore. Stale writes return 409;
  the editor retains the local draft. Copy it before closing/reloading the editor.
- Disabling retention immediately purges saved versions. Deleting an entry/account cascades them.
- Recovery dialog with explicit consent, expiry dates, status/error feedback and responsive
  Black-Chrome/Purple styling; reduced-motion respected.
- Additive migration 20261114193000_journal_versions; old rows retain revision 1 and consent off.
- Reproducible source+Git export with mirror restore, git fsck, all-ref comparison, byte-for-byte
  source comparison, per-file hashes and ZIP CRC check: scripts/export-project.py.

## Retention and operation

Run `node --env-file=.env --import tsx scripts/cleanup.ts` hourly via the deployment scheduler.
It now also removes expired snapshots. Reads/restores/export exclude expired versions immediately,
independent of scheduler execution. `scripts/prune-journal-versions.ts` only prunes versions.
The operational scheduler has NOT been deployed. Database backup retention must also expire copies;
application deletion cannot erase a historic backup. Limit encrypted backup retention separately.

PATCH/DELETE /api/vehicles/:vehicle/entries/:entry now require expectedRevision.
GET/DELETE .../versions and POST .../restore are owner-only. Restore requires versionId,
expectedRevision and confirmPrivate:true. Clients must reload current revisions after writes.

## Preserve and resume

From a clean committed checkout: `python3 scripts/export-project.py /absolute/new-checkpoint.zip`.
Never overwrite an old export. Clone history.bundle from the archive into an empty folder;
all branch/tag refs remain in the bundle. source/ is an exact convenience copy of HEAD.
Inspect MANIFEST.json and compare archive SHA-256 with the handover before extracting.
Install with npm ci, generate Prisma, configure isolated development DB and deploy migrations.
Never restore test fixtures into production. No real .env, uploads, database or mail capture
is included in the export. The export preserves source/history, NOT operational user data.

## Still required

- Full browser acceptance remains open; focused Firefox recovery passes desktop/phone/tablet, including axe and overflow. Chromium/WebKit and older long flows remain open.
- Actual PostgreSQL dump/restore drill: database client dump/restore binaries unavailable here.
- Private GitHub repository access; puma-map returned 404, puma-map- remains public, no push made.
- Document vault, multiple Build projects/task lists, advanced parts history/search, wider
  community systems and global design expansion remain outside this focused checkpoint.
- No production release, SMTP acceptance, load test or complete WCAG certification.

Continue with browser findings first, then secure vehicle documents or multiple Build projects.
Do not replace or recreate this repository. Preserve migrations, branches and prior commits.
