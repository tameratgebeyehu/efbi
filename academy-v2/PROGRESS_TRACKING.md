# EFBI learner progress tracking

## Current scope

Phase 5 stores completion for the published AI Foundations lesson. A lesson is completed only when the learner deliberately chooses **Mark lesson complete**. Opening the page, scrolling, or loading a video never marks completion automatically.

The page reads the saved record after every fresh sign-in or refresh. The current course has four planned lessons, so completing Lesson 1 produces 25% progress.

## Firestore path and record

```text
users/{uid}/progress/ai-foundations
  courseId: "ai-foundations"
  completedLessonIds: ["understanding-ai"]
  lastLessonId: "understanding-ai"
  percent: 25
  createdAt: server timestamp
  updatedAt: server timestamp
```

The document path uses the authenticated Firebase UID. The browser does not choose an email address or another learner identifier for this path.

## Security invariants

Firestore rules currently enforce all of these conditions:

- the user is signed in and email verified;
- the path UID equals the authenticated UID;
- the course is exactly `ai-foundations`;
- only the published `understanding-ai` lesson can be completed;
- lesson IDs are unique;
- `lastLessonId` is a completed lesson;
- the only valid percentage is 25%;
- creation and update timestamps use server time;
- `createdAt` cannot be rewritten;
- completed progress cannot be removed; and
- unknown fields are denied.

Administrators can read progress for learner support, but the browser cannot grant itself the administrator claim. Learners cannot read or write another learner's progress.

## Publishing another lesson

The current rules intentionally deny progress for unpublished lessons. When Lesson 2 is ready, update these places in one reviewed checkpoint:

1. Add the lesson to the published list used by `src/learning.tsx`.
2. Add its ID to `publishedLessonIds` in `firestore.rules`.
3. Expand valid percentage logic for 25%, 50%, and later values.
4. Add emulator tests for adding the lesson, preserving older completions, and rejecting skips or resets.
5. Deploy the tested rules to development before enabling the new completion button.

Do not open all planned lesson IDs in the rules before their content and navigation are ready.

## Verification completed

- Nine Firestore emulator authorization tests pass.
- The Doha development rules compile and are deployed.
- A live synthetic learner wrote 25% progress and restored it after a fresh sign-in.
- A forged 100% update was rejected.
- A second synthetic learner could not read or write the first learner's progress.
- Synthetic authentication accounts and progress documents were deleted after testing.

App Check remains in monitoring mode. Authentication and Firestore rules remain the primary authorization controls.