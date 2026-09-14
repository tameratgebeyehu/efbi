# EFBI Academy roadmap to launch

Updated: 2026-09-13

## Current position

Phases 0–24 and Phase 26 are complete in the development codebase. Phase 25 remains gated by external decisions, and Phase 27 is in progress. Phase 21's external privacy and safeguarding review remains a launch gate.

The rebuilt source code is backed up on GitHub, but `www.efbi.site` still serves the maintenance site. The rebuilt academy has a separate development Hosting target at `https://efbi-academy-dev-doha.web.app`; it must not be published there with open enrollment until the preview safety switch exists.

The localhost Admin Studio can manage program, course, lesson, and article drafts; flexible browser-only practice checks; full owner previews; immutable releases; audited publication and course activation; multi-course project reviews and certificates; audit records; and deletion requests. Published program and article snapshots drive their public pages with safe built-in fallbacks. Verified learners can browse complete activated courses, continue a progress-locked version, submit eligible projects, request certificates, and verify issued credentials.

## Phase 22 — owner access and safe preview controls

1. Create and verify the owner Firebase account without sharing its password.
2. Grant that exact account the server-issued `admin` role and confirm Admin Studio access at `127.0.0.1:5174`.
3. Add an explicit public-enrollment switch that defaults to closed.
4. Add separate states for private local testing, public read-only preview, and later enrollment.
5. Build and deploy a read-only preview to the development `web.app` address; keep Admin Studio localhost-only.

Exit check: the owner can use Admin Studio, anonymous visitors cannot create accounts in preview, and the current maintenance domain is unchanged.

## Phase 23 — multi-course data foundation

1. Replace hard-coded `ai-foundations` learner routes and catalog loading with published course IDs.
2. Support a controlled number of lessons and practice questions per published course.
3. Generalize progress, submissions, reviews, certificate claims, and deletion inventory without weakening authorization.
4. Add migration/version rules so existing AI Foundations records remain valid.
5. Expand emulator tests for two unrelated courses and cross-course attacks.

Exit check: two synthetic courses can complete the full lifecycle without reading or changing each other's records.

## Phase 24 — complete content operations

1. Connect published course and lesson releases to the public catalog and learner routes.
2. Improve the question editor beyond the current three fixed practice slots where the approved course model requires it.
3. Add structured program/category management. **Complete in the development codebase.**
4. Add blog draft, preview, publish, unpublish, and revision controls. **Complete in the development codebase.**
5. Add safe preview controls so the owner checks content before publication. **Complete in the development codebase.**
6. Keep media as validated YouTube IDs and safe HTTPS links; do not add file uploads yet. **Complete in the development codebase.**

Exit check: the owner can create, review, preview, publish, and correct all launch content without editing source files.

Development exit check met. Launch content entry and final quality review remain Phase 27 work.

## Phase 25 — age, privacy, and learner support

1. Block accounts for children under 12. **Complete in the development codebase.**
2. Allow 16+ self-registration only when enrollment is explicitly opened. **Complete in the development codebase.**
3. Build the reviewed parent/guardian route for learners aged 12–15 before their account is created.
4. Add the short privacy notice and separate versioned choices; do not collect a full birth date by default. **Technical first version complete; final external review remains required.**
5. Add clear routes for access, correction, deletion, consent withdrawal, and safety concerns. **Complete in the development codebase; final response procedures remain a launch gate.**
6. Name the first safeguarding contact and choose a trusted backup before ages 12–15 enroll.
7. Finish the incident-response checklist and review the DPIA near launch. **Development checklist and Admin Studio workspace complete; contacts, rehearsal, final DPIA review, and external review remain open.**

Exit check: every age path is understandable, tested, and collects only the minimum information.

Phase 25A development checkpoint complete: the three age paths are explicit, only the 16+ path can create a profile, acknowledgements are versioned, and verified sign-ins without an approved learner profile cannot write learning records. The 12–15 route remains deliberately closed.

Phase 25B development checkpoint complete: one responsive Privacy & Support page explains the limited data model and provides clear access, correction, withdrawal/deletion, and learner-safety routes. The protected deletion workflow is available only to the signed-in learner. Other requests use the official EFBI inbox without creating another sensitive-message database.

Phase 25C development checkpoint complete: Admin Studio shows safeguarding ownership, unresolved launch gates, incident priorities, an ordered response checklist, and the minimum incident record. It deliberately leaves the safeguarding lead and trusted backup unassigned.

## Phase 26 — assessments and certificates across courses — complete in development

1. Define which courses use practice questions only and which require a final project or exam. **Complete for launch: practice-only or reviewed project; final exams deferred.**
2. Generalize reviewer assignment, one-revision policy, scoring, and certificate eligibility by course version. **Complete in the development codebase.**
3. Add administrator views for pending reviews and certificate requests across courses. **Complete in the development codebase, including workload counts and course, status, and text filters.**
4. Verify revocation, replacement, deletion exceptions, and public lookup for multiple courses.
5. Decide whether appeals are required for the first public release; otherwise label them as a later feature. **Complete: no separate appeal at first launch; one revision and operational-error support remain.**

