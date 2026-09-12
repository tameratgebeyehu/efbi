# EFBI course content versioning

## Purpose

A learner's saved completion must keep the same meaning after EFBI edits a course. Published identifiers are records, not reusable labels.

## Current release boundary

`ai-foundations` is the durable identifier for the current four-lesson pilot. Its published lesson slugs are:

1. `understanding-ai`
2. `prompting-with-purpose`
3. `responsible-use`
4. `build-an-ethiopian-solution`

## Changes allowed without a new identifier

EFBI may correct spelling, improve accessibility, repair a broken link, clarify wording, or update an example when the learning objective and completion requirement stay the same. Record the change in Git.

## Changes that require a new identifier

Create a new lesson slug or course ID when a change:

- replaces or materially expands a learning objective;
- changes what a learner must do to complete the lesson;
- adds a newly required lesson to a course learners already completed;
- changes the final assessment or project requirement; or
- makes earlier completion evidence no longer equivalent.

For a major course revision, create a new ID such as `ai-foundations-v2`. Do not rewrite an existing learner's `ai-foundations` record to the new ID, and do not reuse an old lesson slug for different content.

## Publishing checklist

1. Create or edit the course draft in the local Admin Studio.
2. Review the preview and classify the change as editorial or material.
3. Use a new course ID for a material revision that changes earlier completion meaning.
4. Mark the complete draft ready for review.
5. Confirm the exact preview and publish an immutable release.
6. Preserve old release and progress records and their meaning.
7. Update curriculum data, routes, Firestore rules, tests, and documentation before exposing a new completion action.
8. Record the release decision and Git commit in PROJECT_STATUS.md.

A Phase 10 course publication is an atomic Firestore batch: it advances the draft by exactly one revision, creates the next immutable `courseReleases` snapshot, and creates a linked immutable `adminAudit` event. A partial publication is rejected.`r`n`r`nA Phase 12 lesson publication uses the same safety rule: it advances the lesson draft by exactly one revision, creates the next immutable `lessonReleases` snapshot, and creates a linked immutable `adminAudit` event.`r`n`r`nPhase 13 lets the protected AI Foundations route read compatible release snapshots, but only when they preserve the existing four lesson slugs and order. Incompatible or incomplete backend releases fall back to the version-controlled curriculum, so saved progress is not reinterpreted silently.

## Certificate boundary

Browser knowledge checks are retryable practice and never determine certificate eligibility. A future certificate must reference a reviewed assessment and project workflow with its own durable version. Major changes to that workflow require a new assessment or course version; they must not silently reinterpret earlier approvals.
