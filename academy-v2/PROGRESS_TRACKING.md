# EFBI learner progress tracking

## Current scope

Phase 8 stores sequential completion for all four AI Foundations lessons. A lesson is completed only when the learner deliberately chooses **Mark lesson complete**. Opening a page, scrolling, watching a video, or answering a knowledge check never marks completion automatically.

The base course route resumes the first unfinished lesson after every fresh sign-in or refresh. Lessons 1 through 4 produce 25%, 50%, 75%, and 100% respectively.

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

After Lesson 4:
  courseId: "ai-foundations"
  completedLessonIds: ["understanding-ai", "prompting-with-purpose", "responsible-use", "build-an-ethiopian-solution"]
  lastLessonId: "build-an-ethiopian-solution"
  percent: 100
  createdAt: original server timestamp
  updatedAt: server timestamp
```

The document path uses the authenticated Firebase UID. The browser does not choose an email address or another learner identifier for this path.

## Security invariants

Firestore rules currently enforce all of these conditions:

- the user is signed in and email verified;
- the path UID equals the authenticated UID;
- the course is exactly `ai-foundations`;
- only the four immutable lesson slugs in COURSE_VERSIONING.md are accepted;
- a new progress document must start with Lesson 1 at 25%;
- Lesson 2 can be added only after Lesson 1 and produces exactly 50%;
- Lesson 3 can be added only after Lesson 2 and produces exactly 75%;
- Lesson 4 can be added only after Lesson 3 and produces exactly 100%;
- each update adds exactly one lesson and 25 percentage points;
- lesson IDs are unique and ordered;
- `lastLessonId` matches the newest completed lesson;
- creation and update timestamps use server time;
- `createdAt` cannot be rewritten;
- completed progress cannot be removed; and
- unknown fields are denied.

Administrators can read progress for learner support, but the browser cannot grant itself the administrator claim. Learners cannot read or write another learner's progress.

## Knowledge-check boundary

Lessons 2, 3, and 4 contain low-stakes learning feedback. Answers and scoring run in the browser and are not written to Firestore. A learner can retry without creating a permanent failure record.

Because correct answers are present in the public JavaScript bundle, this check must not determine certificate eligibility. A future certificate assessment needs a separately designed submission and review workflow.

## Completion and certificate boundary

A 100% record means that the four lesson-completion actions were saved in order. It is necessary for a future final assessment, but it is not an assessment result and cannot trigger certificate issuance. The proposed review workflow is defined in ASSESSMENT_AND_SUBMISSIONS.md and remains disabled.

## Verification completed

- Fourteen Firestore emulator authorization tests pass.
- The Doha development rules compile and are deployed.
- A live synthetic learner advanced through 25%, 50%, 75%, and 100%.
- A direct 50%→100% skip was denied; the 100% record restored correctly; and a rollback to 75% was denied.
- A second synthetic learner could not read or write the first learner's progress.
- The synthetic progress record and both authentication accounts were deleted after testing.

App Check remains in monitoring mode. Authentication and Firestore rules remain the primary authorization controls.