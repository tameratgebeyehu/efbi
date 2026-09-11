# EFBI Admin Studio

The EFBI Admin Studio is a separate, local-only application for trusted operators. It is not a route in the student website and must never be deployed to Firebase Hosting, GitHub Pages, or another public host.

## Current Phase 12 boundary

Phase 12 keeps course publishing available and adds immutable lesson releases for administrator-managed lesson drafts. Practice questions remain browser-only learning checks, not assessment evidence.

- the server binds to `127.0.0.1` on port `5174`;
- the interface blocks non-local hostnames;
- Firebase Authentication uses session persistence, so closing the browser ends the saved session;
- access requires a verified email and an `admin: true` Firebase custom claim;
- Courses can be created, edited, previewed, marked ready, and published;
- every accepted course change and publication writes a linked audit event in the same atomic batch;
- published releases are immutable snapshots;
- Reviews, Certificates, and the Audit Log interface remain intentionally locked;
- learner submissions, files, lessons, questions, certificates, and public enrollment remain outside this phase.

The local interface reduces exposure, while Firebase claims and Firestore rules provide the actual authorization boundary.

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

No role has been granted as part of Phases 9, 10, 11, or 12. The role tool is hard-limited to `efbi-academy-dev-doha`, preserves unrelated claims, refuses unverified accounts, and never stores a service-account key.

## Remove access

```powershell
npm run manage:roles -- set --email "owner@example.com" --role admin --value false --confirm "remove:admin:owner@example.com:efbi-academy-dev-doha"
```

Then revoke the user's refresh tokens in Firebase Console if access must end immediately.

## Role meanings

- `admin`: may manage validated course drafts, course releases, lesson drafts, and may read reviewer assignments and the admin audit.
- `reviewer`: may read review assignments only. It cannot read course drafts or the admin audit.
- `support`: reserved for future limited support work. It currently receives no private operational reads.

A route name, hidden button, or local interface is not authorization. Firebase Authentication claims and Firestore rules remain the real security boundary.

## Course workflow

1. Open **Courses** and choose **New course**, or select an existing draft.
2. Use a lowercase slug such as `digital-literacy`; it becomes the durable course ID.
3. Complete every required field and save the draft.
4. Review the safe preview, then choose **Mark ready for review**.
5. Confirm the exact preview and choose **Publish release**.
6. Publication creates an immutable release and advances the draft's release number in one atomic operation.

The browser keeps a best-effort recovery copy of unsaved course text. After a power cut, the studio offers **Restore** or **Discard**. Recovery is refused when the server revision changed in the meantime. It is not a backup and never overrides Firestore.

Firestore remains the source of truth. Do not edit `courseDrafts`, `courseReleases`, `lessonDrafts`, or `adminAudit` manually in the Firebase Console except during a documented recovery investigation.
## Lesson workflow

1. Open **Lessons** and choose **New lesson**, or select an existing lesson draft.
2. Choose the parent course and set a permanent lowercase lesson ID.
3. Add order, title, short summary, learning time, optional YouTube video ID, and the written lesson text.
4. Add up to three practice questions. These are learner practice only and do not create certificate evidence.
5. Save as draft, or mark the lesson review ready.

Lesson drafts stay private to administrators. They are not connected to the student learning route until a later migration phase proves ordering, progress compatibility, and release behavior.

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

## Phase 13 gate

Phase 13 may migrate the student catalog to backend course and lesson releases only after emulator tests prove release consumption, ordering, progress compatibility, fallback behavior, and rollback safety. Public enrollment, project submissions, file uploads, reviewed assessments, and certificate issuance remain outside that phase.
