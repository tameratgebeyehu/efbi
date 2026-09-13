# EFBI privacy and learner-support operations

Updated: 2026-09-13

## One official route

Privacy and learner-safety messages go to **efbi.academy@gmail.com**. The website prepares the request subject and a short reminder to send from the learner's account email and not include passwords, identity documents, health details, or another person's private information.

EFBI does not create a second Firestore collection for free-text support messages. This avoids copying potentially sensitive messages into another system.

## Request types

### Access

The learner asks for a copy or explanation of the information connected to the account. Confirm the request comes from the account email before sharing account-specific information. Do not ask for a password or government ID. A polished one-click export is not built yet, so no public launch should promise an instant download.

### Correction

The learner identifies the incorrect account detail. Confirm the request from the account email, change only the necessary field through an approved workflow, and confirm the result. Do not change certificate history through an ordinary correction request.

### Withdrawal and deletion

The Privacy & Support page uses the existing protected deletion workflow. An active request freezes new learning writes. Admin Studio inventories learner records, preserves only certificate-linked evidence when required for credential integrity, records the deletion, and separately confirms Firebase Authentication removal.

### Learner safety

Ask only for the minimum non-sensitive description needed to understand the concern. Never request a password or identity document. EFBI email is not an emergency service; immediate danger should go to a trusted adult or the appropriate local emergency service.

The named safeguarding contact, backup contact, and final escalation procedure are still launch gates. Until those are approved, the 12–15 enrollment route remains closed.

## Owner handling rules

1. Use the official EFBI inbox, not a personal chat, for account-specific privacy requests.
2. Verify account requests through the email attached to the learner account.
3. Do not ask for more personal information merely to make a request look formal.
4. Keep replies short and do not forward learner information to unrelated people.
5. Separate ordinary course questions from privacy and safety concerns.
6. Do not promise a response deadline until the final reviewed policy sets it.
7. Escalate suspected account compromise or immediate safety risk instead of treating it as a normal correction.

## Development boundary

The learner routes and protected deletion control are implemented in development. Final copy, operator response templates, the access-package workflow, safeguarding ownership, incident escalation, and external privacy/safeguarding review remain required before public enrollment.
