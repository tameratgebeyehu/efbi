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
- Deny-by-default Firestore rules added and now covered by 57 emulator authorization tests.
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
- Course publishing, lesson draft editing, and immutable lesson release publishing are available only in the localhost Admin Studio with linked audit records.
- Protected AI Foundations lessons can load compatible immutable backend releases with a safe fallback to the version-controlled curriculum.
- The localhost Admin Studio can inspect the newest 250 immutable content audit events with read-only filters.
- Completed learners can save a private AI Foundations project draft and submit an immutable text-and-HTTPS-link record with versioned consent.
- Administrators can assign submitted projects; assigned reviewers can publish one immutable rubric result; learners receive a separate public-safe result without private review fields.
- One separate revision is available only after a revision request; Version 1 and both review histories remain immutable.
- Learners can request or cancel deletion from Account; active requests freeze learning and assessment changes.
- The localhost Admin Studio supports private audited holds and atomic deletion while preserving certificate proof.

## Firebase environments

- Active development: `efbi-academy-dev-doha`. Use this project for all current backend testing.
- Abandoned empty test: `efbi-academy-dev`. Its default database was unintentionally created in `nam5`; do not use it.

## Deliberately not active yet

- Public student enrollment; development authentication is connected but not production-ready.
- Contact form submissions.
- Published course video playback; no EFBI YouTube lesson ID has been supplied yet.
- Appeals and additional learner revisions beyond the one controlled response.
- Production certificate issuance and real learner credential operations.
- File uploads and production review operations.
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

## Phase 11 status

The private lesson-management foundation is implemented and verified:

1. The local Admin Studio now has a Lessons workspace beside Courses.
2. Administrators can create, edit, preview, and mark lesson drafts ready.
3. Lesson drafts use strict fields for parent course, permanent lesson ID, order, title, summary, duration, optional YouTube ID, written lesson text, status, revision, timestamps, actor IDs, and audit link.
4. Each lesson can include up to three fixed practice questions with three options, one correct answer, and a short explanation.
5. Disabled practice-question slots must stay empty, keeping the data shape predictable and certificate-safe.
6. Every accepted lesson create or update requires a matching immutable `adminAudit` event in the same Firestore batch.
7. Learners, reviewers, support accounts, and unauthenticated visitors cannot read or write lesson drafts.
8. No-op updates, skipped revisions, changed ownership, invalid video IDs, invalid question state, unknown fields, missing audits, direct audit writes, and deletion are denied.
9. Thirty-three Firestore emulator authorization tests pass.
10. Student and Admin Studio builds and lint checks pass.
11. The tested Firestore rules were deployed only to the Doha development project.
12. The student app still uses the version-controlled AI Foundations curriculum; Phase 11 does not publish lesson drafts to learners or change saved progress meaning.
13. No administrator role, course data, lesson data, learner data, public Admin Studio, Hosting release, upload path, or new certificate workflow was created in this phase.
14. App Check remains in monitoring-only mode.

See `LESSON_MANAGEMENT.md`, `COURSE_MANAGEMENT.md`, and `../ADMIN_STUDIO.md` for operation and integrity rules.
## Phase 12 status

Immutable lesson release publishing is implemented and verified:

1. Review-ready lesson drafts can be published from the localhost Admin Studio.
2. Each lesson publication creates exactly one immutable `lessonReleases/{releaseId}` snapshot.
3. Publishing advances the lesson draft by one revision and stores the latest release number and release ID.
4. The lesson draft, release snapshot, and `lesson.release.published` audit event must be written together in one atomic batch.
5. Firestore rules reject unready lessons, changed content during publish, skipped release numbers, missing release records, missing audit records, direct release updates, and release deletion.
6. Verified learners may read lesson release snapshots; Phase 12 stopped before student-route consumption.
7. Thirty-five Firestore emulator authorization tests pass.
8. Student and Admin Studio builds and lint checks pass.
9. The tested Firestore rules were deployed only to the Doha development project.
10. The student app still uses the version-controlled AI Foundations curriculum; Phase 12 does not change saved progress meaning.
11. No administrator role, learner data, public Admin Studio, Hosting release, upload path, public enrollment, reviewed assessment, or certificate workflow was created in this phase.
12. App Check remains in monitoring-only mode.

See `LESSON_MANAGEMENT.md`, `COURSE_MANAGEMENT.md`, and `../ADMIN_STUDIO.md` for operation and integrity rules.

## Phase 13 status

Protected backend release loading is implemented and verified:

