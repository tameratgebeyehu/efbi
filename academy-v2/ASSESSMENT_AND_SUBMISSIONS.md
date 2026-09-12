# EFBI assessment and project-submission boundary

## Current Phase 16 status

The development environment now supports controlled human review for the AI Foundations pilot:

- a verified learner must finish all four lessons before creating one private project draft;
- final submission requires complete structured text, HTTPS evidence, and versioned consent;
- the submitted project remains immutable;
- an administrator can assign one verified reviewer but cannot score the work;
- only the assigned reviewer can publish one permanent rubric result;
- the learner sees scores, decision, and public feedback in a separate safe record;
- internal concern categories, private notes, and reviewer identity are never stored in the learner-visible record.

File uploads, revision responses, appeals, certificate eligibility, certificate issuance, public enrollment, and production deployment remain disabled. Course completion and an approved review still do not issue a certificate.

## Submission record

The learner-owned path is `users/{uid}/submissions/ai-foundations-project`. It contains the project text, up to three HTTPS evidence links, consent version, status, course and assessment versions, and trusted timestamps. Drafts are private to the learner. Administrators see only submitted work, and only the specifically assigned reviewer can read a final submission.

The original submission cannot be edited or deleted through a browser account after submission.

## Versioned review records

One review action creates two matching records in the same atomic batch:

- `reviewResults/{assignmentId}` stores the assigned reviewer ID, rubric scores, decision, public feedback, private concern category, optional private note, versions, exact submission timestamp, and review timestamp;
- `users/{uid}/reviewResults/{assignmentId}` stores only learner-safe fields: rubric scores, total, decision, public feedback, versions, exact submission timestamp, and review timestamp.

Firestore rejects either record when its matching copy is absent or inconsistent. Both are immutable. Learners and unrelated reviewers cannot read the private record, and no browser identity can change or delete a published result.

## Rubric version 1

| Criterion | 0 | 1 | 2 |
| --- | --- | --- | --- |
| Local problem | unclear or invented | partly explained | specific and supported |
| Useful solution | no working idea | limited or incomplete | small, relevant, and testable |
| Evidence | none | weak or unclear | credible test evidence and learning |
| Safety and responsibility | serious unaddressed risk | some safeguards | privacy, fairness, and limits addressed |
| Explanation and reflection | copied or missing | basic | clear, honest, and learner-owned |

The system calculates the total from the five scores. It permits **approved** only when the total is at least 8/10, Safety and responsibility is at least 1, and the reviewer records no unresolved plagiarism, identity, consent, or safeguarding concern. Every other internally consistent result becomes **revision requested**.

Reviewers cannot manually override the calculated decision. Public feedback must contain 40–1,500 characters. Private notes are limited to 2,000 characters and never copied into the learner result.

## Revision boundary

Phase 16 supports one immutable `revision_requested` decision and shows its feedback to the learner. It does not yet let the learner overwrite the original submission or upload a revised copy. A later phase must create a separate versioned revision, preserve the original evidence, limit the learner to one response, and bind any second review to that exact revision.

## Authorization

- **Learner:** manages only an own draft, submits it, reads the immutable submission and learner-safe result, and cannot access private review fields.
- **Assigned reviewer:** reads only the assigned final project and creates its one atomic, permanent review result.
- **Administrator:** assigns a reviewer and reads completed private results for oversight, but cannot create or alter a review decision.
- **Support:** receives no submission, assignment, or review access.

Roles come from trusted Firebase custom claims. Neither browser application can grant or change a role.

## Certificate lock

Certificate creation, updates, and deletion are denied to every browser identity, including administrators. An approved review does not create certificate eligibility. A later administrator-only phase must define eligibility, issuance audit records, revocation, replacement, and public-safe verification before certificate writes reopen.

## Consent and evidence

The learner must accept `efbi-project-consent-v1` before final submission. Evidence remains limited to three public HTTPS links of at most 500 characters each. Reviewers are warned that external links are untrusted. Raw file uploads remain disabled.

This wording still needs local legal and safeguarding review before production use.

## Retention boundary

Automated retention cleanup is not active. Before production enrollment, EFBI must implement a clear draft-deletion request, a 90-day inactive-draft policy, deletion of project and review data after the agreed retention period, investigation holds, and minimal deletion-completion logs that do not preserve project content.

## Phase 17 gate

Do not enable a learner revision response until all of these ship together:

1. Preserve the original submission and result as immutable records.
2. Permit exactly one separate revision only after `revision_requested`.
3. Bind the revision to the original submission, result, learner, course version, and trusted timestamps.
4. Bind a final second review to the same assigned reviewer and exact revision.
5. Keep private concern and safeguarding data outside learner-visible records.
6. Keep appeals, certificates, file uploads, public enrollment, and production deployment disabled until their separate security phases.
