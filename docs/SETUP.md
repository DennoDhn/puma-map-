# Setup

## Prerequisites

Node.js 24.11+ on the 24 LTS line, npm, PostgreSQL 18 and an SMTP service for real mail.
Production and staging require separate databases, mail senders, environment configuration
and storage. No public registration should be enabled until legal/operator details are complete.

## Local development

1. `npm ci`.
2. Copy `.env.example` to `.env`; set DATABASE_URL, APP_ORIGIN and mail settings.
3. `npm run db:generate`.
4. `node --env-file=.env node_modules/prisma/build/index.js migrate deploy` on a new database.
5. `node --env-file=.env --import tsx scripts/seed.ts` installs only region reference entries.
6. `npm run dev`. Set APP_ORIGIN to the exact browser origin including port; do not wildcard it.

`MAIL_MODE=file` is accepted only outside production. Verification/reset links are saved in
`.local/mail`, never returned by the public API. Directory/file modes restrict them to the
local OS user. The folder is ignored by Git and Docker. This is a test facility, not a mail service.

Use `MAIL_MODE=smtp` in production. Supply SMTP_HOST, SMTP_PORT (587 STARTTLS or 465 TLS),
SMTP_USER/SMTP_PASSWORD if required, and MAIL_FROM. Configure sender-domain SPF/DKIM/DMARC
with the mail provider. Real deliverability has not been tested in this execution.

## First administrator

Register and verify an account normally. An authorized operator may run
`node --env-file=.env --import tsx scripts/promote.ts VERIFIED_EMAIL` on the selected environment.
The command refuses unverified accounts and creates an audit record. There is no default admin
password and no public role-promotion endpoint. A second moderator is needed to approve an
administrator's own wiki submission.

## Routine cleanup

Schedule `scripts/cleanup.ts` through the deployment's trusted scheduler. It removes expired
sessions, auth tokens, rate buckets and unverified accounts older than seven days. Confirm
that retention period in the final privacy policy before public launch.

## Isolated integration tests

Use a dedicated PostgreSQL database ending in `_test`, never the development/live database.
Set DATABASE_URL, APP_ORIGIN, MAIL_MODE=file and TEST_DATABASE_CONFIRM=isolated in the test
process environment. Run migrations, then `npm run test:integration`. Tests truncate only the
explicitly guarded test database. Browser tests use temporary `.example.test` users and delete
them in cleanup. No real recipient is contacted by the tests.
