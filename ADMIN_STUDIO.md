# EFBI Admin Studio

The EFBI Admin Studio is a separate, local-only application for trusted operators. It is not a route in the student website and must never be deployed to Firebase Hosting, GitHub Pages, or another public host.

## Current Phase 17 boundary

Phase 18 adds a controlled certificate lifecycle after a final approved review and separate learner consent. Issuance, revocation, and replacement are administrator-only, atomic, and audited.

- the server binds to `127.0.0.1` on port `5174`;
- the interface blocks non-local hostnames;
- Firebase Authentication uses session persistence, so closing the browser ends the saved session;
- access requires a verified email plus an `admin: true` or `reviewer: true` Firebase custom claim;
- Courses can be created, edited, previewed, marked ready, and published;
- every accepted course change and publication writes a linked audit event in the same atomic batch;
- published releases are immutable snapshots;
- Lessons and browser-only practice questions can be drafted and published as immutable releases;
- Audit History shows the newest 250 course and lesson events with local filters and no mutation controls;
- Administrators can read submitted projects, never private drafts, and create one immutable reviewer assignment;
- Reviewers can read only their own assignments and linked submitted projects;
- an assigned reviewer can publish one immutable calculated result with learner feedback and isolated private notes;
- exactly one revision is allowed after a revision request; additional revisions, appeals, files, certificates, and public enrollment remain outside this phase.

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

No role has been granted as part of Phases 9 through 18. The role tool is hard-limited to `efbi-academy-dev-doha`, preserves unrelated claims, refuses unverified accounts, and never stores a service-account key.

## Remove access

```powershell
npm run manage:roles -- set --email "owner@example.com" --role admin --value false --confirm "remove:admin:owner@example.com:efbi-academy-dev-doha"
```

Then revoke the user's refresh tokens in Firebase Console if access must end immediately.

## Role meanings

- `admin`: may manage validated course and lesson releases, read submitted projects and private completed reviews, create immutable reviewer assignments, operate the audited certificate lifecycle, and read private audit evidence. It cannot read private learner drafts or create review decisions.
- `reviewer`: may list only assignments addressed to its own user ID, read the linked submitted projects, and publish one permanent rubric result for each. It cannot read course drafts, other assignments, or the admin audit.
- `support`: reserved for future limited support work. It currently receives no private operational reads.

A route name, hidden button, or local interface is not authorization. Firebase Authentication claims and Firestore rules remain the real security boundary.

## Create a reviewer safely

1. Create a separate Firebase Authentication account for the reviewer and verify its email.
2. Inspect it with `npm run manage:roles -- inspect --email "reviewer@example.com"` and copy the returned `uid`.
3. Grant only the reviewer role with the exact confirmation string:

```powershell
npm run manage:roles -- set --email "reviewer@example.com" --role reviewer --value true --confirm "grant:reviewer:reviewer@example.com:efbi-academy-dev-doha"
```

4. Give the administrator the reviewer UID, not the password. The reviewer must sign out and sign in again.
5. Never give a routine reviewer the administrator role.

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

## Review assignment workflow

1. The learner finishes all four AI Foundations lessons, saves a private project draft, accepts the consent statement, and submits the final version.
2. Open **Reviews** as an administrator. Only submitted work appears; private drafts remain invisible.
3. Select a project and paste the exact UID from the inspected reviewer account.
4. Confirm the UID before choosing **Assign reviewer**. Pilot assignments are immutable and cannot be silently reassigned or deleted.
5. The reviewer signs in to the same localhost Studio. Only **Reviews** is available, and only that reviewer’s assigned projects load.
6. Treat every external evidence link as untrusted. Never enter credentials or download unexpected files.
7. Score all five rubric criteria from 0 to 2. The Studio calculates approval or revision requested; reviewers cannot override it.
8. Write learner feedback without private or safeguarding information. Put internal concerns only in the private fields.
9. Confirm the permanent result and publish it. The learner receives only the safe result copy.
10. If the result requests changes, the learner may save and submit one separate revision. Version 1 and its review stay unchanged.
11. Return as an administrator and assign the submitted revision separately. A draft revision never appears in the Studio.
12. The assigned reviewer reviews the exact revision and publishes its separate permanent result.

No third version is allowed. Appeals and file uploads remain disabled. Certificate operations follow the separate controlled workflow below.

## Certificate workflow

1. The learner's final approved review unlocks a certificate request, not automatic issuance.
2. The learner chooses and explicitly consents to the name shown in public verification.
3. Open **Certificates** as an administrator and select the eligible request.
4. Check the final review binding and public name, then accept the permanent-action confirmation.
5. Issue the certificate. Private evidence, public core, active status, learner claim, and audit event are committed atomically.
6. Use revocation only when the credential must no longer be valid. The original issuance remains unchanged.
7. Use replacement for a correction while the credential is active. A new ID becomes active and the old ID stays publicly verifiable as replaced.
8. Confirm every action through the public verification link. Never use Firebase Console for ordinary certificate changes.

See academy-v2/CERTIFICATE_OPERATIONS.md for fields, privacy boundaries, and permanent-state rules.

## Audit History workflow

1. Open **Audit history** to load the newest 250 immutable content events.
2. Filter by course or lesson, action, content ID, actor ID, or release ID.
3. Use the event and release IDs during a documented investigation to connect an edit to its exact operation.
4. Never treat this browser view as a backup or edit the records manually. Firestore is the source of truth, and security rules deny audit updates and deletion.

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

## Phase 18 status

The secure certificate lifecycle is implemented and tested in the development environment. Appeals, file uploads, public enrollment, public Hosting deployment, and production certificate operations remain outside Phase 18.
