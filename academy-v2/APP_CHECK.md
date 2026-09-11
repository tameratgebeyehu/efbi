# EFBI App Check operations

Firebase App Check is registered for the Doha development project. It adds application-attestation signals to Firebase requests, but it does not replace Authentication or Firestore security rules.

## Development configuration

- Firebase project: efbi-academy-dev-doha
- Web app: EFBI Academy Development Web
- Provider: reCAPTCHA Enterprise, score-based and invisible
- Allowed production-style hosts:
  - efbi-academy-dev-doha.web.app
  - efbi-academy-dev-doha.firebaseapp.com
- Risk threshold: 0.5
- Token lifetime: one hour
- Authentication enforcement: off, monitoring only
- Firestore enforcement: off, monitoring only

Never add localhost or 127.0.0.1 to the reCAPTCHA key. Local development uses an App Check debug token instead.

## Local files

.env.local contains the public Firebase web configuration and public App Check site key.

.env.development.local contains VITE_FIREBASE_APP_CHECK_DEBUG_TOKEN. That token is a private bypass credential for this development app. Both files are ignored by Git. Never copy the debug token into .env.example, documentation, a production build, a screenshot, or a support message.

The application reads the debug token only when import.meta.env.DEV is true. A production-build scan must confirm that the token value is absent from dist.

## Monitoring before enforcement

Keep enforcement off until all of these conditions are true:

1. Registration, sign-in, password reset, email verification, profile creation, and progress writes produce verified App Check requests.
2. The development Hosting version has been tested from both registered domains.
3. Local testing succeeds only through the registered debug token.
4. App Check metrics show legitimate requests as verified and no unexplained outdated-client traffic.
5. A rollback owner knows how to return Authentication and Firestore to monitoring mode.
6. The same configuration is recreated separately for the future production Firebase project and real EFBI domain.

When enforcement is approved, enable it one service at a time, starting with Firestore. Wait for propagation and rerun the complete browser test before considering Authentication enforcement.

## Phase 6 monitoring review

On 2026-09-11, the authenticated Firebase CLI was checked for App Check monitoring data. Its App Check commands expose debug-token management but not request metrics. The Firebase Console browser path remains unavailable to automation because of the current Windows ACL failure.

No enforcement change was made. Authentication and Firestore remain in monitoring mode because verified-versus-unverified traffic could not be reviewed reliably. The synthetic Phase 6 Web SDK test did not attach an App Check token, so those requests may appear as unverified development traffic and must not be mistaken for real learners during the later Console review.

## Phase 7 monitoring review

On 2026-09-11, Firebase Console access was attempted twice through the approved Windows computer-control runtime. The runtime failed during initialization because Windows could not apply its deny-read ACLs, so no trustworthy App Check request metrics could be inspected.

Authentication and Firestore enforcement remain off. The live Phase 7 REST security test also did not attach an App Check token, so its synthetic requests may appear as unverified traffic. Do not enable enforcement until the Console shows that normal hosted browser flows are verified and a rollback owner is ready.

## Authentication email note

The development project display name is EFBI Academy Development Doha, so Firebase default verification and reset subjects still identify EFBI. A direct template-branding update was rejected by Identity Toolkit with EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED. Keep the safe default templates for development and retry branding through the Firebase console when the production domain and action URL are configured.
## Cost and availability

The default one-hour token lifetime limits re-attestation frequency. Review the Firebase and reCAPTCHA Enterprise quotas before public enrollment. Do not attach billing or upgrade the Firebase plan without an explicit project decision.

## Official references

- https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider
- https://firebase.google.com/docs/app-check/web/debug-provider
- https://firebase.google.com/docs/app-check/monitor-metrics
- https://firebase.google.com/docs/app-check/enable-enforcement