1. The verified AI Foundations learning route now tries to load immutable `courseReleases` and `lessonReleases` from Firestore.
2. The migration accepts only the existing four lesson slugs, in the existing order, so saved progress keeps the same meaning.
3. If a course release, lesson release, question, video ID, or written lesson is missing or incompatible, the learner stays on the safe version-controlled curriculum.
4. Backend lesson video IDs can be used when valid, while the low-bandwidth and click-to-load YouTube privacy gate remains unchanged.
5. Practice questions remain browser-only and do not create certificate evidence.
6. Public Courses and Course Detail pages still use the built-in outline because release collections require a verified learner account.
7. Thirty-five Firestore emulator authorization tests pass.
8. Student build and lint checks pass.
9. No Firestore rule deployment was required in this phase because the existing Phase 12 release-read rules already support verified learners.
10. No administrator role, learner data, public Admin Studio, Hosting release, upload path, public enrollment, reviewed assessment, or certificate workflow was created in this phase.
11. App Check remains in monitoring-only mode.

See `LEARNING_CONTENT.md`, `LESSON_MANAGEMENT.md`, `COURSE_VERSIONING.md`, and `BACKEND_FOUNDATION.md` for content and release boundaries.

## Phase 14 status

Implementation is complete:

1. Audit History is available only after the localhost Studio verifies a signed-in administrator claim.
2. The view loads at most the newest 250 events, ordered newest first.
3. Administrators can filter by course or lesson, action, content ID, actor ID, and release ID.
4. The view contains no create, update, delete, export, or role-management operation.
5. Existing Firestore rules keep audit records administrator-readable and universally immutable after creation.
6. Learners, reviewers, and support accounts cannot read the audit collection.
7. The student app has no `/admin` route or private administration code.
8. Submissions, uploads, certificate issuance, public enrollment, and production deployment remain disabled.

## Phase 15 status

Implementation is complete in the development environment:

1. A verified learner must reach 100% AI Foundations progress before creating the one permitted project draft.
2. Drafts contain structured text and at most three HTTPS evidence links; raw files and unknown fields are rejected.
3. Final submission requires complete fields, at least one evidence link, two deliberate confirmations, and versioned consent with server timestamps.
4. Submitted projects are immutable to learners and cannot be deleted from a browser account.
5. Administrators can query submitted records but cannot read learner drafts.
6. Administrators can create one immutable reviewer assignment for a submitted project.
7. Reviewers can query only their own assignments and directly read only the linked final submissions.
8. The localhost Studio exposes no course, lesson, certificate, or audit controls to reviewer-only accounts.
9. The tested rules and submissions collection-group index were deployed only to `efbi-academy-dev-doha`.
10. Forty-three Firestore emulator authorization tests pass.
11. File uploads, scoring, decisions, appeals, certificate eligibility, certificate issuance, public enrollment, and production deployment remain disabled.

## Phase 16 status

Implementation is complete in the development environment:

1. The assigned reviewer scores five fixed rubric criteria from 0 to 2.
2. Approval is calculated only at 8/10 or higher, with a nonzero safety score and no unresolved private concern.
3. Every other valid outcome is one immutable revision-request result.
4. The private result and learner-safe result must be created together and match exactly on public fields.
5. Learners never receive reviewer identity, concern category, or private notes.
6. Results bind to the immutable assignment, reviewer, submission timestamp, course version, assessment version, and rubric version.
7. Reviewers cannot inspect or score another reviewer's work; administrators can inspect results but cannot create decisions.
8. Review results cannot be updated, deleted, reversed, or recreated through browser accounts.
9. Certificate creation and changes are denied to every browser role, including administrators.
10. The tested Phase 16 rules were deployed only to `efbi-academy-dev-doha`.
11. Fifty Firestore emulator authorization tests pass.
12. Revision responses, appeals, file uploads, certificate issuance, public enrollment, and production deployment remain disabled.

## Phase 17 status

Implementation is complete in the development codebase:

1. A Version 1 `revision_requested` result unlocks exactly one separate revision draft.
2. The revision is stored as `ai-foundations-project-revision-1` with fixed origin, revision number, and first-review binding.
3. Version 1 and its review remain immutable and visible in the learner's version history.
4. The revision requires fresh consent, becomes immutable on submission, and cannot be deleted.
5. Administrators see only a submitted revision and assign it separately from Version 1.
6. The assigned reviewer publishes a new atomic private and learner-safe result bound to the exact revision timestamp.
7. A second revision request does not unlock a third project version.
8. Learners never receive reviewer identity, concern category, or private notes from either review.
9. Student and Admin Studio builds and lint checks pass.
10. Fifty-seven Firestore emulator authorization tests pass.
11. The tested Phase 17 Firestore rules were deployed only to `efbi-academy-dev-doha`.
12. Appeals, certificates, file uploads, public enrollment, and production deployment remain disabled.

