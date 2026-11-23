# PumaMap NOIR Signature — Premium Automotive Design System

Status: **Design implementation in development branch**, not production certified.
This builds on DriveOnyx, but positions PumaMap with its own refined visual language.

## Brand hierarchy

- **Onyx Black** `#050609`: cinematic background, never pure black text-on-black.
- **Onyx Navy** `#0A0F1A`: navigation, overlays and deep panels.
- **Carbon Graphite** `#141820`: content surfaces, contrast between layers.
- **Black Chrome** `#252B34`: hairlines, borders and functional chrome.
- **Neon Lime** `#C8FF28`: primary calls to action, active selection, core brand identity.
- **Electric Purple** `#8B5CF6`: projects, builds, technical dossiers, secondary highlights.
- **Neon Magenta** `#FF2DAA`: social highlights, community discoveries and carefully restrained focal accents.
- **Ice White** `#F3F6FA`: primary copy.
- **Steel Grey** `#929BAA`: secondary hierarchy; use lighter tones where small text needs contrast.

## Visual principles

1. Premium automotive editorial tone: spacious, bold, confident; avoid glowing every UI surface.
2. Dramatic hero composition with original in-repository vehicle illustration, not unlicensed imagery or a fabricated owner vehicle.
3. Neon is directional and purposeful, not a permanent multicolor rainbow. Lime remains dominant.
4. Lighting and reflections are CSS gradients where practical, and progressively enhanced without costly dependencies.
5. Fluid typography and layout across mobile, tablet and desktop; no device-specific hardcoded breakage.
6. Interfaces must remain functional using keyboard, touch, reduced-motion and forced-colors modes.
7. Reserve 3D for genuine interactive vehicle experiences with supported/licensed model assets and fallback images. Do not imply the current SVG is a real 3D model.
8. API stats and activity remain factual and backend-sourced; empty states remain empty.

## Implementation

- `src/app/globals.css`: legacy functional layout and foundational styling.
- `src/app/driveonyx-2.css`: upgraded cinematic/responsive foundation.
- `src/app/noir-signature.css`: luxury identity, Black Chrome surfaces and Lime/Purple/Magenta color hierarchy.
- `src/app/layout.tsx`: Next.js imports in cascade order.
- `preview/main.tsx`: same cascade for static GitHub Pages preview.
- `npm run build:preview`: rebuilds the generated `index.html`; simply importing preview styles does **not** update an already committed index.

## Acceptance gates before main

- `npm ci && npm run check && npm run build && npm run build:preview`
- CI: unit, integration, migration, browser tests in GitHub Actions.
- Visual review: 375px, 390px, 768px, 1024px, 1440px; Safari iOS/iPadOS.
- Validate menu, login, dialog stacking, map, profile, feed, workshop, and long translations.
- Keyboard focus contrast and controls >=44px where actionable.
- Reduced motion and forced colors inspection.
- Confirm generated static preview and runtime UI have matching visual treatment.
- Do not label 3D, full AA conformance or production deployment as finished before verification.

## Future 3D vehicle experience

Ship opt-in, lazy-loaded React Three Fiber or Three.js only after permission to use accurate vehicle assets is secured. Add drag rotation, keyboard alternative, low-power reduction and still fallback. Product workflow and accessibility take precedence over decorative animation.
