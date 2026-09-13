# EFBI lesson management

Phase 12 introduced private lesson authoring and immutable releases. Phase 24 replaces the fixed-slot editor with a flexible question list while preserving every existing release.

## Current boundary

- Administrators can create, edit, preview, mark ready, and publish lesson drafts.
- Lesson drafts are stored in `lessonDrafts/{lessonId}` and are private to administrators.
- Published lesson snapshots are stored in `lessonReleases/{releaseId}` and cannot be changed or deleted.
- Each accepted save or publication requires a linked immutable `adminAudit` event in the same Firestore batch.
- Verified learners may read lesson releases, and the protected AI Foundations route can consume compatible releases with a safe fallback.
- Reviewers, support accounts, unauthenticated visitors, and learners cannot write lesson drafts or releases.
- Activated courses use their matching immutable lesson releases. The original AI Foundations route still has its version-controlled fallback when a backend release is missing or incompatible.

## Lesson fields

- `lessonId`: permanent lowercase slug, 3-64 characters.
- `courseId`: parent course slug.
- `order`: whole number from 1 to 50.
- `title`: 5-100 characters.
- `summary`: 20-240 characters.
- `durationMinutes`: whole number from 5 to 300.
- `videoYoutubeId`: empty or an exact 11-character YouTube ID.
- `bodyMarkdown`: written lesson text, 100-12,000 characters.
- `questions`: an ordered list containing zero to three practice questions.
- `status`: `draft`, `ready`, or `published`.
- `revision`, `latestReleaseNumber`, `latestReleaseId`, ownership, timestamps, and `lastAuditId`: managed by the Admin Studio and protected by rules.

## Practice questions

The owner can add, remove, and reorder up to three practice questions. Each question needs:

- a prompt from 12 to 240 characters;
- exactly three answer options from 1 to 160 characters each;
- one correct option index from 0 to 2;
- an explanation from 12 to 300 characters.

The student app must keep these checks browser-only. They are not assessment evidence and must not issue certificates.

Older drafts and releases with `question1`, `question2`, and `question3` remain valid and readable. Opening an older draft in the Phase 24 editor converts only its enabled questions into the new ordered list on the next deliberate save; immutable releases are never rewritten.

## Publishing and migration

A lesson can publish only after it is marked `ready` and the administrator confirms the exact preview. Publishing is one atomic Firestore batch: the lesson draft moves to `published`, the release number increases by one, a new immutable `lessonReleases` snapshot is created, and a `lesson.release.published` audit event is created.

Publishing keeps the ordered question list inside the immutable lesson release. The learner catalog reads both the list format and the original three-slot format.

## Verification

The current lesson workflow is verified when:

1. the complete Firestore emulator authorization suite passes;
2. the student and Admin Studio builds pass;
3. both applications lint cleanly;
4. deployment remains a separate explicit development-project decision;
5. no Admin Studio code or `/admin` route appears in the student app;
6. no private keys, service-account files, App Check debug tokens, or learner data are tracked.
