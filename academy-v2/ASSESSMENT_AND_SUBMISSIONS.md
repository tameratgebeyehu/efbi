# EFBI assessment and project-submission boundary

## Current Phase 18 status

The development environment now supports a complete, controlled review cycle for the AI Foundations pilot:

- a verified learner must finish all four lessons before creating one private project draft;
- final submission requires complete structured text, HTTPS evidence, and versioned consent;
- an administrator assigns a submitted version to a reviewer but cannot score it;
- only the assigned reviewer can publish one permanent rubric result;
- a `revision_requested` result unlocks exactly one separate learner revision;
- Version 1 and its first review remain permanently unchanged;
- the revision receives its own assignment and second permanent review;
- the learner sees only scores, decision, and public feedback from each review.

Certificate requests now require the final approved review plus separate learner consent for the public name. Issuance, revocation, and replacement are administrator-only, atomic, and audited. Appeals, file uploads, public enrollment, production review operations, and production deployment remain disabled.

## Submission versions

Both learner records live under `users/{uid}/submissions`:

- `ai-foundations-project` is the original Version 1 submission;
- `ai-foundations-project-revision-1` is the only permitted revision, shown as Version 2.

Drafts are private to the learner. Administrators see only submitted versions, and only the specifically assigned reviewer can read a submitted version. Every submitted version is immutable and cannot be deleted through a browser account.

The revision record adds three protected provenance fields:

- `originalSubmissionId` must be `ai-foundations-project`;
- `revisionNumber` must be `1`;
- `basedOnReviewId` must identify the learner's permanent Version 1 review;
- `originalSubmittedAt` must match the trusted Version 1 submission time;
- `basedOnReviewReviewedAt` must match the trusted first-review time.

Firestore permits creation of this exact revision ID only when the learner owns the record, completed the course, Version 1 is submitted, and the learner-safe Version 1 result is `revision_requested`. Unknown IDs, a second revision number, changed provenance, and extra fields are rejected.

## Consent and evidence

Version 1 requires `efbi-project-consent-v1`. The revision requires a fresh confirmation stored as `efbi-project-revision-consent-v1`. Both use trusted server timestamps.

Evidence remains limited to three public HTTPS links of at most 500 characters each. Reviewers are warned that external links are untrusted. Raw file uploads remain disabled.

This wording still needs local legal and safeguarding review before production use.

## Versioned review records

Each submitted version has an immutable assignment ID formed from the learner ID and that submission's ID. One review action creates two matching records in the same atomic batch:

- `reviewResults/{assignmentId}` stores the assigned reviewer ID, rubric scores, decision, public feedback, private concern category, optional private note, versions, exact submission timestamp, and review timestamp;
- `users/{uid}/reviewResults/{assignmentId}` stores only learner-safe fields: scores, total, decision, public feedback, versions, exact submission timestamp, and review timestamp.

Firestore rejects either record when its matching copy is absent or inconsistent. Learners and unrelated reviewers cannot read the private record. No browser identity can change or delete a published result.

The second review uses the revision assignment ID and exact revision timestamp. It cannot replace, approve, or modify the Version 1 review. A second `revision_requested` decision does not unlock another submission version.

## Rubric version 1

Every criterion is scored 0, 1, or 2:

- **Local problem:** from unclear or invented to specific and supported.
- **Useful solution:** from no working idea to a small, relevant, testable response.
- **Evidence:** from no evidence to credible testing and learning.
- **Safety and responsibility:** from serious unaddressed risk to clear privacy, fairness, and limits.
- **Explanation and reflection:** from copied or missing work to clear, honest, learner-owned reflection.

Approval is allowed only when the total is at least 8/10, Safety and responsibility is at least 1, and the reviewer records no unresolved plagiarism, identity, consent, or safeguarding concern. Every other internally consistent result is `revision_requested`.

Reviewers cannot manually override the calculated decision. Public feedback must contain 40–1,500 characters. Private notes are limited to 2,000 characters and never copied into the learner result.

## Authorization

- **Learner:** manages only an own draft, submits it, reads own immutable versions and learner-safe results, and may create the one revision only after a valid request.
- **Assigned reviewer:** reads only the specifically assigned submitted version and creates its one atomic, permanent review result.
- **Administrator:** reads submitted versions, assigns each version separately, and inspects completed private results, but cannot create or alter a review decision.
- **Support:** receives no submission, assignment, or review access.

Roles come from trusted Firebase custom claims. Neither browser application can grant or change a role.

## Certificate lifecycle

An approved final review lets the learner create one immutable certificate request with an explicitly chosen public name. It does not issue a credential automatically. Only an administrator may issue, revoke, or replace a certificate through the localhost Studio, and each action must include matching immutable audit evidence in the same atomic operation. Public verification reads only the immutable certificate core and current status. See CERTIFICATE_OPERATIONS.md.

## Retention boundary

Automated retention cleanup is not active. Before production enrollment, EFBI must implement a clear draft-deletion request, a 90-day inactive-draft policy, deletion of project and review data after the agreed retention period, investigation holds, and minimal deletion-completion logs that do not preserve project content.

## Phase 18 implementation

All certificate controls ship together in the development environment:

1. Eligibility derives only from the final valid approved review.
2. The learner separately consents to the public certificate name.
3. Issuance creates private evidence, public core, active status, one-per-course claim, and audit history atomically.
4. Public verification exposes only the approved name, course, issue date, credential ID, replacement link, and status.
5. Revocation and replacement preserve original issuance history.
6. Sixty-six role-boundary and lifecycle tests pass.
7. Appeals, file uploads, public enrollment, and production deployment remain disabled.
