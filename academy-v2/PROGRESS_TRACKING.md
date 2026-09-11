# EFBI learner progress tracking

## Current scope

Phase 7 stores sequential completion for the first three AI Foundations lessons. A lesson is completed only when the learner deliberately chooses **Mark lesson complete**. Opening a page, scrolling, watching a video, or answering a knowledge check never marks completion automatically.

The base course route resumes the first unfinished published lesson after every fresh sign-in or refresh. The course has four planned lessons, so Lessons 1, 2, and 3 produce 25%, 50%, and 75% respectively.

## Firestore path and records

```text
users/{uid}/progress/ai-foundations

After Lesson 1:
  courseId: "ai-foundations"
  completedLessonIds: ["understanding-ai"]
  lastLessonId: "understanding-ai"
  percent: 25
  createdAt: server timestamp
  updatedAt: server timestamp

After Lesson 2:
  courseId: "ai-foundations"
  completedLessonIds: ["understanding-ai", "prompting-with-purpose"]
  lastLessonId: "prompting-with-purpose"
  percent: 50
  createdAt: original server timestamp
  updatedAt: server timestamp

After Lesson 3:
  courseId: "ai-foundations"
  completedLessonIds: ["understanding-ai", "prompting-with-purpose", "responsible-use"]
  lastLessonId: "responsible-use"
  percent: 75
  createdAt: original server timestamp
  updatedAt: server timestamp
```

The document path uses the authenticated Firebase UID. The browser does not choose an email address or another learner identifier for this path.

## Security invariants

Firestore rules currently enforce all of these conditions:

- the user is signed in and email verified;
- the path UID equals the authenticated UID;
- the course is exactly `ai-foundations`;
- only `understanding-ai`, `prompting-with-purpose`, and `responsible-use` are published;
- a new progress document must start with Lesson 1 at 25%;
- Lesson 2 can be added only after Lesson 1 and produces exactly 50%;
- Lesson 3 can be added only after Lesson 2 and produces exactly 75%;
- each update adds exactly one lesson and 25 percentage points;
- lesson IDs are unique and ordered;
- `lastLessonId` matches the newest completed lesson;
- creation and update timestamps use server time;
- `createdAt` cannot be rewritten;
- completed progress cannot be removed; and
- unknown fields are denied.

Administrators can read progress for learner support, but the browser cannot grant itself the administrator claim. Learners cannot read or write another learner's progress.

## Knowledge-check boundary

Lessons 2 and 3 contain low-stakes learning feedback. Answers and scoring run in the browser and are not written to Firestore. A learner can retry without creating a permanent failure record.

Because correct answers are present in the public JavaScript bundle, this check must not determine certificate eligibility. A future certificate assessment needs a separately designed submission and review workflow.

## Publishing another lesson

The current rules intentionally deny progress for unpublished lessons. When Lesson 4 is ready, update these places in one reviewed checkpoint:

1. Add the lesson to the published list used by `src/learning.tsx`.
2. Add its ID and exact ordered state to `validProgress` in `firestore.rules`.
3. Add the valid 100% transition while preserving 25%, 50%, and 75% records.
4. Add emulator tests for 75→100%, skipped lessons, resets, and cross-user access.
5. Deploy the tested rules to development before enabling the new completion button.

Do not open all planned lesson IDs in the rules before their content and navigation are ready.

## Verification completed

- Twelve Firestore emulator authorization tests pass.
- The Doha development rules compile and are deployed.
- A live synthetic learner saved 25%, was denied a direct skip to 75%, and then advanced through 50% to 75%.
- The 75% record restored correctly and a rollback to 50% was denied.
- A second synthetic learner could not read or write the first learner's progress.
- The synthetic progress record and both authentication accounts were deleted after testing.

App Check remains in monitoring mode. Authentication and Firestore rules remain the primary authorization controls.