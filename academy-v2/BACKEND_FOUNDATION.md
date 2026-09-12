# EFBI backend foundation

This phase replaces the legacy public Apps Script endpoint with Firebase Authentication and Cloud Firestore. It is designed to fit Firebase's no-cost Spark plan for an early pilot and avoids Cloud Functions, phone authentication, file uploads, and other features that can require billing.

## Security decisions

- Firebase Authentication owns passwords. EFBI never stores or receives a learner's password.
- Email verification is required before a learner can open protected lessons or write progress.
- Firestore records are keyed by the Firebase user ID, never by an email supplied by the browser.
- Learner profiles store only a display name, status, and timestamps. Email remains in Firebase Authentication.
- A learner can read only their own profile and progress.
- Progress accepts only published lesson IDs, server timestamps, and percentages that match completed lessons; completed work cannot be reset from the browser.
- Public certificate lookup requires an exact credential ID. Listing the certificate registry is denied.
- Public certificate records must not contain email, phone, date of birth, school, private submissions, or Firebase user IDs.
- Certificate issuance requires an administrator custom claim. No browser user can grant that claim.
- Administrative access lives in a separate localhost-only application, never at a public `/admin` route.
- A verified Firebase email and server-issued custom claim are required; hiding a route is never treated as authorization.
- Course and lesson changes use strict field lists, length limits, allowed values, server timestamps, immutable ownership metadata, and one-step revision changes.
- A course or lesson change and its audit event must succeed in one atomic batch; course publication also creates an immutable release snapshot in that batch.
- Review assignments remain read-only in browser code until their own workflow and tests are implemented.
- Project submissions remain denied until their workflow and rules are separately designed and tested.
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

Current Phase 8 validation permits only the ordered four-lesson states at 25%, 50%, 75%, and 100%. Every update must add exactly one lesson and 25 percentage points. A 100% record is course progress only; final-assessment review and certificate issuance remain separate and denied.

certificates/{credentialId}
  credentialId
  learnerName
  courseId
  courseTitle
  issuedAt
  status
  public
  updatedAt

courseDrafts/{courseId}
  courseId
  title
  summary
  description
  category
  level
  language
  estimatedMinutes
  status                 # draft | ready | published
  revision
  latestReleaseNumber
  latestReleaseId
  createdAt
  createdBy
  updatedAt
  updatedBy
  lastAuditId

courseReleases/{releaseId}
  releaseId
  courseId
  title
  summary
  description
  category
  level
  language
  estimatedMinutes
  version
  draftRevision
  publishedAt
  publishedBy
  auditId

lessonDrafts/{lessonId}
  lessonId
  courseId
  order
  title
  summary
  durationMinutes
  videoYoutubeId
  bodyMarkdown
  question1
  question2
  question3
  status                 # draft | ready | published
  revision
  latestReleaseNumber
  latestReleaseId
  createdAt
  createdBy
  updatedAt
  updatedBy
  lastAuditId

lessonReleases/{releaseId}
  releaseId
  lessonId
  courseId
  order
  title
  summary
  durationMinutes
  videoYoutubeId
  bodyMarkdown
  question1
  question2
  question3
  version
  draftRevision
  publishedAt
  publishedBy
  auditId

reviewAssignments/{assignmentId}
  # admin/reviewer read; all browser writes still denied

adminAudit/{eventId}
  eventId
  action                 # approved course or lesson action
  entityType             # courseDraft | courseRelease | lessonDraft | lessonRelease
  entityId
  actorUid
  revision
  releaseId
  createdAt
```

The public course pages still use the version-controlled pilot outline. The protected AI Foundations learning route can read compatible course and lesson releases after sign-in, but falls back to the version-controlled curriculum if release data is missing or incompatible.

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

The local owner role utility uses the existing Firebase CLI sign-in, is hard-limited to `efbi-academy-dev-doha`, and requires an exact confirmation phrase for every mutation. Role changes still require the project owner's explicit approval for the exact account email. See `../ADMIN_STUDIO.md`.

```powershell
npm run manage:roles -- inspect --email "owner@example.com"
```

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
