# CUI (Creator UI)

CUI stands for **Creator UI**. This document describes a browser-based, voice-and-drawing-driven video creation tool. The working product name is **InkStudio**; that name is provisional and can be changed later.

The goal is to let someone make a polished first cut of a short-form video by recording their voice, drawing visual directions while they speak, and letting the application assemble the edit. The result should be an editable starting point, not a locked, one-click final that cannot be corrected.

## Product idea

CUI is a lightweight creative studio built around a simple workflow:

1. Start a project and choose an aspect ratio and editing style.
2. Record a voice track in the browser.
3. Draw on a canvas while speaking. Drawings and actions are timestamped so the editor can associate them with the relevant speech.
4. Submit the recording for processing.
5. Watch a real progress indicator while the application transcribes the audio, interprets the drawing cues, finds or prepares visuals, builds scenes, and renders the video.
6. Review the generated cut, make corrections, and export an MP4 for final polishing in another editor.

The central idea is **speak, draw, guide, generate**. The user should not need to learn a traditional video editor to get a strong first cut.

## Main workspace

The workspace should be organized around four primary areas:

- **Preview:** Shows the current generated video or the scene being reviewed.
- **Drawing canvas:** Supports mouse, stylus, and touch input where available. It can be used during recording and for later annotations.
- **Recording controls:** Start, pause, resume, and finish recording, with a timer and live audio waveform or level display.
- **Timeline / event track:** Shows audio, transcript segments, drawings, visual selections, scene boundaries, and generated clips in time order.

The interface should be clean and approachable, with a dark visual theme as a sensible starting point. It should feel like a focused creative tool rather than a dense professional editor. The layout should remain usable on desktop first; mobile and tablet support can be expanded after the core workflow works.

## Recording and synchronized input

The application should capture more than just an audio file. It should preserve a synchronized event log containing:

- The recorded audio.
- Speech transcription and word or phrase timestamps.
- Sentence boundaries.
- Drawing strokes, including their timestamps and canvas coordinates.
- Drawing-tool changes and relevant keyboard actions.
- User-added notes, labels, and visual cues.

Each event should use a consistent project-relative timebase so it can be matched to the audio. The system should retain the original recording and event log so the video can be regenerated without asking the user to record again.

A useful optional action is **attach current drawing to current sentence**. This gives the user a reliable way to connect a sketch to a particular part of their narration, even if the automatic speech alignment is imperfect.

## Drawing tools and visual instructions

The drawing canvas should support a small set of quick tools:

| Tool or gesture | Intended meaning |
| --- | --- |
| Pen / freehand sketch | Provide a visual reference or rough object idea |
| Circle | Emphasize a subject or region |
| Arrow | Indicate direction, movement, or a relationship |
| Rectangle / box | Mark an area or frame a subject |
| Text | Supply exact words to display |
| Highlighter | Give an area or subject extra attention |
| Eraser | Remove marks |
| Undo / redo | Correct recent drawing actions |

These marks are **editing guidance**, not a promise that every sketch will be perfectly reconstructed. The generation engine should interpret them as cues and allow the user to correct the result. A sketch can be used as an overlay, a composition guide, a reference for image selection, or an instruction for a generated graphic, depending on the chosen mode.

## Keyboard controls

Keyboard shortcuts should make the recording experience quick. The initial proposed map is:

| Key | Action |
| --- | --- |
| Space | Pause / resume recording when recording controls have focus |
| R | Start / stop recording |
| D | Toggle drawing mode |
| E | Select eraser |
| H | Select highlighter |
| Z | Undo the most recent canvas action |
| Ctrl+Z / Cmd+Z | Undo, with standard platform behavior |
| Enter | Submit the finished recording for generation when the project is ready |
| Esc | Exit the current tool or dismiss a temporary interaction |

Shortcuts must not unexpectedly trigger while the user is typing in a text field. They should be discoverable, configurable, and displayed in a shortcuts/help panel. Avoid assigning the same key to conflicting actions in the same context.

