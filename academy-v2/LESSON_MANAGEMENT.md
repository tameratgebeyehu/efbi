# EFBI lesson management

Phase 11 adds private lesson draft editing inside the local Admin Studio. It prepares course content for a future catalog migration without changing the current student learning route.

## Current boundary

- Administrators can create, edit, preview, and mark lesson drafts ready.
- Lesson drafts are stored in `lessonDrafts/{lessonId}` and are private to administrators.
- Each accepted save requires a linked immutable `adminAudit` event in the same Firestore batch.
- Learners, reviewers, support accounts, and unauthenticated visitors cannot read or write lesson drafts.
- No lesson draft is published to learners in this phase.
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
- `status`: `draft` or `ready`.
- `revision`, ownership, timestamps, and `lastAuditId`: managed by the Admin Studio and protected by rules.

## Practice questions

Practice questions are deliberately fixed to three slots for this first safe editor. A disabled question must be completely empty. An enabled question needs:

- a prompt from 12 to 240 characters;
- exactly three answer options from 1 to 160 characters each;
- one correct option index from 0 to 2;
- an explanation from 12 to 300 characters.

The student app must keep these checks browser-only. They are not assessment evidence and must not issue certificates.

## Publishing and migration

Phase 11 does not create public lesson releases. The next phase should define immutable lesson release records, ordering rules, rollback behavior, and a migration plan from the current four hard-coded AI Foundations lessons. Existing learner progress must keep the same meaning after migration.

## Verification

Phase 11 is verified when:

1. all 33 Firestore emulator authorization tests pass;
2. the student and Admin Studio builds pass;
3. both applications lint cleanly;
4. tested Firestore rules deploy only to `efbi-academy-dev-doha`;
5. no Admin Studio code or `/admin` route appears in the student app;
6. no private keys, service-account files, App Check debug tokens, or learner data are tracked.
