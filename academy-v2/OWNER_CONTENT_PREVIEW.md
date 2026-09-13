# EFBI owner content preview

The full preview helps the owner check launch content before marking it ready or publishing it. It is available for programs, courses, lessons, and articles in the localhost Admin Studio.

## Use the preview

1. Open the relevant Admin Studio workspace.
2. Create a new item or select an existing draft.
3. Enter or correct the content in the editor.
4. Choose **Open full preview** in the preview panel.
5. Check both **Desktop** and **Phone**.
6. Close the preview, correct any problem, and open it again.
7. Save the draft, mark it ready, and use the ordinary publication confirmation only after the preview is correct.

The full preview shows the current editor values, including unsaved changes. If required fields are incomplete, a warning appears above the preview. A preview is not proof that the content was saved.

## What stays private

- The preview opens only inside the authenticated localhost Admin Studio.
- It does not create a public link or place draft text in the learner website URL.
- It does not create or update a Firestore record.
- It does not publish a release or create an audit event.
- Closing it returns to the same editor and restores keyboard focus.

## Content-specific checks

### Program

Check the title, short label, description, learner outcome, level, duration, and accent color.

### Course

Check the program category, title, short summary, level, language, learning time, and full description.

### Lesson

Check lesson order, title, summary, reading text, video, question order, answer choices, correct-answer key, and explanation. Only a valid 11-character YouTube ID loads the privacy-enhanced player.

### Article

Check the category, featured label, title, excerpt, author, reading time, color, headings, paragraphs, and bullet lists.

## Safety boundary

The preview renders supported text as text; it does not run raw HTML. Admin Studio must remain on the owner's computer and must never be deployed with the learner website. Use the immutable release workflow for every publication and correction.
