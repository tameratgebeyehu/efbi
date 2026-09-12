# EFBI safe preview and enrollment controls

Updated: 2026-09-12

## Purpose

Phase 22 separates three operating states so a public design preview cannot accidentally become an enrollment launch.

## Site modes

### Public preview

- Built with `npm run build:preview`.
- Shows a read-only preview banner.
- Replaces join, sign-in, account, and protected-learning access with a clear closed message.
- Loads from an isolated environment directory.
- Contains no local Firebase project identifiers or App Check settings.
- Is the only learner build approved for development Hosting in Phase 22.

### Local testing

- Used automatically by `npm run dev` unless an explicit site mode is supplied.
- Can connect to the ignored local Firebase configuration.
- Keeps ordinary learner registration closed.
- Exposes `/owner-setup` only on the local testing build so the owner can choose a private password and verify the designated email.

### Enrollment open

- Requires an explicit `VITE_SITE_MODE=enrollment-open` build decision.
- Still requires the separate Firestore `publicSettings/enrollment` document to contain `open: true`.
- Must not be built or published until the later age, privacy, support, content, and launch checks are approved.

## Two-key enrollment boundary

Creating an EFBI learner profile requires both:

1. an enrollment-enabled learner build; and
2. the administrator-controlled Firestore enrollment setting to be open.

The Firestore setting is absent by default, which is treated as closed. Only a verified Firebase account with the server-issued `admin` claim can change it. The Admin Studio requires the operator to type `OPEN ENROLLMENT` and confirm the safety statement before opening it.

Firebase Authentication may technically accept an orphan account if its public API configuration is obtained elsewhere while the email/password provider is enabled. That account cannot create an EFBI learner profile or use protected learner records while the Firestore switch is closed. The Phase 22 preview does not include the project configuration needed to call that API.

## Owner setup

1. Run the learner application locally.
2. Open `http://127.0.0.1:5173/owner-setup`.
3. Create the owner sign-in for `efbi.academy@gmail.com` with a new password of at least 12 characters.
4. Do not reuse the Gmail password and do not share or commit the new password.
5. Open Gmail and verify the Firebase email.
6. Inspect the account locally, then grant the exact account the `admin` custom claim through `manage-role.cjs`.
7. Sign in to the localhost Admin Studio and confirm the Enrollment workspace shows closed.

The owner setup creates only the Authentication identity. It does not create a learner profile and does not open enrollment.

## Development deployment

The approved order is:

1. Run learner and Admin Studio lint and builds.
2. Run the full Firestore emulator authorization suite.
3. Build with `npm run build:preview`.
4. Scan `dist` for local Firebase values and stop if any are present.
5. Deploy Firestore rules and Hosting only to `efbi-academy-dev-doha`.
6. Verify the development `web.app` routes and security headers.
7. Leave `www.efbi.site` on its existing maintenance deployment.

Admin Studio is never uploaded to Firebase Hosting. A production or custom-domain launch is a later phase.
