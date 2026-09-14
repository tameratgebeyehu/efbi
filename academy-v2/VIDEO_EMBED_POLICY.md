# EFBI video embed policy

Updated: 2026-09-14

EFBI lessons use the official YouTube embedded player because the course videos are hosted on EFBI's YouTube channel. The website must not imitate, cover, or interfere with that player.

## Product boundary

- A lesson does not contact YouTube until the learner selects **Load video**.
- The embed uses `youtube-nocookie.com`, a strict-origin referrer policy, no autoplay, and only the browser permissions needed for ordinary playback.
- Native controls and keyboard handling stay enabled with `controls=1` and `disablekb=0`.
- JavaScript control is limited to sending `pauseVideo` when the browser tab becomes hidden. The exact site origin is supplied to YouTube as required for IFrame API control.
- The complete written lesson remains available when the video is unavailable or low-bandwidth mode is enabled.

## Branding and links

EFBI must not cover the YouTube logo, Share control, Watch on YouTube link, advertisements, or any other part of the embedded player. YouTube's `modestbranding` parameter is deprecated and has no effect. Google also prohibits overlays or frames that obscure player controls. The player may therefore show YouTube branding and YouTube-controlled links.

Official references:

- [YouTube embedded player parameters](https://developers.google.com/youtube/player_parameters)
- [Required minimum functionality](https://developers.google.com/youtube/terms/required-minimum-functionality)
- [YouTube developer policies](https://developers.google.com/youtube/terms/developer-policies)
- [YouTube keyboard shortcuts](https://support.google.com/youtube/answer/7631406)

## Keyboard behavior

After the learner focuses or clicks the player, YouTube provides:

- Space or K: play or pause;
- Left or Right: seek five seconds;
- Up or Down: change volume;
- J or L: seek ten seconds;
- M: mute or unmute;
- F: full screen; and
- `<` or `>`: decrease or increase playback speed.

Tab remains a standard accessibility key that moves focus; EFBI does not override it. Switching to another browser tab pauses the current player.

## Release check

The emulator learner journey verifies the exact privacy-enhanced host, video ID, supported parameters, site origin, keyboard-enabled state, focusability, minimal permission list, visible shortcut help, written fallback, and all four module flows. A real-browser owner check is still required because YouTube controls and branding can change independently of EFBI code.
