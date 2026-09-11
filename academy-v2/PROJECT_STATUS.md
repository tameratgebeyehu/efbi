# EFBI Academy v2 — Project Status

Last updated: 2026-09-12

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
- Deny-by-default Firestore rules added and now covered by 27 emulator authorization tests.
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
- First AI Foundations lesson built with concise objectives, Ethiopia-relevant examples, and a complete written lesson.
- Protected lesson route redesigned for desktop and mobile with clear course navigation.
- Privacy-aware YouTube gate and remembered low-bandwidth mode added; no video request is made until the learner chooses to load it.
- Authenticated Firestore progress added with explicit completion, refresh/sign-in restoration, retry handling, and honest 0%/25% states.
- Progress rules hardened against unknown lessons, forged percentages, duplicate IDs, timestamp rewriting, resets, and cross-user access.
- Lesson 2 published with a concise written lesson, three-question knowledge check, routed lesson navigation, and an optional privacy-aware video slot.
- Sequential progress expanded from 25% to 50%, with resume-to-next-lesson behavior and anti-skip rules.
- Lesson 3 published with practical privacy, misinformation, bias, academic-honesty, and human-oversight guidance.
- Sequential progress expanded to 75% with exact one-step transitions and live anti-skip/anti-rollback testing.
- Published-content versioning and a certificate-safe knowledge-check boundary documented.
- Lesson 4 published with a local-problem project pathway, practical testing guidance, and a browser-only knowledge check.
- Sequential progress completed at 100% with exact one-step rules, fourteen emulator tests, and a live Doha isolation test.
- Project submission, consent, upload, retention, reviewer-role, and assessment-rubric boundaries specified before any uploads were enabled.
- Course completion remains separate from assessment approval and administrator-only certificate issuance.
- Separate `efbi-admin-studio` application created with no public student-app route.
- Admin Studio bound to localhost with session-only Firebase Authentication and verified-email plus admin-claim authorization.
- Development-only owner role utility added with exact confirmation, verified-email checks, and no service-account key.
- Private course-draft, review-assignment, and audit paths reserved with all browser writes locked.
- Legacy Apps Script browser loading and default credentials removed; its handlers now return a retired response.

## Firebase environments

- Active development: `efbi-academy-dev-doha`. Use this project for all current backend testing.
- Abandoned empty test: `efbi-academy-dev`. Its default database was unintentionally created in `nam5`; do not use it.

## Deliberately not active yet

- Public student enrollment; development authentication is connected but not production-ready.
- Contact form submissions.
- Published course video playback; no EFBI YouTube lesson ID has been supplied yet.
- Lesson and practice-question editing in the Admin Studio.
- Reviewed assessments and project submissions.
- Certificate issuance and public verification records.
- Review, submission, certificate, and audit-log operations in the Admin Studio.
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

## Phase 4 status

The first learning experience is implemented:

1. Lesson 1 now has objectives, a full written lesson, and an accessible transcript area.
2. The protected course page has responsive lesson navigation and clear availability states.
3. Video uses a click-to-load `youtube-nocookie.com` embed when a valid ID is configured.
4. Low-bandwidth mode prevents video loading and remembers the choice in the browser.
5. No real EFBI YouTube lesson ID was found, so the page shows a professional written-lesson fallback instead of a broken player.
6. Authentication and email verification still gate the learning route; progress is not falsely shown as saved.

See LEARNING_CONTENT.md for the video publishing checklist and the YouTube privacy limitation.

## Phase 5 status

Private progress tracking is implemented and verified:

1. Lesson completion requires an explicit learner action.
2. Progress is stored at `users/{uid}/progress/ai-foundations` and restored after refresh or a fresh sign-in.
3. Lesson 1 completion displays an honest 25% for the four-lesson course.
4. Firestore rules permit only the published lesson and reject forged or regressed progress.
5. Nine emulator authorization tests pass.
6. Live Doha testing passed for write, restore, anti-forgery, and cross-user isolation.
7. The synthetic users and progress records were deleted after testing.
8. App Check remains in monitoring mode.

