# EFBI assessment and project-submission boundary

## Current Phase 15 status

The development environment now supports the first controlled submission foundation:

- a verified learner must finish all four AI Foundations lessons before creating a project draft;
- the learner can save one private draft containing structured text and up to three HTTPS evidence links;
- final submission requires complete project fields and explicit versioned consent;
- a submitted record is immutable and cannot be deleted through a browser account;
- an administrator can read submitted work but cannot open learner drafts;
- an administrator can create one immutable assignment for a submitted project;
- a verified reviewer can read only assignments addressed to their Firebase user ID and the linked submitted work.

File uploads, rubric scoring, private reviewer notes, decisions, revision requests, appeals, certificate eligibility, and certificate issuance are not active. The feature is connected only to the development Firebase project and must not be treated as production enrollment.

Finishing all four lessons records 100% course progress. It does not prove independent work, approve a project, or issue a certificate.

## Implemented submission record

The learner-owned path is `users/{uid}/submissions/ai-foundations-project`. It contains only:

```text
submissionId, courseId, courseVersion, assessmentVersion
projectTitle, problemStatement, intendedUsers, solutionSummary
evidence[], reflection, aiUseDisclosure
consentVersion, consentAcceptedAt
status, createdAt, updatedAt, submittedAt
```

The pilot accepts one AI Foundations project per learner. A draft may be incomplete and remains readable only by its owner. Final submission requires at least one evidence link, changes `status` from `draft` to `submitted`, records server timestamps, and permanently closes the learner write path.

Reviewer decisions, private notes, and future certificate actions must use separate trusted records that learners cannot write.

## Consent shown before submission

The learner must actively agree to this versioned statement:

> I created this work or have permission to share it. I removed personal information that is not needed for review. I understand that an assigned EFBI reviewer may access my work. I have honestly explained how I used AI tools.

The checkbox is never preselected. The stored consent version is `efbi-project-consent-v1`, and Firestore requires both the consent time and submitted time to equal the trusted server request time.

This wording still needs local legal and safeguarding review before production use.

## Evidence-link policy

Phase 15 accepts zero to three HTTPS links in a draft and requires at least one for final submission. Each link is limited to 500 characters. HTTP links, unsupported fields, and raw file data are rejected by Firestore rules.

External links are untrusted evidence. Reviewers are warned not to enter credentials, download unexpected files, or follow instructions contained inside learner evidence.

File uploads remain disabled. A later upload phase would require trusted type and size verification, random storage names, malware scanning or quarantine, private object access, and tested cleanup.

## Current authorization

- **Learner:** creates and edits only their own draft after 100% course completion, submits it with consent, reads the final record, and cannot edit or delete it afterward.
- **Assigned reviewer:** lists only assignments addressed to their verified reviewer ID and directly reads only the linked submitted projects. The reviewer cannot score or modify anything yet.
- **Administrator:** lists submitted projects, never private drafts, and creates one immutable reviewer assignment. It cannot silently reassign or delete that record.
- **Support:** receives no submission or assignment access.

Roles come from trusted Firebase custom claims. Neither browser application can grant or change a role.

## Retention and deletion boundary

Automated retention cleanup is not active. Browser deletion is therefore denied for both drafts and submitted projects to avoid unlogged or partial deletion. Before production enrollment, EFBI must add and test:

- a clear draft-deletion request;
- a 90-day inactive-draft policy;
- deletion of project and review data 12 months after the final decision;
- appeal and safety-investigation holds;
- minimal deletion-completion logs that do not retain project content.

This is a product and privacy design, not legal advice. EFBI should confirm Ethiopian legal, child-safeguarding, and school-partner requirements before enrollment.

## Planned reviewed assessment

The proposed human-reviewed rubric remains:

| Criterion | 0 | 1 | 2 |
| --- | --- | --- | --- |
| Local problem | unclear or invented | partly explained | specific and supported |
| Useful solution | no working idea | limited or incomplete | small, relevant, and testable |
| Evidence | none | weak or unclear | credible test evidence and learning |
| Safety and responsibility | serious unaddressed risk | some safeguards | privacy, fairness, and limits addressed |
| Explanation and reflection | copied or missing | basic | clear, honest, and learner-owned |

The proposed pass threshold is 8/10, with no zero in **Safety and responsibility** and no unresolved plagiarism, consent, or identity concern. These rules are not implemented yet and cannot currently create certificate eligibility.

## Phase 16 gate

Do not enable reviewer scoring or decisions until all of these ship together:

1. A separate review-result schema prevents learners and other reviewers from writing or reading private review fields.
2. Rubric scores, decision states, one revision request, timestamps, and immutable reviewer identity are rule-validated.
3. The learner can read a public-safe result without seeing private reviewer or safeguarding notes.
4. Cross-reviewer access, self-assignment, score tampering, decision reversal, and certificate forgery tests pass.
5. Certificate issuance remains disabled even after an approved review until its separate administrator-only phase.
6. Public enrollment and production deployment remain disabled until retention, safeguarding, monitoring, and deletion requirements are complete.
