# EFBI Academy roadmap to launch

Updated: 2026-09-12

## Current position

Phases 0–20 are complete. Phase 21 has recorded EFBI's owner, contact, unregistered status, minimum age 12, privacy drafts, and initial risk assessment.

The rebuilt source code is backed up on GitHub, but `www.efbi.site` still serves the maintenance site. The rebuilt academy has a separate development Hosting target at `https://efbi-academy-dev-doha.web.app`; it must not be published there with open enrollment until the preview safety switch exists.

The localhost Admin Studio can already manage course drafts, lesson drafts, three practice questions per lesson, releases, project reviews, certificates, audit records, and deletion requests. The verified EFBI owner account now has the server-issued administrator role; the owner still needs to confirm one fresh Admin Studio session and replace the temporary setup password. The protected learner player now accepts validated published course IDs and preserves each learner's original course version. The public catalog/detail experience, activation workflow, assessments, certificates, and deletion workflow still need the remaining multi-course migration.

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
3. Add structured program/category management.
4. Add blog draft, preview, publish, unpublish, and revision controls.
5. Add safe preview links so the owner checks content before publication.
6. Keep media as validated YouTube IDs and safe HTTPS links; do not add file uploads yet.

Exit check: the owner can create, review, preview, publish, and correct all launch content without editing source files.

## Phase 25 — age, privacy, and learner support

1. Block accounts for children under 12.
2. Allow 16+ self-registration only when enrollment is explicitly opened.
3. Build the reviewed parent/guardian route for learners aged 12–15 before their account is created.
4. Add the short privacy notice and separate versioned choices; do not collect a full birth date by default.
5. Add clear routes for access, correction, deletion, consent withdrawal, and safety concerns.
6. Name the first safeguarding contact and choose a trusted backup before ages 12–15 enroll.
7. Finish the incident-response checklist and review the DPIA near launch.

Exit check: every age path is understandable, tested, and collects only the minimum information.

## Phase 26 — assessments and certificates across courses

1. Define which courses use practice questions only and which require a final project or exam.
2. Generalize reviewer assignment, one-revision policy, scoring, and certificate eligibility by course version.
3. Add administrator views for pending reviews and certificate requests across courses.
4. Verify revocation, replacement, deletion exceptions, and public lookup for multiple courses.
5. Decide whether appeals are required for the first public release; otherwise label them as a later feature.

Exit check: a synthetic learner completes each launch assessment type and receives only an administrator-issued, verifiable certificate.

## Phase 27 — launch content, quality, and security

1. Enter the real launch courses, lessons, questions, videos, notes, links, programs, and articles through Admin Studio.
2. Test every page on phone, tablet, and desktop, including keyboard and screen-reader basics.
3. Test slow connections, interrupted saves, video failure, email verification, password reset, and deletion.
4. Review App Check metrics, authorized domains, operator roles, Firebase quotas, recovery, and incident contacts.
5. Run the full build, lint, emulator security suite, browser checks, and a clean synthetic end-to-end exercise.
6. Remove placeholder and “coming soon” content that should not appear at launch.

Exit check: there are no critical accessibility, security, content, or account-flow failures.

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