See PROGRESS_TRACKING.md for the schema, rule invariants, and Lesson 2 publishing checklist.

## Phase 6 status

The second learning step is implemented and verified:

1. Prompting with purpose now has objectives, an accessible written lesson, and its own optional video setting.
2. Protected lesson routes support direct navigation and resume the first unfinished published lesson.
3. Lesson 2 remains locked for completion until Lesson 1 is saved.
4. A three-question browser-only knowledge check gives immediate feedback and stores no answers.
5. Sequential progress supports only the exact 25% and 50% states.
6. Ten emulator authorization tests pass.
7. Live Doha testing passed for anti-skip, 25→50%, two fresh-session restores, anti-reset, and cross-user isolation.
8. Synthetic users and progress records were deleted after testing.
9. Desktop and phone Chrome renders produced screenshots; a duplicate React key found in the first render was fixed. The image-inspection helper remained blocked by Windows ACLs.
10. App Check remains in monitoring mode: the CLI exposes no request metrics, browser automation is ACL-blocked, and incomplete evidence does not justify enforcement.

See LEARNING_CONTENT.md and PROGRESS_TRACKING.md for the content, quiz, video, and security boundaries.

## Phase 7 status

The third learning step is implemented and verified:

1. Responsible use now covers privacy, unreliable claims, bias, academic honesty, and accountable human decisions in plain language.
2. Lesson 3 has an accessible written version, three-question browser-only knowledge check, and optional privacy-aware video setting.
3. Protected navigation and resume behavior now include the first three lessons.
4. Sequential progress accepts only 25%, 50%, and 75%, with exactly one lesson added per update.
5. Twelve emulator authorization tests pass, including direct-skip and rollback denial.
6. The Doha development rules compile and are deployed.
7. Live Doha testing passed for 25→50→75, restore, anti-skip, anti-rollback, and cross-user isolation.
8. The one synthetic progress record and two synthetic authentication accounts were deleted after testing.
9. Certificate copy now separates browser practice questions from the future reviewed final assessment.
10. COURSE_VERSIONING.md defines immutable published slugs and a new-course-ID rule for major revisions.
11. App Check enforcement remains off because Windows ACL failures prevented trustworthy Console metrics review; incomplete evidence does not justify enforcement.

See LEARNING_CONTENT.md, PROGRESS_TRACKING.md, COURSE_VERSIONING.md, and APP_CHECK.md for the content and security boundaries.

## Phase 8 status

The four-lesson pilot learning path is complete and verified:

1. Build an Ethiopian solution guides learners from a specific local problem to a small, safe, testable project.
2. Lesson 4 includes a full written version, optional privacy-aware video setting, and a three-question browser-only knowledge check.
3. Protected navigation and resume behavior cover all four lessons and end at a clear course-complete state.
4. Sequential progress accepts only 25%, 50%, 75%, and 100%, with exactly one lesson added per update.
5. Fourteen Firestore emulator tests pass, including 75%→100%, direct-skip denial, rollback denial, cross-user isolation, and certificate authorization.
6. The tested rules were deployed only to `efbi-academy-dev-doha`.
7. Live Doha testing passed for 25%→50%→75%→100%, restore, anti-skip, anti-rollback, and cross-user isolation.
8. The one synthetic progress record and two synthetic authentication accounts were deleted after testing.
9. ASSESSMENT_AND_SUBMISSIONS.md defines a proposed schema, explicit consent, file limits, retention, versioned rubric, reviewer roles, and implementation gates.
10. Uploads, reviewed assessment writes, and certificate issuance remain disabled.
11. App Check enforcement remains off because the Windows ACL failure again prevented a trustworthy Console metrics review.

