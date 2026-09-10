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

## Next implementation phase

Complete the first real learning loop in the Doha development project:

1. Test registration, verification, sign-in, reset, sign-out, and protected-route behavior in the browser.
2. Register App Check, monitor it first, then enforce it before any public enrollment.
3. Add the first lesson player, transcript, and accessible fallback.
4. Save progress by authenticated user ID and verify it survives a second device/session.
5. Split Firebase from the public JavaScript bundle to improve first-load performance.
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
