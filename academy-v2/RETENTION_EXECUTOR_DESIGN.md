# Trusted retention executor design

Status: designed but intentionally not deployed.

## Current no-cost decision

The EFBI pilot uses the localhost Admin Studio queue and a trained administrator. Automatic deletion is not safe on the current Spark/no-international-payment constraint:

- Firestore TTL deletes documents independently rather than transactionally.
- TTL cannot check an active hold, certificate claim, or cross-collection evidence package before each deletion.
- TTL deletions are a billed Firestore feature.
- Scheduled Cloud Functions use Cloud Scheduler and require a billed deployment path.

EFBI must not replace the reviewed Phase 19 batch with browser timers, Apps Script, GitHub Actions containing project credentials, or a service-account key on an operator computer.

## Future executor boundary

Implement only after explicit billing approval and privacy/safeguarding sign-off:

1. A scheduled second-generation Cloud Function runs in a region selected during the production data-location review.
2. The function uses a dedicated least-privilege runtime identity; no downloadable service-account key exists.
3. Cloud Scheduler is the only invoker. Public and unauthenticated invocation is denied.
4. Each run starts in dry-run mode and records counts, never learner content.
5. A per-request idempotency key prevents duplicate completion or Authentication-removal events.
6. The executor re-reads the deletion request, active hold, certificate claim, completion, and exact record inventory immediately before mutation.
7. Firestore removal and its completion/audit evidence use the same atomic package enforced by security rules or equivalent trusted-server validation.
8. Firebase Authentication removal occurs only after Firestore completion. Failure leaves the request visibly pending for retry.
9. Retries use bounded exponential backoff. Permanent failures enter an operator queue without copying learner content into logs.
10. Monitoring alerts on overdue requests, overdue hold reviews, failed runs, unexpected record paths, and growing Authentication cleanup counts.

## Required safety tests

- A cancelled request is skipped.
- An active hold is skipped.
- A hold created during processing wins the race and prevents completion.
- Certificate-linked evidence is retained.
- Unknown learner subcollections stop processing and require an inventory update.
- Repeated delivery is idempotent.
- Firestore success followed by Authentication failure is recoverable.
- Logs contain IDs, states, counts, and error classes only—not names, email addresses, submissions, feedback, or private hold reasons.
- The executor cannot write course content, reviews, certificates, or role claims.

## Deployment gate

Before implementation, record the approved Firebase plan, cost ceiling, runtime region, service identity, alert owner, rollback owner, privacy-policy version, and test evidence. Deploy to `efbi-academy-dev-doha` first and run synthetic accounts only. Production remains a separate explicit decision.

Official technical references:

- https://firebase.google.com/docs/firestore/ttl
- https://firebase.google.com/docs/firestore/pricing
- https://firebase.google.com/docs/functions/schedule-functions
