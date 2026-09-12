# EFBI course content versioning

## Purpose

A learner's saved completion must keep the same meaning after EFBI edits a course. Published identifiers are permanent records, not reusable labels.

## Legacy AI Foundations boundary

`ai-foundations` is the durable identifier for the original four-lesson pilot. Its lesson slugs are:

1. `understanding-ai`
2. `prompting-with-purpose`
3. `responsible-use`
4. `build-an-ethiopian-solution`

Existing unversioned AI Foundations progress keeps using this tested curriculum. It must not be silently converted to a new versioned record.

## Versioned course boundary

New multi-course progress is bound to an immutable `courseVersions` record. A version records:

- the durable course ID and visible title;
- the course and assessment version numbers;
- whether the course uses practice only or a final project; and
- the ordered list of 1–12 lesson IDs.

`activeCourses/{courseId}` points new learners to one version. Switching that pointer does not rewrite learners who already started an older version.

## Editorial and material changes

Spelling, accessibility, broken-link, wording, or example corrections may use a new release when the learning objective and completion requirement keep the same meaning.

A new course version is required when a change:

- replaces or materially expands a learning objective;
- changes what a learner must do to complete a lesson;
- adds or removes a required lesson;
- changes the final assessment or project requirement; or
- makes earlier completion evidence no longer equivalent.

Use a new lesson ID when the meaning of that lesson changes materially. Use a new course ID only when the pathway is a genuinely different course, not merely a later version of the same course.

## Publishing and activation checklist

1. Create or edit the course draft in the local Admin Studio.
2. Review the preview, mark it ready, and publish the immutable course release.
3. Create, review, and publish every lesson release.
4. For the current Phase 23 model, the course release and every included lesson release must have the same version number.
5. Open **Activation** and select that course and matching version.
6. Confirm the lesson list is unique, ordered continuously from 1, and contains no more than 12 lessons.
7. Choose the assessment type and version.
8. Read and accept the protected-action confirmation, then activate.
9. Confirm the new version, active pointer, and audit event appear together. If any part fails, none should be saved.
10. Test with synthetic learner accounts before opening enrollment.

Publishing a course or lesson release does not activate it. Activation is a separate atomic operation that creates an immutable course version, changes the active pointer, and creates a matching immutable audit event.

An already-created version cannot be edited or activated again. Publish and activate a new version instead. This preserves a clear history and prevents an old audit event from being reused.

## Learner loading behavior

The protected learner route is `/learn/:courseId/:lessonSlug`.

- A learner with versioned progress reopens the exact version recorded in that progress.
- A learner with legacy AI Foundations progress stays on the legacy compatibility path.
- A learner with no progress starts only the current active version.
- Incomplete, mismatched, invalid, and unpublished course data fails closed.

Verified learners can browse complete activated courses and open their dynamic course details. Anonymous visitors still see only the safe built-in pilot preview. Do not treat activation alone as public launch approval.

## Certificate boundary

Browser knowledge checks are retryable practice and never determine certificate eligibility. Certificates must reference a reviewed assessment and course version. Multi-course submissions, reviews, certificate claims, and deletion inventory remain later Phase 23 work.
