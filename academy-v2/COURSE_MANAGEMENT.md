# EFBI course management

Phase 10 introduces a secure course-level publishing workflow in the local Admin Studio. It does not publish lessons to learners or replace the version-controlled AI Foundations pilot.

## Lifecycle

```text
new course -> draft -> ready -> published
                   ^       |
                   |-------|
```

An administrator may return a ready course to draft by editing it. A published course remains editable as a new draft revision, but every previous release stays immutable.

## Course identity

`courseId` is a durable lowercase slug from 3 to 64 characters. It may contain lowercase letters, numbers, and single hyphens between segments, for example `digital-literacy`.

Never reuse an existing course ID for content whose learning outcomes or completion meaning changed materially. Use a new ID such as `digital-literacy-v2`.

## Validated course fields

- title: 5–100 characters
- summary: 20–240 characters
- description: 40–4,000 characters
- category: one approved EFBI category
- level: beginner, intermediate, or advanced
- language: 2–40 characters
- estimated duration: integer from 15 to 20,000 minutes
- status: draft, ready, or published

Unknown fields are rejected. Creation metadata cannot change. Every accepted update advances the revision by exactly one, uses server timestamps, identifies the signed-in administrator, and must change content or status. No-op updates are rejected.

## Atomic integrity

Every create or update must write a matching immutable `adminAudit` event in the same Firestore batch. Firestore rules check the linked post-operation records, so neither side can succeed alone.

Publishing requires all of the following in one batch:

1. the existing draft is ready;
2. the draft advances by one revision and one release number;
3. course content does not change during the publish action;
4. a new immutable `courseReleases` snapshot exactly matches that draft;
5. a matching immutable audit event links the operation.

The entire operation fails if any condition fails. Releases and audit events cannot be updated or deleted from browser code.

## Admin Studio workflow

1. Start the studio at `http://127.0.0.1:5174/`.
2. Sign in with a verified account that has the server-issued `admin: true` claim.
3. Open **Courses** and create a course or select a draft.
4. Save complete course metadata.
5. Read the preview and mark the course ready.
6. Confirm the preview checkbox and publish the release.
7. Check the release history shown beside the editor.

The interface deliberately provides no delete operation.

## Power-loss recovery

The editor stores only the current unsaved course form in browser local storage. It contains course text and the server revision used as its base; it must never contain student records, credentials, tokens, submissions, or private reviews.

After an interrupted session, the studio offers to restore or discard the form. It checks Firestore before restoring an existing course. If the server revision is different, the recovery copy is stale and is refused.

This feature is best-effort only. Browser storage may be cleared, copied, or unavailable. Firestore is the authoritative saved state.

## Access boundaries

- verified administrators may read and manage course drafts;
- any verified user may read immutable release records, preparing for a later authenticated catalog;
- only administrators may read audit events;
- reviewers cannot read course drafts or audit events;
- learners cannot list or read private course drafts;
- no browser identity may alter a release or audit event after creation.

## Phase 10 verification

The Firestore emulator suite covers valid and invalid creates, exact field schemas, identity forgery, revision skipping, no-op changes, deletion, publication from the wrong state, content changes during publication, missing linked records, immutable releases, audit access, and orphan audit events.

Before merging or deploying course-management changes:

1. run the 27 Firestore authorization tests;
2. build and lint both the student and administrator applications;
3. deploy only the tested Firestore rules to the Doha development project;
4. confirm no Admin Studio code or `/admin` route entered the student app;
5. confirm no environment files, App Check debug tokens, keys, or learner data are tracked.

## Still disabled

Lesson and question editing, student catalog migration, submissions, uploads, reviewed assessments, certificate UI/workflows, production enrollment, and production deployment remain disabled. They need separate schemas, state transitions, rules, and tests.
