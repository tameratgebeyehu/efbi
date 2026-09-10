# EFBI backend foundation

This phase replaces the legacy public Apps Script endpoint with Firebase Authentication and Cloud Firestore. It is designed to fit Firebase's no-cost Spark plan for an early pilot and avoids Cloud Functions, phone authentication, file uploads, and other features that can require billing.

## Security decisions

- Firebase Authentication owns passwords. EFBI never stores or receives a learner's password.
- Email verification is required before a learner can open protected lessons or write progress.
- Firestore records are keyed by the Firebase user ID, never by an email supplied by the browser.
- Learner profiles store only a display name, status, and timestamps. Email remains in Firebase Authentication.
- A learner can read only their own profile and progress.
- Public certificate lookup requires an exact credential ID. Listing the certificate registry is denied.
- Public certificate records must not contain email, phone, date of birth, school, private submissions, or Firebase user IDs.
- Certificate issuance requires an administrator custom claim. No browser user can grant that claim.
- Project submissions and administrative tools remain denied until their workflows and rules are separately designed and tested.
- App Check should be monitored before enforcement is enabled. It limits abuse but does not replace Authentication or Firestore rules.

## Collections

```text
users/{uid}
  displayName
  status
  createdAt
  updatedAt

users/{uid}/progress/{courseId}
  courseId
  completedLessonIds[]
  lastLessonId
  percent
  createdAt
  updatedAt

certificates/{credentialId}
  credentialId
  learnerName
  courseId
  courseTitle
  issuedAt
  status
  public
  updatedAt
```

Course descriptions remain in the version-controlled website. Protected lesson records may later use `courses/{courseId}`, but the current rules do not permit browser writes.

## Development environment

- Firebase project: `efbi-academy-dev-doha`
- Web app: `EFBI Academy Development Web`
- Firestore: `(default)` in `me-central1` (Doha), Standard edition, deletion protection enabled
- Authentication: Email/Password enabled
- Password policy: enforced minimum of 10 characters
- Email enumeration protection: enabled
- App Check provider: reCAPTCHA Enterprise score key, development Hosting domains only
- App Check risk threshold: 0.5
- App Check token lifetime: one hour
- App Check enforcement: monitoring only for Authentication and Firestore
- Local App Check: registered private debug token in .env.development.local
- Local SDK settings: `.env.local`, intentionally ignored by Git

## Local setup

1. Use the existing ignored `.env.local` to test the real Doha development project.
2. Set `VITE_USE_FIREBASE_EMULATORS=true` when isolated local account and progress testing is needed.
3. Run `npm run emulators` in one terminal and `npm run dev` in another for emulator testing.
4. Run `npm run test:rules` after every security-rule change.

Do not place service-account JSON, private keys, reCAPTCHA secret keys, App Check debug tokens, student exports, or production project credentials in this repository.

See APP_CHECK.md for the development configuration and enforcement checklist.

## Firebase Console checklist

1. Use separate development and production Firebase projects.
2. Enable Email/Password Authentication.
3. Require a password policy of at least 10 characters; prefer uppercase, lowercase, number, and symbol requirements.
4. Enable email-enumeration protection.
5. Add only the real local, preview, and production domains to Authorized domains.
6. Create Firestore in a region appropriate for the student population and deploy the tested rules.
7. Register App Check with reCAPTCHA Enterprise, monitor metrics first, then enforce it for Authentication and Firestore.
8. Customize the verification and password-reset email templates with the EFBI name and domain.
9. Keep the production project empty until the development emulator and authorization tests pass.

## Important limitation

An unlisted YouTube embed is not private hosting. A determined viewer can discover the video ID or open the video on YouTube. EFBI can require sign-in before showing the player and avoid publishing links, but it cannot guarantee that a YouTube-hosted lesson is viewable only inside the EFBI website.