Exit check: a synthetic learner completes each launch assessment type and receives only an administrator-issued, verifiable certificate.

Phase 26A development checkpoint complete: course activation and learner pages now distinguish learning-only courses from reviewed-project certificate pathways. Browser practice remains non-certificate activity, final exams are deferred, and outdated review/certificate wording is corrected.

Phase 26B development checkpoint complete: protected review and certificate workspaces now show multi-course workload summaries and responsive filters. Administrators and reviewers can narrow queues without changing permanent records or weakening role boundaries.

Phase 26C exit check complete: an isolated synthetic learner completed both supported course paths. The learning-only course rejected project submission and certificate creation, while the reviewed-project course completed human review, learner request, administrator issuance, and anonymous public verification. All ninety-five authorization and lifecycle tests pass.

## Phase 27 — launch content, quality, and security

1. Enter the real launch courses, lessons, questions, videos, notes, links, programs, and articles through Admin Studio.
2. Test every page on phone, tablet, and desktop, including keyboard and screen-reader basics.
3. Test slow connections, interrupted saves, video failure, email verification, password reset, and deletion.
4. Review App Check metrics, authorized domains, operator roles, Firebase quotas, recovery, and incident contacts.
5. Run the full build, lint, emulator security suite, browser checks, and a clean synthetic end-to-end exercise.
6. Remove placeholder and “coming soon” content that should not appear at launch.

Exit check: there are no critical accessibility, security, content, or account-flow failures.

Phase 27A development checkpoint complete: Admin Studio now includes a protected, read-only Launch readiness workspace. It inventories public programs and articles, active courses and referenced lessons, validates active course-version-release links, flags likely placeholder text, counts unfinished private drafts separately, and keeps device, accessibility, failure, account, Firebase, and security checks visibly open for human evidence.

Phase 27B development checkpoint complete: the learner site no longer presents unpublished article drafts as content, its fallback catalog matches the four approved program areas, and enrollment-enabled builds use only program records actually published through Admin Studio. Preview/rebuild messages now follow the real site mode, stale duplicate access-page code is removed, and empty program or article collections produce honest public states.

Phase 27C development checkpoint complete: every newly activated course now receives an atomic, read-only public catalog record. Signed-out visitors can discover activated courses and inspect a safe lesson outline before creating an account, while lesson text, videos, questions, answers, learner data, administrator identity, and internal audit references remain private. The Launch readiness workspace flags active versions that predate or do not match this public record. All ninety-six Firestore authorization and lifecycle tests pass, along with both application lint and production builds. Existing active versions created before this checkpoint require a newly reviewed version and activation before launch. Nothing was deployed.

Phase 27D automated checkpoint complete: a dependency-free local Chromium launch check exercises nineteen public, closed-account, protected-redirect, and not-found routes at phone, tablet, and desktop widths. All fifty-eight checks pass. The suite validates rendered landmarks, headings, labels, image alternatives, duplicate IDs, horizontal overflow, browser errors, the skip link, closed-preview form boundaries, and the phone navigation state. It found and corrected a skipped heading level on the Programs page. Learner lint and the exact read-only production build pass. Human visual, keyboard, screen-reader, touch, and real-device confirmation remains required. Nothing was deployed.

Phase 27E automated checkpoint complete: an emulator-only Chromium journey creates a synthetic 16+ learner through the real enrollment form, confirms the private profile and unverified boundary, completes the local email-verification action, opens a protected lesson, checks its landmark structure, deliberately blocks YouTube, preserves the written lesson with a retry path, signs out, requests a privacy-safe password reset, and signs back in. It removes all synthetic records and temporary processes afterward. Admin Studio now honors the same emulator switch as the learner app, preventing local Studio tests from reaching production services. All fifty-eight public browser checks, all ninety-six Firestore tests, and both applications' lint and production builds pass. Manual editor power-loss recovery, learner deletion UI, human accessibility/device checks, production Firebase review, real content approval, and final security review remain open. Nothing was deployed.

Phase 27F automated checkpoint complete: the synthetic learner now exercises deletion request, cancellation, and reopening. A second emulator-only journey gives a verified test operator a server-issued administrator claim, enters unsaved text into all four content editors, reloads after every edit, and restores the exact values. It also completes a synthetic learner's eligible Firestore deletion, removes the exact Authentication identity, and records the permanent confirmation through Admin Studio. The retention workspace's nested main landmark was corrected. A concise manual release checklist now covers the real-device, keyboard, screen-reader, connection, real-inbox, Firebase-operations, and evidence checks that automation cannot approve. The production dependency audit is clean; ten moderate development-only advisories remain inherited from the Firebase CLI/emulator toolchain because npm's forced repair would install a breaking older CLI. Nothing was deployed.

