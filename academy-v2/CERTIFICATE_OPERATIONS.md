# EFBI certificate operations

## Phase 23 boundary

Certificates are available for the original AI Foundations pilot and for activated project-assessment courses in the development environment. Practice-only courses do not issue certificates. A certificate is never created by lesson completion or by a review alone.

The required sequence is:

1. The learner's final submitted version receives an immutable approved review.
2. The learner chooses the public certificate name and accepts efbi-certificate-public-v1.
3. An administrator opens the localhost-only Admin Studio and deliberately confirms issuance.
4. Firestore creates the private issuance, public certificate, active status, one-per-course claim, and audit event in one atomic operation.

For an activated course, the request and issuance also remain bound to its immutable course version, assessment version, submitted project, and approved final review. Replacing a certificate cannot change that course proof.

Reviewers, learners, support accounts, and anonymous visitors cannot issue or change credentials.

## Stored records

- users/{uid}/certificateRequests/{courseId} is the learner-owned, immutable name and publication consent for one course.
- certificateIssuances/{credentialId} is the private, immutable evidence binding the credential to the learner, approved review, submitted version, versions, administrator, and issue time.
- certificates/{credentialId} is the immutable public core: learner-approved name, course, issue date, credential ID, and replacement origin.
- certificateStatuses/{credentialId} is the public current state: active, replaced, or revoked.
- certificateClaims/{uid--courseId} identifies the learner's current credential and prevents a second initial issuance.
- certificateAudit/{eventId} is the private, immutable action history.

Public verification never returns email, user ID, project content, score, reviewer identity, private notes, administrator identity, or administrative reason.

## Administrator workflow

1. Run the Admin Studio only at http://127.0.0.1:5174/.
2. Sign in with a verified administrator account.
3. Open **Certificates** and select an eligible learner request.
4. Confirm the public name and the final review binding.
5. Accept the permanent-action confirmation and choose **Issue audited certificate**.
6. Open the public verification link and confirm the ID, name, course, date, and active status.

Do not edit certificate collections manually in Firebase Console during ordinary operation.

## Revocation

Revocation is for a credential that must no longer be accepted. Enter a private reason of at least ten characters and confirm the permanent action. The public status changes to revoked; the original certificate and private issuance remain unchanged.

A revoked credential cannot become active again and cannot be used as the source of a replacement. If a correction is required, replace the credential while it is still active.

## Replacement

Replacement creates a new credential ID and marks the previous active credential as replaced. The old public record points to the new ID, and the new public record identifies the old ID. Both remain verifiable.

The replacement, old-status transition, one-per-course claim update, and audit event must succeed atomically. A replaced credential cannot become active again.

## Verification

Anyone may open /verify and look up one complete ID in the form EFBI-YYYY-XXXXXXXXXXXX. The result is presented as a minimal printable certificate, but the live registry status remains authoritative. The registry cannot be listed or searched by name, and a saved PDF or screenshot is not proof of current status.

## Release boundary

The Phase 23 source and tests do not deploy Hosting or Firestore rules, create real learner records, grant roles, or enable production certificate operations. Deployment remains a separate explicit decision.
