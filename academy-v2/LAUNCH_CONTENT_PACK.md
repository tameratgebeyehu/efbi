# EFBI launch content pack

Updated: 2026-09-14

## What is included

`content/launch-pack-v1.json` is the first owner-review pack:

- four programs: Artificial Intelligence, AI-Assisted App Development, Web Development, and Mobile App Development;
- one beginner course: **AI Foundations for Ethiopia**;
- four written lessons totaling 90 minutes;
- twelve browser-only practice questions with explanations; and
- one founder article: **Why EFBI Academy starts with building**.

The language is short, practical, and written for learners. The course covers understanding AI, clearer prompting, responsible use, and one small Ethiopian problem-solving project.

## Video boundary

Every lesson intentionally has an empty `videoYoutubeId`. No random or unreviewed YouTube video is treated as EFBI material.

Before adding a video, the owner must confirm:

1. EFBI owns it or has permission to embed it;
2. its lesson claims are accurate and age-appropriate;
3. spoken and visual content match the written lesson;
4. captions are useful;
5. the exact eleven-character YouTube ID is recorded; and
6. the written lesson remains complete when YouTube is blocked.

## Safe import

1. Start Admin Studio locally and sign in as the verified owner.
2. Open **Launch drafts**.
3. Read the pack inventory.
4. Type `IMPORT LAUNCH DRAFTS`, confirm the review boundary, and import.
5. The importer creates only missing IDs as private drafts. Existing IDs are skipped.
6. Every created draft receives a separate immutable `adminAudit` event.
7. If electricity or connectivity interrupts the operation, reopen the page and import only the remaining items.

The importer cannot publish programs or articles, publish course or lesson releases, activate a course, open enrollment, issue a certificate, or overwrite an existing draft.

## Owner review order

1. Review and publish each Program through **Programs**.
2. Review the course wording through **Courses**, mark it ready, and publish its immutable release.
3. Review every lesson and answer through **Lessons**, add only approved videos, mark each ready, and publish.
4. Review and publish the founder article through **Blog**.
5. Use **Activation** to bind the exact course release and four lesson releases into a learning-only course version.
6. Use **Launch readiness** to confirm the public records and release links.

For the first launch, keep AI Foundations as `practice-only` unless EFBI has a qualified reviewer and deliberately approves the reviewed-project assessment route. Practice questions never issue a certificate.

## Required human decisions

The owner must still:

- approve every sentence and answer;
- decide whether the first course needs EFBI-produced videos before launch;
- confirm that examples feel useful to Ethiopian learners;
- correct anything that overpromises outcomes;
- preview phone and desktop layouts; and
- publish each item through the normal protected workflow.

Source control stores the proposed educational material so it can be reviewed and recovered. It contains no learner records, private reviews, credentials, Firebase secrets, or unpublished student work.