Phase 27G automated checkpoint complete: a read-only cloud preflight found and corrected the development project's open enrollment switch and missing localhost Authentication domain through a confirmation-gated utility that can only move the project toward the safer preview state. The verified cloud boundary now has closed enrollment, password-required email sign-in, three approved development domains, and one verified administrator with no extra operator role. Cloud content readiness remains blocked because nothing has been published. Hosting source adds a restrictive security-header policy, and a build check prevents local Firebase identity and the App Check debug token from entering the public preview. A source-security gate corrected remaining nested Admin Studio landmarks and makes opener protection explicit. The current hosted development preview remains safely closed but is stale, so it is not approved as the final candidate. Human device/accessibility checks, Console metrics and recovery review, real content, and independent security review remain open. Nothing was deployed.

Phase 27H content checkpoint complete in source: a versioned pack contains four programs, the current 90-minute AI for Ethiopia course, four written modules, twelve practice questions, and one founder article. The four owner-supplied public EFBI YouTube videos are bound in their verified order while Modules 5–12 remain unpublished future work. A protected Admin Studio workspace imports only missing private drafts, requires explicit owner acknowledgement, creates one immutable audit event per draft, and cannot overwrite or publish anything. Emulator verification creates the exact ten-draft and ten-audit inventory, checks the four video IDs and module order, and keeps every public release and catalog collection empty. The owner still needs to import, watch, preview, edit, approve, publish, and activate the content in the development project. Nothing was deployed.

Phase 27I launch-rehearsal checkpoint complete in source: an isolated Firebase-emulator journey now mirrors the exact four-module launch release and proves the complete public-to-learner flow. A signed-out visitor receives four safe outlines without lesson bodies or answers; a verified synthetic learner then loads each exact privacy-enhanced video only after consent, retains written learning during a blocked-video failure, scores 3/3 on all twelve practice questions, and saves authoritative versioned progress at 25%, 50%, 75%, and 100%. A stale post-verification token defect was corrected. Public course copy now follows the reviewed catalog and consistently labels the course learning-only with no certificate. All 58 responsive browser checks and 96 rule tests pass with lint, build, source-security, and Hosting checks. Real development-cloud import, human content approval, publication, activation, device/accessibility review, Console review, and final security approval remain open. Nothing was deployed.

Phase 27J development-cloud import complete: the exact tested Firestore rules were deployed after all 96 authorization tests passed. The owner then imported all ten source-matched launch records through localhost Admin Studio with approved-owner attribution and linked audit history. Eight remain untouched private drafts, Artificial Intelligence remains private after two owner saves, and the founder article was intentionally published by the owner as version one. Enrollment remains closed, no course or lessons are released or active, and no Hosting target or domain was changed.

Phase 27K responsive Admin Studio checkpoint complete in source: the desktop section list now scrolls independently while owner and sign-out controls remain reachable. Zoomed, tablet, and phone layouts use an accessible collapsible menu instead of hiding later sections in a horizontal strip. An authenticated emulator browser verifies all fourteen menu items at 1152×650, 800×700, and 375×700, including Escape behavior, the final Privacy & retention item, visible operator controls, and no horizontal page overflow. The existing draft-import, editor-recovery, and deletion journeys remain green. Human visual, touch, zoom, and screen-reader confirmation remains open. Nothing was deployed.

Phase 27L lesson-video checkpoint complete in source: all four videos remain consent-gated and privacy-enhanced with no autoplay. Native YouTube keyboard controls are explicitly enabled and explained, browser-tab hiding sends only a pause command, and unnecessary sharing and clipboard permissions are removed. YouTube-controlled branding and links remain unobscured because its current documented branding parameter is deprecated and its policy forbids covering player controls. The exact four-module emulator journey, public browser suite, source-security scan, preview build, and Hosting checks pass. Human playback, captions, keyboard, full-screen, and slow-connection confirmation remains open. Nothing was deployed.

## Phase 28 — controlled internet launch

1. Deploy the tested build to development Hosting with enrollment still closed.
2. Verify routes, headers, Firebase connections, certificate lookup, and mobile behavior over the internet.
3. Create or select the production Firebase project and repeat security configuration separately.
4. Connect the chosen production site to `www.efbi.site` only after a rollback copy of the maintenance site exists.
5. Open enrollment first to a small invited pilot, monitor errors and privacy requests, then expand deliberately.
6. Keep Admin Studio on the owner's computer; never publish it at `/admin` or another public URL.

Exit check: the custom domain serves the tested academy, the owner can roll back, and only approved enrollment paths are active.

## Optional work after launch

- File uploads, if a secure paid storage and malware-checking design is approved
- Appeals beyond the current one-revision assessment flow
- Automated retention execution when billing and a trusted server environment are approved
- Advanced analytics using anonymous/minimized events
- Additional languages and offline lesson packages

These optional features are not required to launch a strong free educational platform.
