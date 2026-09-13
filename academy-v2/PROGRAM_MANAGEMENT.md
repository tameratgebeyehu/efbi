# EFBI program management

Updated: 2026-09-13

## Purpose

Programs are the public learning paths shown on the Home, Programs, Program Detail, and Courses pages. They are also the categories used to organize courses.

The public website never reads private program drafts. It reads only the latest published snapshot. The existing eight built-in cards remain as a safe migration fallback: a published program replaces the matching built-in card, while unpublished built-in cards remain visible. This also keeps the site complete if Firebase is unavailable.

## Owner workflow

1. Run Admin Studio locally and sign in with the verified owner account.
2. Open **Programs**.
3. Select **New program** and choose a permanent lowercase ID, such as `scholarship-readiness`.
4. Add the title, short card label, description, learner outcome, level, duration, accent, and display order.
5. Create or save the draft. The browser also keeps a best-effort recovery copy while text is unsaved.
6. Select **Mark review ready** after checking the preview.
7. Confirm the exact preview and publish it.

Publication is one atomic operation. It updates the private draft, creates an immutable release, refreshes the public program snapshot, and creates an immutable audit event. If any part fails, none of the publication is saved.

To correct a published program, edit it, save it as a new draft, mark it review ready, and publish a new release. Older releases remain unchanged.

## Course categories

The Course workspace loads owner-managed program IDs as category choices. The four earlier built-in categories remain available for compatibility with existing course records. Firestore accepts a new category only when it is a valid permanent program ID with a corresponding private program draft, or one of those four legacy categories.

## Security boundary

- Only a verified Firebase account with the server-issued `admin` claim can read or change program drafts and releases.
- Published program snapshots are intentionally public and contain only display content.
- Public snapshots cannot be written by learners, reviewers, anonymous visitors, or unaudited administrator operations.
- Program drafts, releases, and public snapshots cannot be deleted from a browser account.
- Admin Studio remains localhost-only and is never deployed with the learner website.

No Phase 24 program data, Firestore rules, or Hosting build is deployed automatically. Deployment requires a separate explicit approval.
