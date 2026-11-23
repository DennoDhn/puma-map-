# PumaMap 0.4 development checkpoint

Base: b7e133a3ebe9c9a8014a5321dc242aa36be40077 / feat/community-builds.
Work branch: feat/vehicle-workspace. Complete inherited history retained.

This checkpoint implements secure persisted vehicle media, parts, project milestones and
owner-only change events. Storage/UI/API details and explicit limitations are in
VEHICLE_WORKSPACE.md. Exact executed results, including failed browser cases, are in TESTS.md.
This is not the complete master specification, not a production-ready certification and not
published to puma-map.de.

## Notable corrections

- Private linked data never becomes public automatically when a journal, part or milestone
  link is removed: dependent records are privatized transactionally.
- Binary image responses use live visibility checks and no shared optimizer cache.
- A DB partial unique index and serialized updates keep cover selection unique under concurrency.
- Native metadata cleanup plus fresh encoding discards original names and hidden image metadata.
- Journal search control styling now matches the workspace inputs and touch targets.
- Browser milestone persistence test waits for saved confirmation before reload.

## Delivery

A source ZIP plus complete `git bundle --all` is provided because exact private repo puma-map
returns authenticated 404. The similarly named puma-map- remains public and empty and was not used.
Archive excludes local environments, test mail, fixtures, databases, logs/screenshots, dependency
folders, build output and uploaded media. Restore the bundle using START_HIER.md in the archive.

## Next priorities

1. Independent CI execution and diagnose the remaining browser failures without bypassing controls.
2. Image-inclusive backup/restore rehearsal, privacy/concurrency load checks and capacity monitoring.
3. Conflict-safe editing and deliberate private snapshot/restore design.
4. Richer multi-part milestones, relation search for long journals and integrated phase timeline.
5. Community-wide cover/media previews and maintenance planning; retain master-spec backlog.
