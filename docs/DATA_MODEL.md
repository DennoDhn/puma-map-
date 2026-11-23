# Data model

| Entity       | Purpose / privacy                                                                      |
| ------------ | -------------------------------------------------------------------------------------- |
| User         | Private email/password hash, verified status, role; public username/bio; opt-in region |
| Region       | Coarse regional reference points; no user address or GPS storage                       |
| Session      | SHA-256 digest of random 256-bit token; expiry and user FK                             |
| AuthToken    | One-use verification/reset token digest, purpose and expiry                            |
| Vehicle      | Owner FK; private by default; descriptive fields and visibility                        |
| Content      | POST / TOPIC / LISTING / EVENT / WIKI / BUILD and explicit status                      |
| Comment      | Author and content FKs; text only                                                      |
| Reaction     | Composite primary key prevents duplicate LIKE / SAVE rows                              |
| Attendance   | Composite primary key prevents duplicate event registrations                           |
| Revision     | Prior wiki content snapshots on edit                                                   |
| Report       | Private reporter FK and reason, moderation resolution state                            |
| Notification | Private recipient FK; comment/moderation information                                   |
| Audit        | Server-created actor/action/target log; no password or session secrets                 |
| RateBucket   | Hashed scope/window key with atomic count and expiry                                   |

Indices cover owner/visibility queries, content kind/status/creation time, region membership,
notification recipients, pending reports and expiry cleanup. Lists have hard result caps;
true cursor pagination is still required for scale.

Wiki submissions are DRAFT even for moderators. Publishing requires a moderator distinct from
the author. An edit returns the article to DRAFT and records the previous content. Publication
of arbitrary sources is not automatic; editorial review remains a human responsibility.

The initial migration creates a new schema. It does not map historic IDs or copy production
records. Apply it only to an empty, explicitly selected database. PostgreSQL referential
integrity is enabled. No database dump belongs in the source repository.

## Vehicle journal (0.2)

VehicleEntry belongs to Vehicle with ON DELETE CASCADE. Each entry records BUILD,
MAINTENANCE or REPAIR, title/body, calendar date (PostgreSQL DATE), optional mileage and
integer euro-cent cost, visibility and timestamps. Composite index (vehicleId, occurredOn, id)
supports descending keyset pagination (50 entries/page). Owners see all their entries;
other readers require both vehicle and entry to be public. Their SQL projection excludes costs.
Account export nests all owned entries under vehicles. Account/vehicle deletion cascades entries.
The additive migration creates one table; it does not update existing vehicle or user records.
Never apply baseline migrations to the historic production database.

## 0.3 additive migration

VehicleEntry gains category (technical taxonomy) and integer progress 0–100. Content gains
nullable unique vehicleEntryId, FK with cascade deletion. Existing rows default to OTHER/0
and have no publication relation. Public Content projections explicitly select only source ID,
vehicle/name, visibility, category and progress; no journal cost or body is selected.

## 0.4 additive models

Migration `20261114180000_vehicle_workspace` adds VehicleMedia, VehiclePart, VehicleMilestone and
VehicleChange. Existing tables, columns, IDs and migration files are retained. Child relations
have scoped indexes, media has a unique partial cover index and bounded byte sizes/dimensions;
prices/mileage and milestone completion invariants have SQL constraints. Relation ownership is
validated in the service; never expose raw ORM mutation APIs. Full contract: VEHICLE_WORKSPACE.md.

## 0.5 continuation

See [HANDOFF_05.md](HANDOFF_05.md) for the current revision protocol, snapshot whitelist, retention, private recovery, preservation checks and remaining work. This supersedes earlier statements that journal recovery is absent.

## 0.6 Community-Relationen

User besitzt vier private Notification-Flags und Subscription[]; Content besitzt locked/pinned,
Subscription[] und Notification[]. Subscription hat den zusammengesetzten Schlüssel userId/contentId
und löschende Foreign Keys. Comment besitzt parentId (selbstreferenziert), removed und updatedAt.
Soft-Delete leert den Text; Antworten bleiben erhalten. API erlaubt nur Eltern desselben Inhalts
und maximal eine Antwortebene. Notification besitzt optional contentId, kind und eindeutigen eventKey.
Ein Unique Key verhindert doppelte Ereigniszustellung. Bei Inhaltslöschung kaskadieren verknüpfte
Benachrichtigungen/Abonnements. Die additive SQL-Migration erhält alle früheren Datensätze.