See LEARNING_CONTENT.md, PROGRESS_TRACKING.md, ASSESSMENT_AND_SUBMISSIONS.md, COURSE_VERSIONING.md, and APP_CHECK.md for the complete boundaries.

## Phase 9 status

The private administration foundation is implemented and verified:

1. Admin Studio is a separate React application with no `/admin` route or code in the student build.
2. Vite binds development and preview servers only to `127.0.0.1`; the interface also blocks non-local hostnames.
3. Authentication uses browser-session persistence and requires both verified email and an `admin: true` custom claim.
4. Courses, Lessons, Submissions, Certificates, and Audit Log remain visibly locked; the browser has no operational write path.
5. A local owner role utility supports `admin`, `reviewer`, and `support`, preserves existing claims, refuses unverified grants, and is hard-limited to `efbi-academy-dev-doha`.
6. Role mutations require an exact confirmation phrase. No role was provisioned during this phase.
7. Firestore reserves private course drafts, review assignments, and audit events with least-privilege reads and universal browser-write denial.
8. Eighteen emulator authorization tests pass, including role separation and denied writes for learner, reviewer, and administrator browser identities; the warning-free rules were deployed only to `efbi-academy-dev-doha`.
9. Student and Admin Studio production builds and lint checks pass.
10. The root maintenance page no longer loads legacy API/application scripts; default legacy credentials were removed and Apps Script handlers were retired in source.
11. The Apps Script owner must still confirm every historical web deployment is archived in **Deploy > Manage deployments**.
12. App Check remains in monitoring mode; Phase 9 did not weaken or prematurely enable enforcement.

See `../ADMIN_STUDIO.md` and `../LEGACY_SYSTEM_RETIRED.md` for operating and containment rules.

## Phase 10 status

The secure course-management foundation is implemented and verified:

1. The local Admin Studio can create, edit, preview, mark ready, and publish course-level records.
2. Course fields have strict schemas, length limits, allowed values, slug validation, server timestamps, immutable creation metadata, and exact one-step revisions.
3. Every accepted course change requires a linked immutable audit event in the same atomic Firestore batch.
4. Publication requires a ready draft and atomically creates the next immutable release snapshot without changing course content during the publish action.
5. No-op updates, revision skipping, actor forgery, unknown fields, orphan audits, partial publications, release mutation, and browser deletion are denied.
6. A best-effort browser recovery copy protects unsaved course text after a power interruption and refuses restoration when its server base revision is stale.
7. Twenty-seven Firestore emulator authorization tests pass.
8. Student and Admin Studio builds and lint checks pass. The studio remains bound to `127.0.0.1:5174`.
9. The tested Firestore rules were deployed only to the Doha development project.
10. The student app still uses the version-controlled pilot curriculum; Phase 10 releases do not silently change learner routes or progress meaning.
11. No administrator role, course data, learner data, public Admin Studio, Hosting release, upload path, or new certificate workflow was created in this phase.
12. App Check remains in monitoring-only mode.
13. Automated browser image inspection remained unavailable because the trusted Windows automation process was blocked by local ACLs; builds, HTTP availability, responsive CSS, and security tests were still verified.

See `../ADMIN_STUDIO.md`, `COURSE_MANAGEMENT.md`, and `COURSE_VERSIONING.md` for operation and integrity rules.

## Next implementation phase

Phase 11 should implement structured lesson and practice-question management without opening public enrollment:

1. Define immutable lesson IDs, ordering, allowed content blocks, and draft/release relationships.
2. Add safe lesson and practice-question editors only after their Firestore schemas and emulator tests pass.
3. Keep practice answers browser-only; do not turn them into certificate evidence.
4. Plan an explicit migration from the version-controlled AI Foundations pilot to release records without changing existing progress meaning.
5. Preserve low-bandwidth written lessons and click-to-load privacy-aware video behavior.
6. Keep reviewed assessments, submissions, uploads, certificate issuance, public enrollment, and production deployment disabled.

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
