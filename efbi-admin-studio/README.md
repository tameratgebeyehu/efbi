# EFBI Admin Studio

A private, localhost-only operations interface for the Ethiopian Future Builders Initiative.

## Run locally

```powershell
npm install
npm run dev
```

Open `http://127.0.0.1:5174/`.

The app reads the ignored Firebase environment files in `../academy-v2`. Access requires both a verified Firebase email and the `admin: true` custom claim. Authentication is saved only for the browser session.

## Checks

```powershell
npm run build
npm run lint
```

## Non-negotiable boundary

Do not deploy this directory. Do not expose its development port to the internet. Do not add an `/admin` route to the student app. Do not place service-account credentials or role-management logic in browser code.

Phase 14 enables validated course publishing, private lesson editing, immutable lesson releases, protected student loading of compatible releases, and a read-only Audit History interface. Every accepted course or lesson change is linked to an immutable audit event in the same Firestore batch. Reviews, certificates, submissions, and public catalog release browsing remain locked.

Unsaved course and lesson text have best-effort browser recovery copies for power-loss recovery. Firestore is still authoritative, and recovery is blocked if the saved server revision changed.

See `../ADMIN_STUDIO.md` for role provisioning, revocation, workflow, and the Phase 14 gate.
