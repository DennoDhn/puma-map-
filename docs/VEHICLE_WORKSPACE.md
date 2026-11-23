# Vehicle workspace — 0.4 engineering contract

This is a development checkpoint. Production acceptance and all master-specification modules
are NOT complete. All new data lives in PostgreSQL; no simulated persistence is used.

## Storage and privacy

`VehicleMedia` stores two fresh WebP encodings (full and thumbnail), dimensions, caption,
position, cover, visibility and optional journal/part/milestone links. No original upload,
filename, EXIF, GPS, XMP or camera metadata is retained. Caption content remains the owner's
responsibility; metadata stripping cannot remove text visible inside a photograph.

The initial storage adapter is **PostgreSQL bytea**, not S3. This deliberately keeps file bytes,
metadata and cascading deletion in the same transactional store. A decoder or DB failure has
no filesystem orphan to clean up. Account/vehicle deletion removes media; deleting a journal
entry removes its directly attached pictures. Deleting a part or milestone detaches and
privatizes dependent media. Media indirectly dependent on a deleted private journal is also
privatized. Backups must include these tables and need capacity monitoring. Migration to an
object store, signed URLs and asynchronous cleanup are future work, not configured features.

Limits: 6 MiB input, 24 million decoded pixels, single-frame JPEG/PNG/WebP only, max 1920×1920
full image and 640×640 thumbnail, combined stored output max 2 MiB. Up to 24 pictures/vehicle,
240/account, 30 upload/replacement attempts per 15-minute window and two active decoder jobs
per Node worker. Over-capacity returns an error, not an unbounded queue. Images are decoded
and freshly encoded by pinned `sharp`; claimed MIME and extension are not trusted.

New pictures, parts and milestones default PRIVATE. Every binary fetch repeats the effective
visibility predicate, including the vehicle and ALL linked journal/part/milestone records.
Owners can read their own private media; moderators have no blanket access. Image responses
use `private, no-store`, `nosniff`, `image/webp` and same-origin resource policy. They bypass
Next's public image optimizer intentionally. Responsive variants are already generated at upload.
Opaque IDs are not an authorization mechanism. Any already downloaded or rendered copy cannot
be recalled after permission withdrawal.

## Parts and project data

`VehiclePart`: category, user-supplied name/manufacturer/part number, condition, installation
status/date/mileage, source, optional cents price, notes, visibility, optional journal relation.
Price and source are omitted from non-owner SQL selects, not merely hidden by CSS. No parts
compatibility or correctness claims are generated. Maximum 200 parts/vehicle.

`VehicleMilestone`: title, description, category, project status, target/completion dates,
progress, visibility, optional journal and one optional part relation. Maximum 100/vehicle.
Completed requires 100% and a nonfuture completion date; all other statuses require less than
100% and no completion date. Target dates can be future. Media supports multiple attachments
to these records through the gallery editor.

All linked IDs are checked against the same vehicle on the server. Writes serialize on user
and vehicle rows for concurrent quota and cover enforcement. A partial unique index additionally
ensures one cover per vehicle. Non-owner reads require public dependencies. Removing a private
link never silently republishes previously hidden dependent records.

## Change events

`VehicleChange` records creation, edits and deletion for new media, parts, milestones and journal
records; vehicle field edits are also recorded. It stores actor, entity ID/type, timestamp and
changed field names. It intentionally stores no old/new text, costs or image bytes. Unchanged
updates do not create field-change events. Historical changes before 0.4 are not reconstructed.
The owner-only API is read-only and paginated (50 + cursor). Events cascade with vehicle/account
deletion. It is not a tamper-proof compliance ledger. Snapshot versioning/restore is deliberately
not implemented: that requires separate retention, consent and conflict-resolution design.

## HTTP routes (under /api/vehicles/:vehicleId)

| Route | Methods | Contract |
| --- | --- | --- |
| media | GET, POST | Visible metadata list; POST raw image bytes creates private media |
| media/:id | POST, PATCH, DELETE | Replace image; update full metadata; remove media |
| media/:id/file?size=thumb | GET | Protected WebP; omit size for full image |
| parts | GET, POST | Visible records; validated owner creation |
| parts/:id | PATCH, DELETE | Full validated record update; owner deletion |
| milestones | GET, POST | Visible records; validated owner creation |
| milestones/:id | PATCH, DELETE | Full validated record update; owner deletion |
| changes?cursor=:id | GET | Owner-only change events and nextCursor |

All write paths retain the existing same-origin check, authenticated verified session, persistent
rate limits and error envelope. Metadata PATCH is a full form submission, not an arbitrary
Prisma partial object. Unknown fields are rejected. Bodies for metadata remain capped at 64 KiB.
Images use a separate bounded streaming reader. Unsupported paths cannot bypass ownership.
Account export includes own media metadata, parts, milestones and events, but not binary blobs;
full optimized images are available through the same protected gallery URLs. There is no ZIP
media export yet. Original uploads cannot be exported because they are not retained.

## UI and remaining limits

Vehicle dossier contains responsive gallery/parts/milestones/history sections; gallery editing,
cover/reordering by numeric position, replacement/removal, full-size dialog, arrow controls,
swipe navigation and optional browser fullscreen. A two-image comparison is user-selected and
side-by-side (stacked on small screens); not a draggable overlay. Parts/milestones can be searched
and filtered locally within their bounded persisted lists. Their pictures open the same viewer.

Journal relation selection is explicitly limited to currently loaded dossier entries, with an
option to preserve an existing off-page link. An older unloaded anchor may require loading more
journal entries. Dedicated relation search, multi-part milestones, global project-phase timeline,
notifications/reminders, comparison alignment, optimistic conflict resolution and restore remain
open. Cover appears in the dossier header and gallery, not yet in every community preview card.

Browser/mobile evidence is in TESTS.md. No real iPhone/Android acceptance or production capacity
claim follows from desktop Firefox viewport emulation or API tests.
