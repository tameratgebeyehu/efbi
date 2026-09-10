# EFBI Academy v2 — Project Status

Last updated: 2026-09-10

## Current state

The original public EFBI site is in security maintenance mode. This `efbi-academy-v2` project is the isolated replacement and must not be published as the live student platform until authentication, data access rules, progress tracking, and certificate workflows pass security testing.

## Completed in the current rebuild

- React and TypeScript application with clean browser routes.
- Detailed homepage with programs, methodology, Building EFBI, core values, founder profile, and calls to action.
- Separate Programs, Courses, Course Detail, Certification, Verification, Blog, About, Contact, Join, and Sign-in pages.
- Eight program pathways and the four-lesson AI Foundations pilot curriculum.
- Complete desktop and mobile header and footer navigation.
- Locally bundled DM Sans and Manrope typography.
- Existing EFBI logo, student image, and founder photograph reused.
- Firebase Hosting rewrite and baseline response headers in `firebase.json`.
- Safe holding states for enrollment, sign-in, submissions, and certificate verification.
- Production build and lint checks passing.
- Frontend copy and layouts refined across all public pages.
- Firebase web SDK, secure account forms, email-verification gate, and protected learning route added.
- Deny-by-default Firestore rules added and covered by eight emulator authorization tests.
- Backend data model, privacy boundaries, and Firebase Console checklist documented in BACKEND_FOUNDATION.md.
- Ten routes tested at 390px, 768px, and 1440px with no horizontal overflow or browser runtime errors.
- Development Firebase project `efbi-academy-dev-doha` connected.
- Default Firestore database verified in `me-central1` (Doha), Standard edition, free tier, with deletion protection.
- Email/Password authentication, a server-enforced 10-character password minimum, and improved email privacy enabled.
- Firestore rules and indexes deployed successfully to the Doha development database.
- Cloud authentication smoke test passed; its synthetic account was deleted.
- Full browser authentication flow passed, including profile creation, verification gates, password reset messaging, and protected-route return.
- Registration redirect race fixed so the Auth profile, Firestore profile, and verification request finish before navigation.
- Firebase App Check registered for the development web app with a domain-restricted reCAPTCHA Enterprise score key.
- App Check debug exchange passed in isolated Chrome; Authentication and Firestore remain in monitoring-only mode.
- Firebase split out of the public application bundle: the main JavaScript bundle fell from about 792 KB to about 286 KB, and Firestore now loads only for profile/progress operations.

## Firebase environments

- Active development: `efbi-academy-dev-doha`. Use this project for all current backend testing.
- Abandoned empty test: `efbi-academy-dev`. Its default database was unintentionally created in `nam5`; do not use it.

## Deliberately not active yet

- Public student enrollment; development authentication is connected but not production-ready.
- Learner profiles and progress records.
- Contact form submissions.
- Course video playback and completion tracking.
- Assessments and project submissions.
- Certificate issuance and public verification records.
- Administrative tools.
- Production deployment or custom-domain migration.

## Phase 3 status

Implementation is complete and monitoring has started:

1. reCAPTCHA Enterprise and Firebase App Check APIs are enabled in efbi-academy-dev-doha.
2. The development web app is registered with a score-based key restricted to its Firebase Hosting domains.
3. The risk threshold is 0.5 and token lifetime is one hour.
4. A private localhost debug token is stored only in .env.development.local.
5. Browser token exchange, registration, and Firestore profile creation passed.
6. Authentication and Firestore enforcement remain off until monitoring is reviewed.
7. Authentication email branding remains on Firebase defaults because the backend rejected template edits with EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED; the development project name still identifies EFBI.

See APP_CHECK.md for the enforcement checklist and recovery notes.

## Next implementation phase

Build the first real learning loop while App Check remains in monitoring mode:

1. Add the first AI Foundations lesson player and transcript.
2. Provide an accessible, low-bandwidth fallback.
3. Store progress by authenticated user ID.
4. Verify progress across refresh, sign-out/sign-in, and a second browser session.
5. Review App Check metrics before enabling enforcement.
6. Design assessments and project review before enabling certificate issuance.
## Recovery commands

From this directory:

```powershell
git status
git log --oneline --decorate -5
npm install
npm run dev
```

The first complete v2 checkpoint is commit `80a911d` on branch `codex/academy-v2`.

## Working agreement

- Commit after each coherent feature or decision checkpoint.
- Push completed checkpoints to GitHub before ending a work session.
- Never commit secrets, Firebase private keys, service-account files, or student data.
- Record important product and security decisions in this file or a dedicated document before implementation.
