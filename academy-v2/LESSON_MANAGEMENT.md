# EFBI lesson management

Phase 12 adds private lesson draft editing and immutable lesson release publishing inside the localhost Admin Studio. It prepares backend-managed lesson content without changing the current student learning route.

## Current boundary

- Administrators can create, edit, preview, mark ready, and publish lesson drafts.
- Lesson drafts are stored in `lessonDrafts/{lessonId}` and are private to administrators.
- Published lesson snapshots are stored in `lessonReleases/{releaseId}` and cannot be changed or deleted.
- Each accepted save or publication requires a linked immutable `adminAudit` event in the same Firestore batch.
- Verified learners may read lesson releases, but the student app does not consume backend lesson releases yet.
- Reviewers, support accounts, unauthenticated visitors, and learners cannot write lesson drafts or releases.
- The current AI Foundations learner route still uses the version-controlled `src/data.ts` curriculum.

## Lesson fields

- `lessonId`: permanent lowercase slug, 3-64 characters.
- `courseId`: parent course slug.
- `order`: whole number from 1 to 50.
- `title`: 5-100 characters.
- `summary`: 20-240 characters.
- `durationMinutes`: whole number from 5 to 300.
- `videoYoutubeId`: empty or an exact 11-character YouTube ID.
- `bodyMarkdown`: written lesson text, 100-12,000 characters.
- `question1`, `question2`, `question3`: fixed practice-question slots.
- `status`: `draft`, `ready`, or `published`.
- `revision`, `latestReleaseNumber`, `latestReleaseId`, ownership, timestamps, and `lastAuditId`: managed by the Admin Studio and protected by rules.

## Practice questions

Practice questions are deliberately fixed to three slots for this first safe editor. A disabled question must be completely empty. An enabled question needs:

- a prompt from 12 to 240 characters;
- exactly three answer options from 1 to 160 characters each;
- one correct option index from 0 to 2;
- an explanation from 12 to 300 characters.

The student app must keep these checks browser-only. They are not assessment evidence and must not issue certificates.

## Publishing and migration

A lesson can publish only after it is marked `ready` and the administrator confirms the exact preview. Publishing is one atomic Firestore batch: the lesson draft moves to `published`, the release number increases by one, a new immutable `lessonReleases` snapshot is created, and a `lesson.release.published` audit event is created.

Phase 12 does not migrate the public student route. Phase 13 must prove release reading, ordering, progress compatibility, fallback behavior, and rollback safety before learners consume backend lesson releases. Existing learner progress must keep the same meaning after migration.

## Verification

Phase 12 is verified when:

1. all 35 Firestore emulator authorization tests pass;
2. the student and Admin Studio builds pass;
3. both applications lint cleanly;
4. tested Firestore rules deploy only to `efbi-academy-dev-doha`;
5. no Admin Studio code or `/admin` route appears in the student app;
6. no private keys, service-account files, App Check debug tokens, or learner data are tracked.
