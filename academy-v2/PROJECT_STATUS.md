# EFBI Academy v2 — Project Status

Last updated: 2026-09-11

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
- Deny-by-default Firestore rules added and covered by twelve emulator authorization tests.
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

## Firebase environments

- Active development: `efbi-academy-dev-doha`. Use this project for all current backend testing.
- Abandoned empty test: `efbi-academy-dev`. Its default database was unintentionally created in `nam5`; do not use it.

## Deliberately not active yet

- Public student enrollment; development authentication is connected but not production-ready.
- Contact form submissions.
- Published course video playback; no EFBI YouTube lesson ID has been supplied yet.
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

## Next implementation phase

Phase 8 should complete the pilot learning path and design the assessment boundary:

1. Build Lesson 4: Build an Ethiopian solution.
2. Expand sequential progress from 75% to 100% with emulator and live isolation tests.
3. Define the project-submission schema, consent language, file limits, retention, and reviewer roles before enabling uploads.
4. Design a reviewed final assessment that is separate from browser practice questions.
5. Review App Check metrics in Firebase Console before considering service-by-service enforcement.
6. Keep certificate issuance disabled until submission review and administrator authorization are implemented and tested.
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
