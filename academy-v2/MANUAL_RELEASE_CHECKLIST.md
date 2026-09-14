# EFBI manual release checklist

Use this only after the exact release commit passes the automated checks. Write the date, commit, device or browser, result, and a short note for every item. Do not use real student data.

Automated Phase 27G evidence is recorded in `PHASE_27G_RELEASE_EVIDENCE.md`. It does not complete the human items below.

## 1. Visual and real-device check

- Import the versioned pack through localhost Admin Studio, then review every draft using the workflow in `LAUNCH_CONTENT_PACK.md`.
- Check Home, Programs, Courses, one Course Detail, Certificates, Verify, Blog, About, Contact, Privacy, Join, Sign in, Account, one protected Lesson, and Project Submission.
- Use one real phone, one tablet-sized browser, and one desktop browser.
- Confirm there is no horizontal scrolling, clipped text, overlapping control, unreadable contrast, or button that is too small to tap.
- Rotate the phone once and confirm the page remains usable.
- In localhost Admin Studio, check 75%, 90%, 100%, 125%, 150%, and 200% browser zoom. Confirm all fourteen sections, the verified-owner identity, and Sign out remain reachable without zooming out.
- At tablet and phone widths, open and close the Studio menu with touch, keyboard, and Escape; confirm the current section is announced and no horizontal menu strip hides later sections.

## 2. Keyboard and screen-reader basics

- Use only `Tab`, `Shift+Tab`, `Enter`, `Space`, and `Escape` through the header, mobile menu, forms, lesson controls, and footer.
- Confirm focus is always visible and follows the visual order.
- Confirm the skip link reaches the main content.
- With Windows Narrator or NVDA, confirm each page has one clear page heading, form fields have useful names, validation messages are announced, and status messages make sense without seeing the screen.

## 3. Real connection and recovery

- On the owner computer, type clearly identifiable test text into each Admin Studio editor, reload before saving, choose **Restore copy**, and confirm the exact text returns.
- Watch all four current EFBI videos from beginning to end beside their written lessons. Confirm the order, title, content, captions, and written explanation agree.
- Before selecting **Load video**, confirm the lesson shows no YouTube frame or unexpected YouTube request. After selecting it, confirm the correct module video appears.
- Test one lesson with YouTube temporarily blocked or disconnected. Confirm the retry message appears and the written lesson remains available.
- Repeat once on a slower mobile connection if practical.

## 4. Pilot account and deletion

- Use a dedicated test email, never a student account.
- Confirm registration, real inbox verification, sign-out, sign-in, password reset, and protected lesson access.
- While signed out, confirm the public course page shows exactly four outlines and no lesson body or practice answer.
- Complete all four modules in order, submit all twelve practice questions, and confirm progress reaches 25%, 50%, 75%, then 100%.
- Confirm the completed course says **Learning only · no certificate** and never asks for a project or certificate request.
- Request deletion, cancel it, and reopen it.
- In localhost Admin Studio, complete Firestore deletion for the exact test UID.
- Remove the same UID from Firebase Authentication, confirm it can no longer sign in, then record the permanent confirmation in Admin Studio.

## 5. Firebase operations

- Confirm only intended domains are authorized for Authentication.
- Review App Check metrics before enforcement and confirm both learner and Admin Studio behavior.
- Confirm the owner, administrator, reviewer, and support role list contains only approved accounts.
- Review current Authentication and Firestore quota usage and alert options.
- Confirm the maintenance-site rollback copy and trusted Firebase recovery access are available.

## 6. Final record

Record the release commit, who performed the check, date, devices, browsers, screen reader, failed items, fixes, retest result, and final approval. A passing automated suite is evidence, not permission to deploy or open enrollment.
