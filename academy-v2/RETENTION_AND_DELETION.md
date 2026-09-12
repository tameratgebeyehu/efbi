# EFBI retention and deletion operations

Phase 20 operating policy version: `efbi-retention-v1`

This is a development operating policy, not legal advice. It follows data-minimization, retention-transparency, erasure, and processing-restriction principles in Ethiopia's Personal Data Protection Proclamation No. 1321/2024. A qualified Ethiopian privacy adviser and EFBI safeguarding lead must approve the periods, lawful bases, notices, and exception handling before public enrollment.

## Provisional retention schedule

These are pre-production defaults, not an automated deletion service:

- Active deletion requests have a 14-day internal response target measured from their latest activation. This is an EFBI operating target, not a statutory deadline.

- Active learner profile and progress: keep while the account is active; review after 12 months without sign-in or learning activity.
- Unsubmitted project drafts: remove after 90 days without a learner update, after advance notice where contact is permitted.
- Submitted projects and private reviews without an issued certificate: remove 12 months after the final review or appeal window closes.
- Certificate-linked submission, review, request, issuance, status, claim, and audit evidence: keep only while needed to keep the credential trustworthy and verifiable, including a revoked or replaced status. Legal review must approve the final duration.
- Cancelled deletion requests: review after 12 months and remove when no operational or legal need remains.
- Deletion completion and retention audit records: keep for 24 months as minimal evidence that EFBI handled the request, then review for deletion. These records contain identifiers, status, actors, reasons, and timestamps but never copy deleted learning content.
- An active documented hold pauses the applicable period only for the records necessary for the stated legal, safety, fraud, or integrity purpose. Review each hold every 30 days.

No schedule above runs automatically in Phase 20. Production enrollment remains blocked until EFBI has an approved notice, a trusted scheduled deletion process, hold review ownership, and recovery monitoring. Firestore time-to-live must not be enabled on certificate or audit collections without a separately reviewed design.

## Learner workflow

1. Sign in and open the Account page.
2. Read the data categories and certificate exception.
3. Confirm and choose **Request data deletion**.
4. New profile, progress, project, review, assignment, and certificate changes stop while the request is active.
5. The learner may cancel before an administrator holds or completes the request.
6. The learner can see `requested`, `held`, or `completed`, but never the private hold reason or administrator audit details.

## Administrator workflow

1. Run the Admin Studio only at `http://127.0.0.1:5174/` and open **Privacy & retention**.
2. Select the exact learner UID. Do not identify a request by display name alone.
3. If a narrow legal, safety, fraud, or record-integrity need exists, enter a specific private reason and place the audited hold. Do not use a hold to delay routine work.
4. Release the hold with a separate reason as soon as it is no longer necessary.
5. Before completion, check the exact UID, current request state, hold state, and certificate claim.
6. Type the UID and confirm the protected action. One atomic batch removes every eligible Firestore record and writes the completion and audit evidence.
7. If a certificate claim exists, the workflow removes the profile and course progress but preserves certificate-linked projects, reviews, certificate request, issuance, public record, status, claim, and audit.
8. After Firestore completion, delete only the same UID from **Firebase Console → Authentication → Users**. The browser studio intentionally has no Firebase Admin credential and cannot delete Authentication users.
9. Confirm that the learner can no longer sign in and that any issued credential still verifies with its accurate status.
10. Return to **Privacy & retention**, type the same UID, and record the permanent Authentication-removal confirmation. This confirmation records the operator's statement; it does not itself perform or technically verify the Console deletion.

## Security invariants

- A request document ID and learner UID must match the authenticated learner.
- Request creation and learner cancellation use server timestamps and fixed fields.
- Only verified administrators may hold, release, or complete a request.
- Every hold, release, and completion requires a matching immutable audit event in the same batch.
- Completion requires the profile and pilot progress record to be absent after the batch.
- Without a certificate, both fixed pilot submission versions, their public/private reviews, assignments, and certificate request must also be absent.
- With a certificate claim, browser deletion of certificate-linked evidence is denied.
- Completion records, Authentication-removal confirmations, retention audit records, certificate records, issuance evidence, claims, and status history are immutable.
- A completed Firestore request remains visibly pending until the separate Authentication-removal confirmation is recorded.
- Reviewers and learners cannot read private holds or retention audits.
- The workflow never stores passwords, Authentication tokens, deleted content, or service-account keys.

## Current scope limits

The deletion executor knows only the current AI Foundations pilot's fixed paths. Before adding another course, project version, appeal, upload, or nested learner collection, update the deletion inventory, Admin Studio batch, security rules, tests, and this document together. A new collection must not ship without an explicit deletion or retention decision.

The Firestore operation does not delete email or credentials held by Firebase Authentication; that is the required manual console step. Confirmation is stored at `authenticationRemovals/{uid}` with no email address or copied learner content. It also cannot delete data held by external processors such as YouTube or email providers. EFBI's production privacy notice must name those systems and provide a contact method for requests.

## Required checks before a rule release

```powershell
cd "<EFBI repository>\academy-v2"
npm run lint
npm run build
npm run test:rules

cd "..\efbi-admin-studio"
npm run lint
npm run build
```

The trusted scheduled design is documented in RETENTION_EXECUTOR_DESIGN.md. Firestore TTL is not used because it is billed, non-transactional, and cannot enforce EFBI cross-collection certificate and hold checks.

Deploy Firestore rules only to `efbi-academy-dev-doha` until the production privacy and safeguarding gates are approved. Do not deploy the Admin Studio or the student Hosting build as part of this operation.
