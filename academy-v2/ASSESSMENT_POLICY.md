# EFBI launch assessment and certificate policy

Updated: 2026-09-13

## Supported completion paths

Every activated course version chooses exactly one immutable completion path.

### Lessons and practice

- The learner completes the published lessons.
- Practice questions are checked only in the learner's browser.
- Answers and scores are not saved to Firestore.
- Practice results do not decide course completion or certificate eligibility.
- This path does not include a final submission, human review, or certificate.

Use this for short introductory or guidance courses where lesson completion is the intended outcome.

### Lessons and reviewed final project

- The learner completes every lesson in the exact activated course version they started.
- The learner saves a private project draft and deliberately submits one permanent version.
- An administrator assigns an independent reviewer.
- The reviewer uses EFBI rubric version 1 and publishes separate private and learner-safe results.
- Approval requires at least 8/10, at least 1/2 for safety and responsibility, and no unresolved internal concern.
- A revision request unlocks one final revision. Both submissions and both review results remain permanent.
- After approval, the learner separately chooses the public certificate name and requests a certificate.
- Only an administrator can issue the atomic, auditable, publicly verifiable certificate package.

Use this only when the course has a clear project brief, suitable human reviewers, and enough capacity to review submissions fairly.

## No final-exam pathway at first launch

EFBI will not use a scored final exam for the first public release. A trustworthy exam would require reviewed question banks, secure grading, retake rules, accessibility checks, integrity controls, versioned pass criteria, correction handling, and a defined appeal route. Browser-only practice questions are deliberately not reused as certificate evidence.

A future exam must be designed and security-tested as a separate assessment type. It must not be simulated by changing a practice-only course label.

## Version rules

- Activation locks the course release, ordered lesson releases, completion path, and assessment version together.
- Existing learners stay on the version they started when a newer version is activated.
- Increment the project-instructions version only when the assessed instructions or evidence expectations change.
- Rubric version 1 remains fixed for the first launch. A future rubric requires new rules, reviewer guidance, tests, and a new version.
- Never rewrite a published course version, assignment, submission, result, issuance, or certificate history.

## Certificate eligibility

A certificate is available only when all of these are true:

1. The course version uses the reviewed-final-project path.
2. Every required lesson is complete for that version.
3. The final submitted project is bound to the same course and assessment version.
4. The assigned review is approved under the fixed rubric.
5. The learner deliberately requests a certificate and approves the public name.
6. An authorized administrator checks and issues the credential.

Course completion, project approval, certificate request, and certificate issuance are separate states. None silently creates the next.

## First-launch appeal decision

EFBI will not offer a separate assessment appeal process in the first public release. The one-revision pathway is the learning-feedback mechanism. Learners may still contact EFBI about a technical error, wrong identity binding, unsafe review content, or certificate mistake; correcting an operational error does not allow an immutable review result to be secretly rewritten.

A formal appeal process may be added later only after reviewer capacity, decision authority, response time, evidence handling, and certificate effects are defined and tested.

## Owner checklist before activating a course

1. Decide whether the course is learning-only or has a reviewed final project.
2. If it has a project, verify the brief, evidence expectations, reviewer capacity, and assessment version.
3. Preview the course and every ordered lesson.
4. Confirm the learner-facing course label matches the chosen completion path.
5. Activate the immutable version only after the complete release set is ready.
6. Never promise a certificate for a learning-only course.
