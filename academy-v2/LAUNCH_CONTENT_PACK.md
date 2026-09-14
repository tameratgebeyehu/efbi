# EFBI launch content pack

Updated: 2026-09-14

## What is included

`content/launch-pack-v1.json` is the first owner-review pack:

- four programs: Artificial Intelligence, AI-Assisted App Development, Web Development, and Mobile App Development;
- one beginner course: **AI for Ethiopia**;
- four current video-and-written modules totaling about 90 minutes;
- twelve browser-only practice questions with explanations; and
- one founder article: **Why EFBI Academy starts with building**.

The language is short and practical. The current course welcomes learners, explains AI, shows responsible student uses, and introduces AI-assisted lesson planning for teachers. Modules 5–12 remain future work and are not represented as available lessons.

## Owner-supplied EFBI videos

The owner supplied these public videos from the EFBI YouTube channel:

1. Module 1 — [Welcome to AI for Ethiopia](https://www.youtube.com/watch?v=Bh2XmeaZsBc) — `Bh2XmeaZsBc`
2. Module 2 — [What is AI?](https://www.youtube.com/watch?v=h7D-j8S1upg) — `h7D-j8S1upg`
3. Module 3 — [How to use AI as a student in Ethiopia](https://www.youtube.com/watch?v=1fqpgrk1rAg) — `1fqpgrk1rAg`
4. Module 4 — [AI for teachers](https://www.youtube.com/watch?v=mkLStuyRPjM) — `mkLStuyRPjM`

Only the clean eleven-character IDs are stored. Share-tracking and start-time parameters are excluded. Every module still has a complete written lesson for learners who cannot load YouTube.

Before adding Modules 5–12, the owner must confirm:

1. EFBI owns it or has permission to embed it;
2. its claims are accurate and age-appropriate;
3. spoken and visual content match the written lesson;
4. captions are useful;
5. the exact eleven-character YouTube ID is recorded; and
6. the written lesson remains complete when YouTube is blocked.

## Phase 27M video audit

On 2026-09-14, the four public YouTube oEmbed records matched the expected module titles and identified the channel as `EFBI`. The public caption-track listing returned zero discoverable tracks for all four videos. Treat captions as unconfirmed until the owner verifies them in the YouTube player or adds reviewed caption tracks in YouTube Studio. Written lessons remain available, but they do not replace synchronized captions for video accessibility.

## Safe import

1. Start Admin Studio locally and sign in as the verified owner.
2. Open **Launch drafts**.
3. Read the pack inventory.
4. Type `IMPORT LAUNCH DRAFTS`, confirm the review boundary, and import.
5. The importer creates only missing IDs as private drafts. Existing IDs are skipped.
6. Every created draft receives a separate immutable `adminAudit` event.
7. If electricity or connectivity interrupts the operation, reopen the page and import only the remaining items.
8. Run `npm run check:launch-drafts` from `academy-v2`. It reads the development project and confirms the exact ten private drafts, their revision-one state, owner identity, and linked audit events without publishing anything.

The importer cannot publish programs or articles, publish course or lesson releases, activate a course, open enrollment, issue a certificate, or overwrite an existing draft.

## Owner review order

1. Review and publish each Program through **Programs**.
2. Review the course wording through **Courses**, mark it ready, and publish its immutable release.
3. Watch each EFBI video alongside its written lesson, review every answer, mark each lesson ready, and publish.
4. Review and publish the founder article through **Blog**.
5. Use **Activation** to bind the exact course release and four lesson releases into a learning-only course version.
6. Use **Launch readiness** to confirm the public records and release links.

For the first launch, keep AI for Ethiopia as `practice-only` unless EFBI has a qualified reviewer and deliberately approves the reviewed-project assessment route. Practice questions never issue a certificate.

## Required human decisions

The owner must still:

- approve every sentence and answer;
- confirm that each supplied video matches its written lesson and has useful captions;
- confirm that examples feel useful to Ethiopian learners;
- correct anything that overpromises outcomes;
- preview phone and desktop layouts; and
- publish each item through the normal protected workflow.

Source control stores the proposed educational material so it can be reviewed and recovered. It contains no learner records, private reviews, credentials, Firebase secrets, or unpublished student work.
