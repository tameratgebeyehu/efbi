# EFBI data protection impact assessment — initial draft

Status: **incomplete; owner verification and external privacy/safeguarding review required**

Version: `efbi-dpia-draft-v1`
Prepared: 2026-09-12
Accountable owner: Tamerat Gebeyehu, CEO and Founder
Privacy contact: efbi.academy@gmail.com

## Scope and purpose

This assessment covers the planned EFBI Academy learner website, Firebase Authentication, Cloud Firestore, the localhost-only Admin Studio, YouTube lesson embeds, project evidence links, reviews, certificate verification, audit records, and deletion workflow.

It does not approve public enrollment, production deployment, file uploads, paid automation, or ordinary self-registration for learners under 16.

## People and information

People include prospective learners, learners under 16, learners aged 16 or older, parents/guardians/tutors, reviewers, administrators, and people verifying a certificate.

Current or planned information includes account name and email; age band and guardian authorization evidence after approval; progress; project text and HTTPS evidence links; review results and private concern notes; public certificate name and status; role, security, consent, audit, retention, and deletion records.

The pilot should not request a full birth date, government ID, phone number, home address, health data, payment data, or uploaded documents unless a later assessment proves the item necessary and proportionate.

## Data flow summary

1. Firebase Authentication handles email/password identity and verification.
2. Firestore stores the minimum profile and learning records under a Firebase UID.
3. Published lessons may display YouTube-hosted video.
4. Learners may submit structured text and up to three HTTPS evidence links; reviewers see only assigned submitted work.
5. Administrators use a localhost-only Studio protected by verified server-issued roles.
6. A certificate name becomes public only after a separate learner choice and administrator issuance.
7. Learners may request deletion; holds, completion, certificate exceptions, and Authentication removal are controlled and audited.

## Necessity and proportionality — preliminary view

- Account identity is necessary to save private progress and separate learners.
- Email verification helps prevent mistaken or impersonated accounts.
- Course progress is limited to fixed learning state rather than detailed behavior tracking.
- Structured project text and links avoid unnecessary file storage.
- Private review notes support limited integrity and safeguarding handling but create confidentiality risk.
- Public certificate fields are minimized and require a separate choice.
- Audit and deletion evidence support security and accountability but require approved retention periods.
- Age band may be necessary to route under-16 authorization; a full birth date is not presently shown to be necessary.

The reviewer must confirm each conclusion and the lawful basis; this draft does not make the legal determination.

## Preliminary risk register

### Risk 1 — under-16 account created without valid authorization

Potential harm: unlawful processing, loss of control, unsafe contact, or disclosure affecting a child.
Current control: public enrollment is off; planned ordinary under-16 self-registration is blocked.
Required action: approve reasonable age and guardian checks, versioned authorization evidence, withdrawal, and safeguarding escalation.
Residual status: high and launch-blocking.

### Risk 2 — excessive identity collection during guardian checks

Potential harm: identity-document exposure or unnecessary family information.
Current control: no date of birth or identity document is collected by the current profile.
Required action: choose the least intrusive verification method and define immediate deletion for any temporary evidence.
Residual status: high until reviewed.

### Risk 3 — sensitive details entered in projects or evidence links

Potential harm: disclosure to reviewers or external link providers.
Current control: structured text, a maximum of three HTTPS links, learner warnings, assignment-scoped reviewer access, and no uploads.
Required action: add age-appropriate warnings, reviewer redaction/escalation procedure, link-safety guidance, and retention approval.
Residual status: medium-high.

### Risk 4 — private reviewer notes disclosed to learners or the public

Potential harm: stigma, allegations, safety disclosure, or reviewer exposure.
Current control: private and learner-safe review records are separated; Firestore rules restrict private records; lifecycle tests cover cross-role denial.
Required action: approve note-writing guidance, access reviews, incident handling, and deletion/retention periods.
Residual status: medium.

### Risk 5 — public certificate name reveals more than the learner expected

Potential harm: unwanted discoverability, especially for a child.
Current control: separate public-name choice; exact credential-ID lookup; minimized public fields; projects, scores, email, UID, and reviewer details remain private.
Required action: approve withdrawal/correction handling, under-16 authorization, retention, and clear preview before publication.
Residual status: high for under-16 learners; medium for others.

### Risk 6 — administrator or reviewer account compromise

Potential harm: unauthorized reading, changes, issuance, or deletion.
Current control: separate localhost Studio, server-issued roles, email verification, strict Firestore rules, immutable releases and audits, App Check monitoring, no service-account key in browser code.
Required action: approve strong operator account practices, access review schedule, rapid role removal, incident owner, and App Check enforcement only after metric review.
Residual status: medium-high.

### Risk 7 — incomplete deletion across Firestore and Authentication

Potential harm: learner reasonably believes the account is gone while sign-in remains.
Current control: atomic Firestore deletion, protected certificate exception, explicit pending status, exact-UID manual Authentication step, immutable confirmation, and 72 passing authorization/lifecycle tests.
Required action: approve processor deletion steps, operational ownership, and safe scheduled executor before automation.
Residual status: medium while manual.

### Risk 8 — international processing is not understood or disclosed

Potential harm: data is handled in another jurisdiction without adequate information or safeguards.
Current control: Firebase development region is recorded; providers are named in the draft notice; public enrollment is off.
Required action: complete provider and transfer assessment for Google/Firebase, YouTube, and email and determine whether authority consultation/authorization is required.
Residual status: high and launch-blocking.

### Risk 9 — YouTube or evidence links expose identifiers or browsing data

Potential harm: third-party tracking, discoverable video IDs, or learner navigation to unsafe content.
Current control: the architecture acknowledges that unlisted YouTube is not private; no claim of website-only video access is made.
Required action: review privacy-enhanced embed configuration, consent/notice wording, safe-link policy, transcript alternative, and low-bandwidth option.
Residual status: medium-high.

### Risk 10 — a breach or safeguarding report is handled too slowly

Potential harm: continuing exposure, missed legal deadlines, or harm to a child.
Current control: security boundaries and audit records exist.
Required action: name primary and backup incident/safeguarding contacts; prepare a 72-hour decision workflow, provider contacts, templates, and tabletop exercise.
Residual status: high and launch-blocking.

### Risk 11 — information is kept too long or a hold is misused

Potential harm: unnecessary exposure or denial of deletion rights.
Current control: provisional schedule, 14-day internal request target, 30-day hold reviews, narrow private reasons, audited transitions, and overdue indicators.
Required action: external approval of each period, hold reason, certificate exception, log retention, and disposal evidence.
Residual status: medium-high.

## Overall preliminary conclusion

The current development controls materially reduce risk, but residual risk remains **high and launch-blocking** because EFBI plans to serve learners under 16, uses providers that may process data outside Ethiopia, has not approved the guardian-verification method, and has not named safeguarding/incident backups or completed external review.

This is an honest development conclusion, not a failure. The system should remain closed to public enrollment while the required actions are completed.

## Review and consultation record

- Owner verification: pending
- Privacy/legal reviewer: pending
- Safeguarding reviewer: pending
- Learner/guardian consultation: pending
- Authority consultation decision: pending professional review
- Residual-risk acceptance: not granted
- Next review trigger: any launch proposal, new data field, under-16 flow, provider/region change, file upload, automated decision, new course assessment, or scheduled deletion service

Primary legal source: https://justice.gov.et/wp-content/uploads/2025/04/seasiisia-seusiNse%C2%A1-1321-2016.pdf
