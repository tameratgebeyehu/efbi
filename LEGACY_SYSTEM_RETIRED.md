# EFBI legacy system retirement

The original browser administration system and Google Apps Script backend are retired. They must not be used for students, content, progress, assessment, contact messages, or certificates.

## Phase 9 containment

- The maintenance page loads only `maintenance.js`.
- `api.js` and `app.js` are no longer delivered by the page.
- The embedded Apps Script deployment URL was removed.
- Default administrator and student passwords were removed.
- The historical Apps Script POST entry point returns a retired response.
- A read-only check on 2026-09-11 did not receive a successful response from the previously embedded deployment.

## Manual owner check

The project owner should still open Google Apps Script **Manage deployments** and archive the old deployment if it is listed. This requires the owner's Google account and is not automated.

## Permanent rules

1. Never store a password in a spreadsheet or application document.
2. Never authorize an administrator using a shared username and password in browser JavaScript.
3. Never accept privileged actions from a public webhook without verified identity and server-side authorization.
4. Never use browser local storage as proof of identity or role.
5. Never reconnect these historical files to the public site.

Git history preserves the retired implementation for audit purposes. It is not a recovery path for production use.
