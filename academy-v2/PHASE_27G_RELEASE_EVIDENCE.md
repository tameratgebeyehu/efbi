# Phase 27G release evidence

Date: 2026-09-13

Branch: `codex/academy-v2`

Environment: Firebase project `efbi-academy-dev-doha`

## Automated evidence completed

- The production dependency audit reports zero vulnerabilities.
- Forty-seven TypeScript source files pass checks for raw HTML injection, dynamic code execution, insecure non-local HTTP URLs, unsafe new-tab links, nested Admin Studio landmarks, and account secrets in browser storage.
- The read-only preview build contains no available local Firebase identity or App Check debug token.
- Firebase Hosting configuration now defines a restrictive Content Security Policy, clickjacking denial, MIME protection, referrer and permissions policies, opener isolation, HTTPS upgrade, HSTS, SPA rewrites, and immutable asset caching.
- The cloud preflight confirms email/password sign-in requires passwords, the server enrollment switch is closed, and the only operator role belongs to the verified owner `efbi.academy@gmail.com` with `admin` only.
- Authentication authorized domains are limited to the two Firebase development domains and localhost.
- The earlier Phase 27F gates remain the baseline: 58 local public-browser checks, 96 Firestore authorization tests, the isolated learner lifecycle, Admin Studio recovery, and the complete synthetic deletion flow.

## Safe cloud corrections made

The authenticated development project was found with the Firestore enrollment switch open and without localhost in Authentication authorized domains. The confirmation-gated `npm run secure:cloud-preview` utility:

1. added only `localhost` to the development authorized-domain list; and
2. changed only `publicSettings/enrollment.open` to `false`, preserving the 12+ platform boundary.

It did not deploy Hosting or rules, open enrollment, grant a role, publish content, delete data, change App Check enforcement, or touch the maintenance domain.

## Blocking findings

1. **Launch content:** the development project contains zero published programs, active courses, public course records, course or lesson releases, and published articles. Content readiness correctly fails.
2. **Hosted preview is stale:** the current development Hosting copy is safely read-only, but it predates the Programs heading fix and the new security headers. It is not the final release candidate.
3. **Human accessibility and devices:** visual polish, touch behavior, keyboard order, and actual Narrator or NVDA speech are not approved.
4. **Firebase Console operations:** App Check traffic categories, quota usage, alerts, recovery access, and rollback ownership still require an owner review in the Console.
5. **Independent review:** the specialized security-review subagent was unavailable in this session. Automated source and rules gates passed, but independent controlled review remains open.

## Repeatable commands

```powershell
npm run test:source-security
npm run test:hosting-config
npm run check:cloud-readiness
npm run test:browser
npm run test:account-flow
npm run test:admin-recovery
npm run test:rules
```

`check:cloud-readiness` must remain nonzero until real launch content is published and its references are internally complete. A passing automated content inventory still requires the owner to preview and approve the actual words, videos, links, questions, and answers.

## Deployment boundary

Nothing in Phase 27G authorizes deployment or enrollment. The custom domain `www.efbi.site` remains on its maintenance site. Admin Studio remains localhost-only.
