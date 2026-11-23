<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## PumaMap continuity rules

- Read README.md, docs/INVENTORY.md, docs/FEATURE_MATRIX.md and docs/OPEN_POINTS.md before continuing.
- This is a new development baseline; never claim it is imported VPS code or a production release.
- Preserve private-by-default vehicles, explicit region consent and server-side ownership/RBAC.
- Never run test truncation or the initial migration against a live/historic database.
- Never commit .env files, private mail captures, database dumps, credentials or user uploads.
- The user confirmed DennoDhn/puma-map- as the development repository on 23 November 2026. It is public. Publish reviewed source only; runtime secrets and user data stay outside Git.
- Keep honest feature states. A workflow definition is not a passing CI run; a build is not deployment.
- Use focused changes and re-run meaningful affected checks. Browser launch restrictions must be
  reported rather than bypassed or represented as passing tests.