## Editing modes

Modes determine how narration, visuals, and drawing cues are combined. They should be modular so new modes can be added without rebuilding the recording and rendering systems.

1. **Image per word:** Changes the visual for each spoken word. This is an intentionally fast, experimental style and should support sensible fallbacks for common words, names, and words that do not make good image-search queries.
2. **Sentence mode:** Displays one sentence at a time with animated typography and timed transitions.
3. **Keyword mode:** Finds important words or phrases and chooses visuals for those moments instead of searching for every word.
4. **Highlight mode:** Displays the full sentence as captions while emphasizing the currently spoken word.
5. **Montage mode:** Selects visuals based on the meaning of the narration, with image changes, motion, and occasional text cards.
6. **Sketch-driven mode:** Uses the user's drawings as visual references, overlays, composition guides, or instructions for matching visuals.
7. **Explainer mode:** Builds a clear sequence of captions, diagrams, labels, and supporting imagery for educational or explanatory narration.
8. **Short-form mode:** Uses vertical framing, readable captions, energetic pacing, and compact scenes suitable for YouTube Shorts and similar platforms.

Modes should be selectable per project. A future version may allow mixing modes across different sections of one video.

## Visual discovery and media handling

The original concept was to search Google Images for each spoken word and display the first result. That behavior is a useful inspiration, but the implementation should **not depend on scraping Google Images or blindly using the first search result**. Search result order is not a stable API, scraping may violate provider terms, and an image being visible in search does not mean it is licensed for reuse.

Instead:

- Use a supported image or media search API whose terms permit the intended use.
- Track source, creator, license, and attribution requirements for every selected asset.
- Prefer reusable/licensed media and user-provided assets.
- Let users replace an image they dislike and pin an image so regeneration does not change it.
- Cache results within a project to avoid repeated searches for the same term.
- Provide a placeholder or alternate visual when no suitable asset is found.
- Do not imply that every search result is free to use.

The image-per-word mode should be optimized carefully. Searching for every token can be slow, noisy, and visually repetitive. Common words may be grouped, ignored, or represented by typography, while meaningful terms receive image searches. The user should be able to change this behavior.

## Processing pipeline and progress display

After submission, the backend should run a sequence of observable tasks:

1. Validate and store the recording and event log.
2. Transcribe the audio and obtain word- or phrase-level timestamps.
3. Segment the transcript into sentences and meaningful visual beats.
4. Match drawing events to the relevant speech segments.
5. Discover or prepare images, footage, and graphics.
6. Build a scene plan using the selected editing mode.
7. Assemble audio, visuals, captions, motion, and transitions.
8. Render the final video and make it available for preview and export.

The processing screen must show a **real progress bar and current task**, not a decorative animation with invented percentages. The backend should report task states and progress. Where exact percentage is unavailable, show an honest stage indicator such as “Finding visuals” or “Rendering” rather than fabricating precision. The UI should also show failures, allow safe retries, and preserve completed work when possible.

## Preview and correction

Before export, users should be able to:

- Play the generated video with synchronized audio.
- Edit transcript text and correct sentence boundaries.
- Replace, remove, or pin selected images and clips.
- Adjust image duration and transition speed.
- Reposition or remove captions and drawing overlays.
- Change the editing mode and regenerate.
- Adjust the aspect ratio.
- Re-render without recording the narration again.

The generated video is a first cut. The application should make correction easy rather than expecting the automatic editor to be perfect.

## Export and project management

Initial export target:

- MP4 video.
- 16:9, 9:16, and 1:1 aspect ratios.
- Resolution and frame-rate options appropriate to the selected output.
- Original audio retained and synchronized.
- Optional user-supplied background music, with volume controls and clear separation from narration.

Projects should be saveable and reopenable. The application should preserve source audio, transcript, drawing events, selected media, scene plan, and render settings. Users should be able to resume after a failed render or revisit a project later.

