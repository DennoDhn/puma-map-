# PumaMap 0.3 development checkpoint

Base: c53eb1f. Branch: feat/community-builds. Not deployed or production-approved.

## Implemented

- Explicit journal-to-Community-Build publication with a unique source relation.
- Separately authored public title/body and explicit confirmation. Source and vehicle must be
  public; costs are never copied or exposed. Public source text is still visible in the dossier.
- Central visibility gates for details, comments/reactions, search, feed and saved lists.
- Category/progress, history search/type filters, linked vehicle previews and content direct URLs.
- Profile vehicle links; legacy content preserved unchanged by the additive migration.
- Fix verification/reset URL consumption under React Strict Mode.
- Firefox desktop/phone/tablet and Chromium/Android/WebKit-iOS CI definitions.

## Database

Migration 20261114120000_community_builds adds category/progress on VehicleEntry and a nullable
unique Content.vehicleEntryId with cascade deletion. No old content is auto-published or linked.
Never deploy this initial migration chain into a historic production database without import review.

## Explicit omissions

No upload/gallery capability, attachments, parts inventory, subcategories, edit revisions,
project milestones, reminders, rankings or vehicle comparison in this checkpoint. No claim of
complete master-specification acceptance. Progress is owner-entered, not automatically inferred.

## Validation and continuation

Final Firefox result: 3 bounded homepage cases passed, 3 full workflow cases failed with browser crashes.
19 API/database subtests and 8 unit tests passed. See TESTS.md for executed results and exact browser limitations. See OPEN_POINTS.md for remaining
acceptance work. The private repository lookup still returns 404. A 404 does not prove absence;
connector authorization must cover DennoDhn/puma-map. GitHub Pages settings do not grant that access.
