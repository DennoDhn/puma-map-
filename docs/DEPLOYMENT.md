# Deployment and rollback

## Status

Production deployment has **not** occurred. Docker configuration is supplied but no Docker
build was executed here. A private GitHub destination, reachable Node/PostgreSQL host, real
SMTP service, legal documents and completed release QA remain prerequisites.

## Source strategy

Private `main` is the accepted baseline. Use `work/<milestone>` branches and pull requests.
CI must pass before merge. Preserve reviewed release tags and record the exact deployed commit.
Never push real `.env` files, private uploads, database dumps or local mail captures.

## Staging procedure

1. Provision a new isolated PostgreSQL database and restricted application DB role.
2. Install locked dependencies with `npm ci`; generate Prisma and run all checks.
3. Apply migrations to staging only. The current initial schema is NOT an in-place VPS upgrade.
4. Seed the coarse region reference table; do not seed users or published activity.
5. Build with `npm run build`; deploy standalone server and static files, or build the Dockerfile.
6. Inject secrets at runtime. Set NODE_ENV=production, HTTPS APP_ORIGIN, DATABASE_URL and SMTP.
7. Terminate HTTPS at the reverse proxy; deny direct public access to PostgreSQL. Set body/connection
   limits and trusted forwarding policy. Do not trust arbitrary X-Forwarded-For from visitors.
8. `GET /api/health` must return 200 with database access. Run real registration/email/login and
   data-ownership smoke tests using staging accounts. Verify Secure/HttpOnly cookies over HTTPS.
9. Check mobile devices, keyboard access, mail failure handling, backups, restoration and alerts.
10. After all release gates and explicit approval for any risky production migration, switch traffic.

## Rollback

Keep the previous build and configuration available. For a code-only release with compatible
schema, switch traffic back and verify health/login. For database changes, use an expand/contract
migration strategy: add compatible fields first, deploy readers/writers, backfill in bounded
batches, then remove obsolete fields only in a later separately approved release.

Do not automatically run destructive down migrations. If restoration is required, restore a
verified encrypted backup into a new database, validate it, and switch the database connection.
A backup restore can lose newer writes; decide the recovery point explicitly with the operator.

No domain/DNS, VPS service, PM2 process or Nginx configuration was changed by this work.

## 0.6 rollout considerations

Apply the additive community migration before serving the new application. Existing rows receive
unlocked/unpinned defaults, enabled comment/reply/subscription notices and disabled reaction notices.
No historical comment notices are backfilled. NotificationCenter needs the new preferences endpoint.
Subscription fan-out is synchronous and bounded to 500; larger deployments require a queue and load tests.
Keep index creation timing under review for a large existing table. This has only been applied to isolated
synthetic databases, not the historical VPS. Follow ROADMAP_1_0.md before any approved production release.
