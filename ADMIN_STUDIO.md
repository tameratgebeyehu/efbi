# EFBI Admin Studio

The EFBI Admin Studio is a separate, local-only application for trusted operators. It is not a route in the student website and must never be deployed to Firebase Hosting, GitHub Pages, or another public host.

## Current Phase 9 boundary

Phase 9 establishes identity and authorization only:

- the server binds to `127.0.0.1` on port `5174`;
- the interface blocks non-local hostnames;
- Firebase Authentication uses session persistence, so closing the browser ends the saved session;
- access requires a verified email and an `admin: true` Firebase custom claim;
- Courses, Reviews, Certificates, and Audit Log are visible but intentionally locked;
- Firestore course-draft, review-assignment, and admin-audit writes are denied for every browser identity.

This boundary prevents an unfinished editor from changing academy data.

## Start the studio

The studio reads the ignored Firebase development settings from `academy-v2/.env.local` and `academy-v2/.env.development.local`.

```powershell
cd "<EFBI repository>\efbi-admin-studio"
npm install
npm run dev
```

Open `http://127.0.0.1:5174/`. Do not use a LAN hostname or expose the port through a tunnel.

On the current Windows checkout, `node_modules` may be an ignored local junction to `academy-v2/node_modules` because the drive ACL blocked a second installation. A normal clone should use `npm install` and its own generated dependency directory.

## Create the first operator safely

1. Create a normal account in Firebase Authentication for the dedicated owner email.
2. Verify that email through Firebase's verification message.
3. Tell the project owner which exact email will receive access.
4. Inspect the account from the trusted local terminal:

```powershell
cd "<EFBI repository>\academy-v2"
npm run manage:roles -- inspect --email "owner@example.com"
```

5. Only after the owner separately confirms the exact email, grant the admin claim with the confirmation string printed by this pattern:

```powershell
npm run manage:roles -- set --email "owner@example.com" --role admin --value true --confirm "grant:admin:owner@example.com:efbi-academy-dev-doha"
```

6. Sign out and sign in again so Firebase issues a fresh ID token.

No role has been granted as part of Phase 9. The role tool is hard-limited to `efbi-academy-dev-doha`, preserves unrelated claims, refuses unverified accounts, and never stores a service-account key.

## Remove access

```powershell
npm run manage:roles -- set --email "owner@example.com" --role admin --value false --confirm "remove:admin:owner@example.com:efbi-academy-dev-doha"
```

Then revoke the user's refresh tokens in Firebase Console if access must end immediately.

## Role meanings

- `admin`: may read private course drafts, reviewer assignments, and the admin audit; future write operations still require schema-specific rules.
- `reviewer`: may read review assignments only. It cannot read course drafts or the admin audit.
- `support`: reserved for future limited support work. It currently receives no private operational reads.

A route name, hidden button, or local interface is not authorization. Firebase Authentication claims and Firestore rules remain the real security boundary.

## Security rules

- Never commit `.env.local`, `.env.development.local`, App Check debug tokens, refresh tokens, service-account JSON, private keys, student exports, or passwords.
- Never add registration or password-reset controls to the Admin Studio.
- Never share one admin account between people.
- Never grant roles from browser code.
- Never enable a Firestore write until its exact schema, allowed state transitions, audit behavior, and emulator tests ship together.
- Never put the Admin Studio inside the public student build.
- Run `npm run build` and `npm run lint` in both applications, plus all Firestore rule tests, before each administrative release.

## Legacy system

The root Google Apps Script and spreadsheet backend is retired. Its browser scripts are no longer loaded by the maintenance page, default credentials are removed, and its request handlers return a retired response. The Google Apps Script owner must still open **Deploy > Manage deployments** and archive any old deployment; a read-only endpoint check did not return a successful response but cannot prove that every historical deployment is archived.

## Phase 10 gate

Phase 10 can add a course editor only after defining a versioned draft schema, immutable published releases, validation limits, preview behavior, audit events, and emulator tests. Public enrollment, project submissions, file uploads, and certificate issuance remain outside this phase.