## Technical architecture

A browser-only static page is not enough for the complete product. The interface can run in the browser, but transcription, media discovery, secure API access, and reliable video rendering need backend services.

Suggested architecture:

- **Frontend:** HTML/CSS/JavaScript or a suitable frontend framework. Use browser recording APIs (such as MediaRecorder), pointer events for drawing, and a canvas or SVG-based drawing layer.
- **Audio transcription:** A speech-to-text service that can return word- or segment-level timestamps.
- **Event model:** A project timeline/event log that stores audio-relative timestamps for speech, strokes, tool changes, and user actions.
- **Media discovery:** A supported image/video provider with documented API access and reuse/license metadata.
- **Backend:** A server or serverless job system to coordinate transcription, media lookup, scene planning, and rendering. Keep API secrets on the server, never in browser code.
- **Rendering:** FFmpeg or an equivalent rendering pipeline for combining audio, images, captions, motion, transitions, and video clips.
- **Progress updates:** A job-status endpoint with polling or server-sent events / WebSockets so the frontend can display genuine processing progress.
- **Storage:** Secure project storage for recordings, drawings, media references, intermediate files, and exports.

The exact providers and hosting platform are implementation choices. They should be selected based on cost, licensing, reliability, and the expected length and volume of recordings.

## Privacy, security, and reliability

Voice recordings and drawings can be personal. The application should explain what is uploaded and which services process it. Use secure transport, restrict access to project files, keep API credentials server-side, and provide a way to delete projects and their stored media. Do not retain recordings indefinitely without a clear user-facing reason.

The application should handle microphone permission denial, interrupted recordings, upload failures, unavailable media providers, transcription errors, render failures, and browser refreshes without silently losing the user's work. Autosave project metadata and preserve the original recording before starting expensive processing.

## Suggested development stages

### Stage 1: Recording and drawing prototype
- Build the main workspace.
- Record audio in the browser.
- Draw with mouse or touch.
- Timestamp strokes and keyboard actions against the recording.
- Save and replay the audio with the event log.

### Stage 2: Transcription and timeline
- Add speech-to-text.
- Display the transcript with timestamps.
- Segment sentences.
- Associate drawings with speech using timestamps and an optional attach-to-sentence action.

### Stage 3: First complete video export
- Implement sentence mode and highlight mode.
- Add basic captions, still images, and transitions.
- Render a real MP4.
- Add a truthful processing-stage display.

### Stage 4: Automatic visuals and editing modes
- Add supported media search and source/license tracking.
- Implement image-per-word, keyword, montage, and sketch-driven modes.
- Add caching and image replacement.

### Stage 5: Editor and polish
- Add preview corrections, pinned assets, aspect ratios, background music, project saving, retry handling, and more polished motion graphics.
- Expand to explainer and short-form presets.

## Initial acceptance criteria

The first usable version should be considered successful when a user can:

- Record narration in the browser and play it back.
- Draw while recording and see the drawing events aligned to the recording.
- Submit the project and see the actual processing stage.
- Generate a video with synchronized narration and captions.
- Preview the result and correct at least the transcript and selected visuals.
- Export a playable MP4.
- Reopen the project without losing its source recording or drawing timeline.

## Product principles

- **The user's intent comes first:** Drawings and explicit choices should take priority over automated guesses.
- **Editable by default:** Generated results should be easy to correct and regenerate.
- **Honest progress:** Show real task progress and never fake a percentage.
- **Responsible media use:** Respect provider terms, licenses, and attribution.
- **Modular modes:** New editing styles should reuse the same recording, event, and rendering foundations.
- **Fast to use:** Common actions should be available through simple controls and keyboard shortcuts.
- **A strong first cut:** Optimize for a useful, polished starting video that can be fine-tuned in another editor.

---

**Status:** Product concept and technical plan. This document does not claim that the application has been implemented yet.
