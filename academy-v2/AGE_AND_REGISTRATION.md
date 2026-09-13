# EFBI age and registration guide

Updated: 2026-09-13

## What the website does

The Join page asks only for an age group. It does not ask for a date of birth, phone number, home address, government ID, health information, or payment information.

- **Under 12:** no account form is shown. The visitor can explore public learning pages.
- **Ages 12–15:** no account form is shown. EFBI explains that a reviewed parent, guardian, or tutor route is required. The contact route warns people not to send identity documents or sensitive information.
- **Age 16 or older:** the account form appears only when enrollment is open. The learner must accept the short privacy summary and learner-safety statement separately.

## What is saved for a 16+ account

The learner profile stores the display name, the `16-plus` age band, the exact privacy and safety notice versions accepted, acceptance times, account status, and creation/update times. Firebase Authentication stores the sign-in email and password credentials.

The profile deliberately does not store a birth date, phone number, address, identification document, health details, or payment details.

## Safety controls

Opening enrollment in Admin Studio does not weaken the age rules. The website and Firestore rules both require the approved 16+ profile structure. A verified Firebase sign-in without that learner profile cannot create progress, submissions, certificate requests, or a deletion request.

If profile creation fails after the authentication account is created, the unfinished sign-in is removed and the learner is asked to try again.

## Owner operation

1. Keep enrollment closed during development and public read-only previews.
2. Open it only after the launch gates for 16+ self-registration are satisfied.
3. Do not manually create learner profiles to bypass the Join page.
4. Keep the 12–15 route closed until its authorization, safeguarding contact, backup contact, withdrawal procedure, and external review are complete.
5. Do not request guardian identity documents by email.

Learners can use the Privacy & Support page for access, correction, withdrawal/deletion, and safety routes. See `PRIVACY_SUPPORT_OPERATIONS.md` for the owner workflow.

## Still blocked

This checkpoint does not approve or open enrollment for ages 12–15. It also does not replace the pending Ethiopian privacy and safeguarding review, final public privacy notice, incident procedure, or launch approval.
