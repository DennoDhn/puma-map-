# Virtual Garage Studio — implementation status

## Implemented (prototype)
- New sidebar screen **Virtual Garage Studio** and prominent link inside vehicle garage.
- Responsive NOIR Signature editor for paint presets/custom HEX, glossy/metallic/matte finish, wheel finish and illustrative wheel size, lowering and window tint.
- Responsive stylized vector vehicle study, **not an accurate Ford Puma 3D model**.
- Device-local drafts, maximum 12, stored in `localStorage`, with load/delete.
- Device-local current edit auto-save, plus JSON export for backup.
- No backend writes, account synchronization, public publishing, model CDN or new runtime dependency.

## Constraints
- Local drafts are not encrypted, account backed or cross-device synchronized. Treat as visual preferences only; do not store personal data.
- Color selection approximates car body tones and cannot verify OEM paint code.
- Wheel dimensions/ride height are visual-only, not accurate engineering measurements or road approval.
- Current vector artwork is custom and repository-owned; no third-party 3D asset is embedded.
- Model acquisition requires validating source, attribution, derivative licensing, geometry, texture quality, and redistribution rights.
- Real-time 360°, replacement parts, physically based materials, user uploads and persistent user-associated models are **not implemented**.

## Next technical milestone
1. Source a legally usable Ford Puma Mk1 mesh in GLB/glTF or convert a licensed mesh.
2. Audit mesh hierarchy (body / glass / wheels / lights), textures and triangle count.
3. Create a properly lazy-loaded WebGL viewer with touch orbit, constrained camera and fallback.
4. Bind garage settings to named materials/meshes without changing server-owned vehicle records.
5. Introduce authenticated owner-scoped persisted configurations with authorization, quota, versioned schema, and export/delete.
6. Validate mobile Safari, actual tablets and low-power devices, keyboard support and reduced motion.

## Manual acceptance
- Open from sidebar and from Garage, then navigate back.
- Change all controls and verify illustration responds.
- Save/load/delete drafts, refresh, verify device-local state.
- Try restricted localStorage mode and confirm core editing remains available.
- Export JSON and check valid payload.
- Test narrow screens and modal/auth/session behavior.
- Check CI and preview build before merging or publishing.
