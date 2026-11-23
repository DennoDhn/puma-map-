# Aktueller Prüfstand · 23. November 2026

- Entwicklungszweig `feat/community-engine`, Basis `54d22fc`. ESLint und alle 15 Unit-/Medientests bestanden. Der Produktionsbuild einschließlich TypeScript wurde lokal erstellt.
- Frische isolierte PostgreSQL-Datenbank mit sechs Migrationen. Die zweite Anwendung hatte keine ausstehenden Migrationen. Der Node-Testläufer meldete 25 Integrationseinträge (einschließlich Elternsuite), acht Community-Einträge (einschließlich Elternsuite) und einen Migrationstest bestanden.
- Der neue Integrationstest legt 51 gespeicherte Beiträge und 51 Benachrichtigungen an, liest drei Seiten und prüft ein getrenntes Konto. Aufrufe ohne Seitenparameter liefern weiter das bisherige Array.
- Firefox: beide Community-Browserabläufe auf Desktop-, Telefon- und Tablet-Viewport bestanden (6/6). Darunter Benachrichtigungseinstellungen nach dem Neuladen und Forenmoderation. Es wurden simulierte Ansichten verwendet. Eine Browserprüfung der 51-Einträge-Navigation ist noch offen.
- System-Chromium brach im aktuellen Versuch beim Start vor der ersten Interaktion mit einem Socketfehler ab. WebKit, echte Geräte, GitHub Actions und VPS-Betrieb sind für diesen Stand offen.

## Historisch: Verification — PumaMap 0.4, 14 November 2026

This records executed checks, not a claim of full product acceptance or a deployed release.
All mutation tests used isolated synthetic databases and `.test` addresses. No production data
or real transactional email was used. Native browser logs/images stay outside the source archive.

## Final source checks

| Check | Result |
| --- | --- |
| Next route type generation + TypeScript | Passed |
| ESLint | Passed |
| Unit tests | 15 passed, 0 failed |
| PostgreSQL-backed API suite | 23 subtests passed + parent (24 Node test entries), 0 failed |
| Additive migration preservation/constraints | 1 passed |
| Fresh DB migration | All 4 migrations applied |
| Repeated migration deploy | Passed, no pending migration |
| Production build | Passed; not deployed |
| Dependency audit | 0 reported vulnerabilities (all severities) |
| Source path safety guard | Passed after staging; not a comprehensive secret scanner |

Unit coverage includes real image decoding, metadata stripping, dimensions/thumbnail generation,
SVG/executable/corrupt-image rejection, streamed oversized upload rejection, decoded pixel limit,
JPEG/PNG/WebP signatures, private defaults and milestone completion invariants.

API/DB coverage includes prior auth/consent/build tests plus persisted binary reads, raw upload
ownership, private image/list denial, withdrawal through vehicle and journal privacy, source
price/source redaction, foreign record IDs, linked part/milestone media privacy, cascade deletion,
privatization on detach, unique cover under concurrent writes, image quota, read-only owner audit
and own-data export. A separate schema upgrade test creates old records, applies the additive
migration, verifies preservation and SQL constraints, then removes only its isolated test schema.

## Browser results — keep runs separate

1. Initial 0.4 launch could not find the earlier Firefox executable. After explicit installation,
   Firefox and WebKit downloaded; Chromium's download repeatedly returned an invalid/truncated ZIP.
2. Turbopack run: 9 Firefox cases, **3 passed / 6 failed**. Homepage/keyboard/axe/overflow passed
   at desktop, phone and tablet widths. The new workflow test reloaded before awaiting milestone
   save; corrected test now waits for the rendered saved record and modal closure. Older long
   flow still showed Firefox/Juggler errors.
3. Alternative Webpack run (`PUMAMAP_DEV_WEBPACK=1`): 9 cases, **5 passed / 4 failed**.
   Homepage checks passed in all three widths. New media/parts/milestone workflow passed desktop
   and phone; tablet crashed during browser evaluation. Older long flow failed in all three
   widths (navigation/locator timeout and target-crash symptoms).
4. Final focused run after cover-header and form-style updates: **2 passed / 1 failed**.
   Desktop and phone complete the new workflow including upload, caption/cover, part price,
   milestone, reload persistence, axe WCAG tags, no horizontal overflow, enlarged gallery,
   Escape and anonymous private-vehicle denial. Tablet timed out at cover checkbox after an
   unexpected navigation. This remains an unresolved failure, not a passing tablet acceptance.

These are three test cases across viewport projects, not six separate fully tested browser
engines. Repeated successes must not be added together as independent feature coverage.

The native Firefox diagnostics include destroyed FormHandler actors, Juggler execution-context
errors / SimpleChannel redeclaration and target crashes. Switching bundlers and disabling traces
has NOT established a single root cause or eliminated the instability. Some test timing defects
were fixed; remaining navigation/long-flow failures must be reproduced on an independent runner.
Do not label them all conclusively as environment-only application-independent defects.

## Chromium / WebKit / manual alternative

A native system Chromium attempt aborts before tests with:
`process_singleton_posix.cc:297 ... socket() failed: Operation not permitted (1)`.
No sandbox/network restriction was bypassed. The separate WebKit attempt fails at launch for
missing `libgtk-4`, `libgraphene-1.0`, `libharfbuzz-icu`, `libmanette-0.2`, `libhyphen`, `libGLESv2`.
Both smoke attempts failed; neither is accepted. A prior dependency install attempt failed at
`su`; no credentials/escalation were used.