## Phase 18 status

Implementation is complete in the development codebase:

1. A certificate request requires the learner's final approved review and separate public-name consent.
2. The learner request is immutable and contains the exact approved review binding.
3. Only a verified administrator may issue a credential; learner and reviewer issuance is denied.
4. Issuance atomically creates immutable private evidence, immutable public core, active status, a one-per-course claim, and immutable audit evidence.
5. Public verification exposes only the learner-approved name, course, issue date, credential ID, replacement link, and current status.
6. Revocation preserves issuance history and permanently changes only the public status with a matching private audit event.
7. Replacement creates a new ID, marks the old ID replaced, advances the learner claim, and preserves both public records atomically.
8. Revoked and replaced credentials cannot be reactivated.
9. Learner and Admin Studio builds and lint checks pass.
10. Sixty-six Firestore emulator authorization and lifecycle tests pass.
11. The tested Phase 18 rules were deployed only to efbi-academy-dev-doha.
12. No public Hosting release, real learner record, role grant, appeal, file upload, or production operation was created.

## Phase 19 status

Implementation is complete in the development codebase:

1. A signed-in learner can create, cancel, or reopen one fixed-schema deletion request from the Account page.
2. Requested, held, and completed states freeze profile, progress, submission, review, assignment, certificate-request, and certificate-issuance changes.
3. Only a verified administrator can place or release a documented private hold, and each transition requires a matching immutable audit event in the same batch.
4. Deletion is an all-or-nothing Firestore batch. It removes the profile, AI Foundations progress, and every eligible fixed pilot assessment record before completion can be recorded.
5. If a certificate claim exists, certificate-linked submissions, reviews, learner consent, private issuance evidence, public verification, status, claim, and audit history remain protected.
6. Learners see request status and minimal completion evidence but cannot read private hold reasons or retention audit events.
7. Firebase Authentication deletion is intentionally a separate exact-UID console step; no service-account or Admin SDK credential is placed in browser code.
8. The provisional retention schedule and 30-day hold review process are documented, but automated expiry is not active and the policy requires Ethiopian legal and safeguarding approval before enrollment.
9. Learner and Admin Studio builds and lint checks pass.
10. Seventy-one Firestore emulator authorization and lifecycle tests pass, including partial-deletion rejection, active-hold blocking, cross-user denial, and certificate-evidence preservation.
11. The tested Phase 19 rules are deployed only to `efbi-academy-dev-doha`.
12. No public Hosting release, learner data, Authentication deletion, role grant, hold, completion record, or production operation was created during development.

See `RETENTION_AND_DELETION.md` and `../ADMIN_STUDIO.md` for the policy, scope limits, and exact operating procedure.

## Phase 20 status

The technical readiness checkpoint is complete in the development codebase; external approval gates remain blocked:

1. The localhost Privacy & retention workspace now ranks requests by operational attention.
2. Requested records use a 14-day internal EFBI response target measured from their latest activation. The interface clearly says this is not a statutory deadline.
3. Active holds show a 30-day review countdown and an overdue warning during the final seven days and after the target.
4. Completed Firestore deletions remain visible until the separate Firebase Authentication removal is confirmed.
5. Authentication-removal confirmation requires the exact UID, an explicit operator statement, and a matching immutable audit event. It cannot perform or technically verify the Console deletion.
6. A sparse-account edge case discovered by the Phase 20 exercise was fixed: the executor always includes every fixed pilot path, so absent documents are safe no-op deletes and the security proof remains within Firestore limits.
7. A complete emulator exercise used dedicated synthetic learner, reviewer, and administrator identities for request, hold, release, deletion, reviewer denial, Authentication confirmation, and immutability. Emulator cleanup removed all synthetic records.
8. Seventy-two Firestore authorization and lifecycle tests pass.
9. Learner and Admin Studio builds and lint checks pass.
10. Firestore TTL was rejected for this workflow because it is billed, non-transactional, and cannot enforce the hold and certificate package. Scheduled Cloud Functions also require a billed path. The future trusted executor is designed but not deployed.
11. Firebase CLI still exposes App Check debug-token management but not request-category metrics. Enforcement remains off until a project owner reviews the Console metrics and names a rollback owner.
12. The privacy/legal and safeguarding gate is explicitly blocked pending real reviewers, controller/contact information, learner-age policy, lawful-basis decisions, transfer review, and approval of retention and certificate exceptions.
13. The tested Phase 20 rules are deployed only to `efbi-academy-dev-doha`.
14. No public Hosting release, live learner data, live Authentication removal, operator role grant, billing upgrade, TTL policy, scheduled function, or production operation was created.

