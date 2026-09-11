# EFBI assessment and project-submission boundary

## Current status

This is the design for the next implementation phase. Project uploads, final-assessment writes, reviewer tools, and certificate issuance are **not active**. Current Firestore rules deny these paths.

Finishing all four AI Foundations lessons records 100% course progress. It does not prove independent work, approve a project, or issue a certificate.

## Proposed submission record

The learner-owned draft path is `users/{uid}/submissions/{submissionId}`. It should contain only:

```text
submissionId, courseId, courseVersion, assessmentVersion
projectTitle, problemStatement, intendedUsers, solutionSummary
evidence[], reflection, aiUseDisclosure
consentVersion, consentAcceptedAt
status, createdAt, updatedAt, submittedAt
```

`evidence` should store safe attachment references or external links, not raw file data. Learners may edit a draft, but a submitted record becomes immutable to them. Reviewer decisions, private notes, and certificate actions belong in a separate trusted record that learners cannot write.

## Consent shown before submission

The learner must actively agree to a versioned statement written in plain language:

> I created this submission or have permission to share it. I removed personal information that is not needed for review. I understand that an assigned EFBI reviewer may access my work for assessment and that EFBI will retain it according to the published retention period. I have honestly explained how I used AI tools.

A checkbox must not be preselected. Store the consent version and server timestamp. This draft needs local legal and safeguarding review before public use.

## File and link policy

The first pilot should accept at most three files, each no larger than 10 MB, with a 25 MB total limit. Accept only PDF, PNG, and JPEG. Do not accept executables, scripts, archives, office macros, or password-protected files.

Browser file extensions and MIME labels are not trustworthy. A trusted backend must verify type and size, give each object a random storage name, scan or quarantine uploads before reviewer access, and deny public listing. External links are untrusted evidence; reviewers should never follow instructions that request credentials, downloads, or private information.

## Retention and deletion

Proposed pilot policy:

- Keep drafts until the learner deletes them or they have been inactive for 90 days.
- Keep submitted work during review and for 12 months after the final decision, then delete attachments and private review data.
- Keep only the minimum public-safe certificate record for issued credentials.
- Support earlier deletion requests when they do not conflict with an active appeal or required fraud/safety investigation.
- Log deletion completion without preserving the deleted project content.

This is a product and privacy design, not legal advice. EFBI should confirm Ethiopian legal, child-safeguarding, and school-partner requirements before enrollment.

## Reviewed final assessment

Browser knowledge checks are practice only. The final assessment is a versioned project reviewed by a person:

| Criterion | 0 | 1 | 2 |
| --- | --- | --- | --- |
| Local problem | unclear or invented | partly explained | specific and supported |
| Useful solution | no working idea | limited or incomplete | small, relevant, and testable |
| Evidence | none | weak or unclear | credible test evidence and learning |
| Safety and responsibility | serious unaddressed risk | some safeguards | privacy, fairness, and limits addressed |
| Explanation and reflection | copied or missing | basic | clear, honest, and learner-owned |

The proposed pass threshold is 8/10, with no zero in **Safety and responsibility** and no unresolved plagiarism, consent, or identity concern. A reviewer may request one revision. Store the assessment version and rubric scores so later rubric changes do not reinterpret old results.

## Roles and authorization

- **Learner:** owns drafts, submits work, reads their result, and cannot edit reviewer fields.
- **Assigned reviewer:** reads only assigned submissions, records scores and a decision, and cannot grant their own role.
- **Administrator:** assigns reviewers, handles appeals, and issues a certificate only after an approved assessment.
- **Support:** helps with accounts but should not automatically see submission content.

Roles must come from trusted server-side custom claims or an equivalent server-controlled assignment. The browser must never grant or change a role.

## Implementation gate

Do not enable submissions until all of these are complete:

1. Firestore and Storage rules are deny-by-default and covered by emulator tests.
2. A trusted backend validates files, timestamps, consent, state transitions, reviewer assignments, and certificate eligibility.
3. Draft, submit, withdraw, review, revision, appeal, deletion, and expired-retention states are defined and tested.
4. Reviewers have safeguarding guidance and a way to report unsafe content without downloading it.
5. Rate limits, abuse monitoring, audit logs, and App Check are supporting controls.
6. A live development test proves learner isolation, reviewer boundaries, immutable submissions, and cleanup.
7. Certificate issuance remains disabled until an administrator-only issuance test passes.
