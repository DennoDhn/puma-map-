# DriveOnyx-inspired PumaMap design system

Direction: black chrome, restrained neon lime, original coupé linework, generous dark surfaces.
PumaMap is the product brand. There are no copied automotive photos or externally licensed hero assets.
The vehicle artwork is an original stylized SVG study, explicitly not a photo of a member's car.

| Token            | Value   | Meaning                               |
| ---------------- | ------- | ------------------------------------- |
| --bg             | #050609 | App background                        |
| --surface        | #0d1118 | Primary panels                        |
| --surface-raised | #141a22 | Raised panels                         |
| --chrome         | #252b34 | Chrome tone                           |
| --text           | #f3f6fa | Main text                             |
| --muted          | #a0a8b5 | Secondary text                        |
| --lime           | #c8ff28 | Primary actions and active navigation |
| --lime-hover     | #dcff7c | Hover/pressed emphasis                |
| --purple         | #a78bfa | Reserved secondary accent             |
| --danger         | #ff8797 | Destructive/error emphasis            |
| --focus          | #d8ff75 | Keyboard focus outline                |
| --border         | #252c36 | Default separators                    |

Buttons: primary lime, secondary chrome, destructive muted red, text and icon variants.
Forms: associated visible labels, native constraints plus server validation, bounded inputs.
Dialogs: native dialog element, focus trapping, Escape/cancel and explicit close control.
Cards: consistent radius/border hierarchies, subtle lift, bounded text and owner/visibility labels.
States: database-backed counts; visible empty/error/loading states. No invented sample activity.

Mobile: collapsible left drawer, no bottom navigation, one-column layouts, 16px form inputs,
safe-area padding, wrap-safe toolbars and minimal motion. Map popups stay attached to markers.

Motion is limited to short transitions and loading skeletons. prefers-reduced-motion disables
animation and transforms. No continuous ambient or achievement animations are introduced.

The stylesheet centralizes key tokens, but complete semantic token coverage, broader component
extraction, touch-target audit and validated WCAG 2.2 AA compliance remain tracked work.

## Vehicle dossier

A split Black-Chrome header presents vehicle identity alongside the existing original coupe
illustration (explicitly labeled as an illustration, not a user photograph). Four semantic
technical values use definition lists. A Lime-accented ordered timeline shows actual saved
records, with distinct private/freely shared labels and private cost labels. At 760px the
header and editor fields stack; actions wrap and safe-area padding is preserved. Shared
focus/button styles remain active. Editor title receives focus after opening. Device and
screenreader acceptance remains pending; no decorative perpetual animation was added.

## 0.3 Build presentation

Technical-category labels and semantic progress elements show persisted user-entered values.
Publication uses a Purple-bordered confirmation panel with a separate public description;
vehicle previews retain Lime highlights. Search/filter controls stack below 760px. Dossier
actions have a 44px minimum height. Hover movement is disabled for reduced motion.
No photo/gallery controls are offered until protected media storage exists.

## Vehicle workspace 0.4

Shared chrome panel and lime-active section navigation, purple milestone indicators, semantic
progress elements, responsive two-column cards and one-column mobile layout. Gallery variants are
server-optimized; hover zoom is disabled for reduced motion. Native dialogs supply focus trapping
and Escape behavior; controls target at least 44px. Use text labels for image actions, statuses and
private fields. Numeric sort positions remain keyboard/touch accessible without drag-only controls.
Side-by-side before/after comparisons stack below 480px. All displayed counts derive from loaded
records; zero states do not fabricate activity.

## 0.5 continuation

See [HANDOFF_05.md](HANDOFF_05.md) for the current revision protocol, snapshot whitelist, retention, private recovery, preservation checks and remaining work. This supersedes earlier statements that journal recovery is absent.

## 0.6 Community-Oberflächen

Black-Chrome-Beitragsflächen, Purple-Rand für Antwortbezüge, Lime-Lesestatus, mehrspaltige Suchkarten,
einspaltige mobile Filter und umbruchfähige Diskussionsaktionen. Suchfelder und Kommentarcomposer
verwenden explizite htmlFor/id-Verbindungen; dynamische Werte verändern die Beschriftungen nicht.
Reduced Motion deaktiviert den zusätzlichen Karten-Hover. Keine Bottom-Navigation eingeführt.
Globale Premium-Abnahme und physische Geräteprüfungen bleiben als eigene Master-Anforderungen offen.
