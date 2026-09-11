# EFBI learning content and video delivery

## Current learning loop

All four protected lessons are available after sign-in and email verification:

1. Understanding artificial intelligence.
2. Prompting with purpose.
3. Responsible use.
4. Build an Ethiopian solution.

Each lesson includes short objectives, a complete written version, responsive course navigation, a remembered low-bandwidth preference, and a privacy-aware video gate. Lessons 2, 3, and 4 include three-question knowledge checks with immediate feedback.

Progress is saved only after the learner deliberately chooses **Mark lesson complete**. The base course route resumes the first unfinished published lesson after refresh or sign-in.

## Add lesson videos

No EFBI lesson video or YouTube ID was present when Phase 8 was verified. When recordings are ready, add only each video's 11-character YouTube ID to the ignored local environment file:

```text
VITE_AI_LESSON_01_YOUTUBE_ID=XXXXXXXXXXX
VITE_AI_LESSON_02_YOUTUBE_ID=YYYYYYYYYYY
VITE_AI_LESSON_03_YOUTUBE_ID=ZZZZZZZZZZZ
VITE_AI_LESSON_04_YOUTUBE_ID=AAAAAAAAAAA
```

Do not add full URLs. Restart the development server after changing an environment value. The public `.env.example` contains empty placeholders; active values belong in `.env.local` or the hosting environment.

Before publishing a video:

1. Confirm EFBI owns or has permission to use every image, music track, and clip.
2. Remove personal student information from the recording and screen captures.
3. Add accurate captions and make the written transcript match the final recording.
4. Enable embedding in YouTube Studio.
5. Test on a phone and a slow connection before announcing the lesson.

## Privacy and bandwidth behavior

The page does not contact YouTube when it first opens. A learner must choose **Load video** before the iframe is created. The player uses YouTube's privacy-enhanced `youtube-nocookie.com` domain.

Low-bandwidth mode keeps the iframe unloaded and saves that preference only in the learner's browser. The written lesson remains complete without video. This preference is not part of the learner's Firestore profile.

## Knowledge checks

Knowledge-check answers in Lessons 2, 3, and 4 are evaluated only in the browser and are not stored. This keeps the exercise low-pressure and avoids collecting unnecessary learner data.

The correct answers are necessarily included in the downloaded application code. These checks support learning but cannot prove independent work and must not be used to issue certificates.

The public certificate page now states that certificate eligibility requires a separate reviewed final assessment and project submission. Browser knowledge checks never issue a certificate or write an eligibility result.

A 100% progress record means only that the learner marked all four lessons complete. See ASSESSMENT_AND_SUBMISSIONS.md for the proposed human-reviewed project boundary.

## Content versioning

Published lesson slugs and completion meaning are durable records. Follow COURSE_VERSIONING.md before changing a published learning objective, required lesson, or course structure.

## Security boundary

EFBI is a free academy. Authentication protects learner accounts, progress, and future submissions. It is not digital-rights management for free course text.

An unlisted YouTube video is not truly private or website-only. A determined viewer can discover or share its video ID, and YouTube controls the embedded player. If EFBI later needs strict video access control, it will need a video service with signed, expiring playback URLs; that usually requires a paid backend or paid video hosting.

Never put Firebase secrets, App Check debug tokens, service-account files, student exports, or private learner data in a video environment variable or in the repository.