See `RETENTION_AND_DELETION.md`, `RETENTION_EXECUTOR_DESIGN.md`, `PREPRODUCTION_PRIVACY_GATE.md`, `APP_CHECK.md`, and `../ADMIN_STUDIO.md`.

## Phase 21 status

Owner decision intake is recorded; implementation and external review remain in progress:

1. Tamerat Gebeyehu, CEO and Founder, is recorded as the accountable EFBI owner.
2. `efbi.academy@gmail.com` is recorded as the privacy and deletion contact.
3. EFBI is currently an unregistered educational initiative and intends to serve learners aged 12 and older across scholarships, applications, technology, AI, and other practical subjects.
4. The minimum age is 12. The official proclamation's under-16 boundary and guardian-authorization requirements for ages 12–15 are documented in `PRIVACY_DECISIONS.md`.
5. A plain-language learner notice exists as `PRIVACY_NOTICE_DRAFT.md`, clearly marked unapproved and not for publication.
6. `PRIVACY_REVIEW_WORKSHEET.md` maps all eleven gates to owner, technical, and external-review actions and required evidence.
7. `DPIA_DRAFT.md` documents the current data flow, necessity assessment, eleven initial risks, existing safeguards, required mitigations, and a high launch-blocking residual-risk conclusion.
8. Ordinary self-registration for ages 12–15 and all public enrollment remain blocked.

## Remaining Phase 21 work

Phase 21 should close the remaining owner-supplied and external-review gates before any launch work:

1. Confirm the final legal-controller wording for the unregistered initiative and decide whether Tamerat will serve as the first safeguarding contact; choose a trusted backup before accounts open for ages 12–15.
2. Obtain real Ethiopian privacy/legal and safeguarding review and complete the approval record without inventing sign-off.
3. Produce the final learner privacy notice and age-appropriate consent flow from those approved decisions.
4. Manually review App Check metrics for Firestore and Authentication, name a rollback owner, and test development Firestore enforcement only if the evidence supports it.
5. Run browser accessibility and responsive QA for every learner privacy state and administrator queue state.
6. Keep automatic retention, billing, file uploads, public enrollment, production deployment, and the Admin Studio off public Hosting until separately approved.

## Phase 22 status

The technical safe-preview boundary is complete; final owner-session confirmation and password rotation remain:

1. Public builds now default to read-only preview mode.
2. The preview visibly closes join, sign-in, account, and protected learning routes.
3. The preview build uses an isolated environment directory and contains none of the local Firebase project or App Check values.
4. Local testing has a dedicated owner-only setup route for `efbi.academy@gmail.com`; it creates no learner profile and opens no enrollment.
5. Learner profile creation now requires a public enrollment setting that fails closed when missing.
6. Only a verified administrator can change the server enrollment setting.
7. Admin Studio has a separate Enrollment workspace with typed confirmation before opening.
8. Learner and Admin Studio lint and preview/production builds pass.
9. Seventy-three Firestore authorization and lifecycle tests pass.
10. The Phase 22 development preview responds successfully on all primary routes.
11. The real owner Authentication account exists, its email is verified, and the exact account has the server-issued `admin` role. A fresh Admin Studio sign-in still requires the owner’s private password action.
12. No custom-domain change or public enrollment was performed.

See `SAFE_PREVIEW.md` and `LAUNCH_ROADMAP.md`.

## Phase 23 status

The first multi-course security checkpoint is complete in the development codebase:

1. Immutable `courseVersions` records hold a reviewed course title, version, assessment mode, and ordered lesson IDs.
2. A narrow `activeCourses` pointer determines which immutable version a new learner starts.
3. New progress records lock to one course version and may advance only one approved lesson at a time.
4. Activating a newer course version does not rewrite or block progress already locked to an older version.
5. The original AI Foundations progress schema remains accepted so existing pilot records are not silently migrated or broken.
6. Course versions support 1–12 unique lessons and either practice-only or project assessment at this checkpoint.
7. Emulator tests prove that two unrelated synthetic courses cannot exchange versions or lessons, skip lesson order, expose another learner’s progress, or start from an inactive version.
8. Seventy-six Firestore authorization and lifecycle tests pass. Learner lint and the production build also pass.
9. No development or production rules were deployed, no synthetic record left the emulator, and enrollment remains closed.

Remaining Phase 23 work: migrate learner catalog and routes, then generalize submissions, reviews, certificates, and deletion inventory while retaining the tested pilot compatibility path.


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