Supported Cloud Chrome additionally displayed the real local homepage, garage empty state,
public navigation and logged-out map gate successfully. This was a bounded manual UI check,
not the native Playwright suite and not authenticated Chromium or mobile acceptance. No user
credentials were requested for a test-only workflow. Desktop/phone dossier screenshots were
inspected internally; no screenshots or private fixture artifacts are included in the deliverable.

## Reproduce

```
npm ci
npm run db:generate
npm run typecheck
npm run lint
npm test
# Only with isolated DATABASE_URL ending _test and TEST_DATABASE_CONFIRM=isolated:
npm run db:migrate
npm run db:migrate
npm run test:integration
npm run test:migrations
npm run build
npm audit --audit-level=moderate
npx playwright install --with-deps chromium firefox webkit
npm run test:e2e
```

E2E new workflow requires TEST_DATABASE_CONFIRM=isolated, database suffix `_test` or `_preview`,
and uses disposable fixtures. Production SMTP is never a test target. CI defines all six projects:
desktop/Android Chromium, desktop/phone/tablet Firefox, iPhone-viewport WebKit. Workflow is prepared
but **not executed on GitHub** because the private repository remains inaccessible. For local
restricted-runner troubleshooting, scripts/dev.mjs supports optional PUMAMAP_DEV_WEBPACK=1.
It does not change production bundling or security controls.

## Still unverified

Real devices/touch/fullscreen, complete registration-to-build browser path, tablet stability,
all metadata editing/deletion combinations through UI, media quota under multi-worker load,
malformed-image fuzzing, full image-inclusive restore, performance/Core Web Vitals, real SMTP,
independent penetration testing and production operation. No production release approval claimed.

## 0.5 executed verification — 15 November 2026

- TypeScript and ESLint passed after recovery implementation and test additions.
- 15 unit/media tests passed; production build passed.
- PostgreSQL suite: 24 subtests plus parent (runner reports 25 passed), zero failures.
  Includes recovery consent, owner/moderator denial, field whitelist, current price preservation,
  source Build withdrawal, stale delete, simultaneous edits (one succeeds, one 409), purge,
  no retroactive snapshots, 20-version cap, expiry filtering and restore denial.
- Five migrations applied to an isolated fresh PostgreSQL instance, second deploy had no pending
  migration. Separate upgrade-preservation test passed, retaining prior records and default-off consent.
- Firefox recovery E2E: 3 passed (desktop 1280 viewport, phone 390×844, tablet 820×1180).
  Each checks explicit confirmation, private restore, persistent reload, price preservation,
  no horizontal overflow and axe accessibility scan with no reported violations.
  These are browser emulations, not physical iPhone/Android acceptance or full WCAG certification.
- Initial Firefox attempt: three launch failures, executable missing. Reinstallation recovered
  Firefox via the alternate official download mirror; subsequent focused tests above passed.
- Chromium smoke: launch failed (socket Operation not permitted / SIGABRT). WebKit smoke:
  launch blocked by missing libgtk-4, graphene, harfbuzz-icu, manette, hyphen and GLESv2.
  Neither is counted as passed. Existing long workflows were not rerun in this checkpoint.
- Dependency audit: 0 reported vulnerabilities. No major dependency upgrades.
- Baseline archive verified against all 88 source files and all eight branch/tag refs;
  bundle mirror restoration and refs matched the supplied 0.4 checkpoint.
- Final export tooling independently checks all exported source bytes and all refs after mirror
  restore and git fsck; successful invocation and SHA-256 are delivered with the final archive.
- Actual PostgreSQL dump/restore, load/performance tests and remote GitHub Actions remain open.
  Local source restoration must not be confused with operational database backup verification.

Browser fixture tests deliberately create only isolated synthetic accounts and delete them.
No real credentials, user media or runtime logs are part of the source export.

## 23. November 2026 – GitHub-Pages-Vorschau und Community-Erweiterungen

Die Pages-Version rendert die öffentlichen React-Ansichten mit einem separaten, schreibgeschützten Datenadapter. Der Abruf der veröffentlichten Startseite antwortete mit HTTP 200. Die Navigation von der Startseite zum Forum lief in Firefox bei 390 und 1440 Pixeln Breite.

Für die Serveranwendung bestanden Typprüfung, ESLint, 15 Unit-/Medientests, der Produktionsbuild sowie die PostgreSQL-Prüfungen (25 API-, 11 Community- und ein Migrationstest laut Node-Testreporter, einschließlich übergeordneter Testgruppen). Acht Migrationen wurden in einer isolierten Datenbank angewendet und erneut aufgerufen. Die neuen Prüfungen decken Kommentarmeldungen, Moderationsrechte, Erwähnungen und die Auswahl veröffentlichter Startseiteninhalte ab.

Der Produktionsbuild lieferte Manifest und beide PNG-Icons. Firefox übernahm den Service Worker. Nach Stoppen des Servers erschien bei Aufruf einer Fahrzeugroute die öffentliche Offline-Seite; Cache Storage blieb leer. Die Installation auf physischen iOS- und Android-Geräten steht aus.

Der vollständige Firefox-Durchlauf auf drei simulierten Bildschirmgrößen ergab 14 von 18 bestandenen Abläufen. Registrierungs-/Exportablauf (drei Größen) und Fahrzeugverwaltung (Desktop) meldeten Browserabbrüche. Der Browserlauf ist keine vollständige Geräteabnahme.
