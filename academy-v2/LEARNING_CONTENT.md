# EFBI learning content and video delivery

## Phase 4 learning loop

The first protected lesson is available at `/learn/ai-foundations` after sign-in and email verification. It includes:

- short learning objectives;
- a complete written lesson;
- an accessible transcript area;
- responsive course navigation;
- a remembered low-bandwidth preference; and
- a privacy-aware video gate.

Progress is intentionally not presented as saved yet. Phase 5 will connect completion state to the authenticated learner's Firestore record.

## Add the first video

No EFBI lesson video or YouTube ID was present in the repository when Phase 4 was built. When the video is ready, add only its 11-character YouTube video ID to the ignored local environment file:

```text
VITE_AI_LESSON_01_YOUTUBE_ID=XXXXXXXXXXX
```

Do not add the full URL. Restart the development server after changing an environment value. The public `.env.example` contains an empty placeholder; the active value belongs in `.env.local` or the hosting environment.

Before publishing the video:

1. Confirm EFBI owns or has permission to use every image, music track, and clip.
2. Remove personal student information from the recording and screen captures.
3. Add accurate captions and make the written transcript match the final recording.
4. Enable embedding in YouTube Studio.
5. Test on a phone and a slow connection before announcing the lesson.

## Privacy and bandwidth behavior

The page does not contact YouTube when it first opens. A learner must choose **Load video** before the iframe is created. The player uses YouTube's privacy-enhanced `youtube-nocookie.com` domain.

Low-bandwidth mode keeps the iframe unloaded and saves that preference only in the learner's browser. The written lesson remains complete without video. This preference is not part of the learner's Firestore profile.

## Security boundary

EFBI is a free academy. Authentication protects learner accounts, future progress, and future submissions. It is not digital-rights management for free course text.

An unlisted YouTube video is not truly private or website-only. A determined viewer can discover or share its video ID, and YouTube controls the embedded player. If EFBI later needs strict video access control, it will need a video service with signed, expiring playback URLs; that usually requires a paid backend or paid video hosting.

Never put Firebase secrets, App Check debug tokens, service-account files, student exports, or private learner data in a video environment variable or in the repository.