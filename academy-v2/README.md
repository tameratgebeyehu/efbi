# EFBI Academy v2

The Ethiopian Future Builders Initiative Academy is a free learning platform for Ethiopian students. This directory contains the public React application, Firebase rules, emulator tests, and launch operations documentation. The private Admin Studio lives in `../efbi-admin-studio` and must remain localhost-only.

## Local development

```powershell
npm install
npm run dev
```

Local Firebase values belong in ignored `.env.local` files. Never commit a password, App Check debug token, service-account key, or learner record.

## Core checks

```powershell
npm run lint
npm run build
npm run test:browser
npm run test:source-security
npm run test:hosting-config
npm run test:rules
npm run test:account-flow
npm run test:admin-recovery
```

`npm run check:cloud-readiness` is read-only and checks the approved Doha development project. It intentionally fails while required public content is absent or a cloud security boundary is wrong.

`npm run secure:cloud-preview -- --confirm "secure-preview:efbi-academy-dev-doha"` is a narrow owner utility. It can add the approved localhost Authentication domain and close enrollment; it cannot open enrollment, grant roles, publish content, or deploy.

## Release boundary

- Use `npm run build:preview` for the read-only development Hosting candidate.
- Keep enrollment closed until every launch gate is approved.
- Never deploy Admin Studio.
- Do not point `www.efbi.site` at the rebuilt academy without an approved rollback and exact release evidence.

Start with `PROJECT_STATUS.md`, `LAUNCH_ROADMAP.md`, `PHASE_27G_RELEASE_EVIDENCE.md`, and `MANUAL_RELEASE_CHECKLIST.md`.

The first reviewable educational pack and its safe Admin Studio workflow are documented in `LAUNCH_CONTENT_PACK.md`.
