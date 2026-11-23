# Security and privacy

## Implemented controls

- Strict server-side Zod validation with unknown-key rejection and bounded text/numeric fields.
- JSON-only writes, incremental 64 KiB request-body limit and exact APP_ORIGIN checks.
- Random 256-bit session/reset tokens stored as SHA-256 digests; single-use 30-minute auth tokens.
- Password hashing: scrypt, independent random salt, N=65536, r=8, p=2, maxmem=128 MiB;
  constant-time comparison. Versioned `scrypt-v1` format; at most two concurrent KDFs per Node worker.
- HttpOnly/SameSite=Lax session cookies; production adds Secure and the `__Host-` prefix.
- Password reset invalidates existing sessions. Expired/unverified sessions are refused.
- PostgreSQL atomic rate buckets for registration, login, mail, writes and abuse-sensitive actions.
- Parameterized Prisma queries; raw SQL in the production app is limited to a constant health query.
- Text is rendered as React text nodes, not HTML. Map popup labels use textContent, never user HTML.
- Server-side owner checks, moderator checks, wiki four-eyes approval and audited moderation writes.
- Email/password hashes are excluded from public member queries. Vehicles default to private.
- Public map points come from region reference records; exact addresses/GPS are not collected.
- Region consent can be withdrawn; the API then denies member-map queries. Background map tiles
  load only after an explicit visitor choice. No analytics or tracking SDK is installed.
- Account export excludes password/session/token secrets. Account deletion cascades related rows.
- Generic server errors use an incident reference and avoid logging full request bodies or secrets.
- Baseline CSP, frame denial, content-type protection, referrer and permissions policies.

## Remaining release blockers / threat review

This is not a penetration-tested or legally certified service. In particular:

1. Add per-client edge throttling with a verified trusted-proxy setup, measured capacity/resource
   budgets, account-abuse protection and mail queue/retry observability. Global rate limits alone
   allow availability attacks. Registration/verification timing can reveal account existence.
2. Upgrade CSP from inline-script allowance to nonce/hash-based policy; validate production CSP
   against all Next runtime scripts. Configure HTTPS/HSTS at the final ingress.
3. Independently review token races, session duration/re-authentication and admin operations;
   introduce MFA for administrators before broad public launch.
4. Establish backup retention, consent/legal text versions, audit retention, deletion replay after
   restore, breach response and operator/processor agreements. Audit reason text may contain
   personal information and needs a documented retention/redaction policy.
5. Verify delivery and sender setup for real SMTP. Local file capture is never production email.
6. Uploads remain absent until MIME/signature validation, size quotas, re-encoding/EXIF stripping,
   object ACLs, moderation and removal are implemented. No upload endpoint is exposed prematurely.
7. No payment, balance, withdrawal or purchasable benefit code exists. Onyx Points are not implemented.
8. Run automated E2E/accessibility tests in a permitted browser environment and complete manual
   mobile, screen-reader and independent security testing.

The implementation's initial migration and development tooling must not be run against the
historic production database. The `.env.example` contains placeholders only.

## 0.3 linked publication boundaries

Publishing requires explicit confirmation, ownership, a BUILD source and public vehicle/source.
Public text is separately submitted; source costs and notes are not copied into Content. The
public source itself remains readable in its dossier, explicitly explained in the form. Source
privacy overrides moderation privileges for linked content reads. Public lists and saved
results apply the same relational privacy predicate as details and interactions.

Changing visibility blocks subsequent API access; it cannot recall screenshots, downloads or
already-rendered client content. There is no secure upload endpoint in this checkpoint, and
no UI implying that uploads are supported. Race/load testing remains a release gate.

## 0.4 media and project data

Content-sniffed, decoded and re-encoded JPEG/PNG/WebP replaces original bytes; SVG/animated and
oversized inputs are rejected. Private media is returned exclusively through current-ACL checked
API requests, never a static public URL or optimizer cache. DB transactions eliminate cross-store
orphan windows. File buffers and filenames do not enter logs or audit events. Prices/sources are
owner-select-only. Linked private records also gate media access. See VEHICLE_WORKSPACE.md for
limits, residual downloaded-copy risk, backend storage tradeoffs and test coverage.

## 0.5 continuation

See [HANDOFF_05.md](HANDOFF_05.md) for the current revision protocol, snapshot whitelist, retention, private recovery, preservation checks and remaining work. This supersedes earlier statements that journal recovery is absent.

## 0.6 Nachweise und Grenzen

Community-Negativtests prüfen fremde Kommentar-/Notice-IDs, Cross-Content-Eltern, Moderatorrechte,
geschlossene Themen, manipulierbare Einstellungen und Privacy-Widerruf über Suche/Profil/Notifications.
Neue Notices enthalten keinen kopierten privaten Quelltext. Reaktions-Ereignisse werden pro Akteur/
Inhalt nur einmal gespeichert. Soft-Delete entfernt Kommentartext, behält aber Autoren-/Zeitmetadaten
für die Diskussionsstruktur. Vollständige Lösch-/Aufbewahrungsregeln bleiben vor Produktion zu prüfen.
API-/Datenbanktests sind keine unabhängige OWASP- oder Penetrationsprüfung.
