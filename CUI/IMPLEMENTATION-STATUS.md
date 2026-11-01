# CUI implementation status

This file tracks what the current browser prototype actually does. The product specification in [README.md](README.md) remains the longer-term design.

The prototype is in `CUI/` in the `DiceeInked/abyssalbar` website repository.

## Working in the prototype

### Capture and transcript
- Records the live composition canvas and microphone audio in the browser.
- Keeps a separate audio recording so the narration can be reused while rendering a newly arranged video.
- Offers browser speech recognition where the browser exposes it.
- Shows recognized phrases as sentence cues, allows manual transcript editing, and lets a drawing be associated with a selected sentence.
- Preserves the original take for preview and download.

### Scene planning and image discovery
- Splits the transcript into sentence-based visual beats and combines longer transcripts into at most eight initial scenes.
- Creates a topic search phrase using local keyword extraction. This is deterministic text filtering, not a generative or semantic AI model.
- Searches Wikimedia Commons through its Action API for raster images.
- Requests license, creator, attribution, and file-page metadata. Results without a usable license label are not offered as scene choices.
- Selects a starting result for each scene, while allowing the user to search again and choose a different candidate.
- Queues API requests, spaces uncached searches by at least 6.5 seconds, caches repeated queries for the current page session, and respects `Retry-After` responses. The browser sends an `Api-User-Agent` identifying CUI.
- Allows start/end time edits. Initial timing is estimated from the relative length of each sentence; browser speech-recognition result times are not precise word boundaries.
- Exports an image-credit text file with the selected file pages and license information.

### First-cut rendering
- Loads the selected images and checks whether they can be drawn into a clean canvas.
- Composes image backgrounds, sentence captions, and drawing marks attached to each sentence.
- Uses the original recorded narration as the audio track.
- Renders a new video locally with the browser's `MediaRecorder`, then provides preview and download.
- Uses the video format supported by the browser. WebM is common in Chromium-based browsers; other browsers may provide a different supported format.

## Known limits

- No generative AI or language model is connected. The scene search prompt is based on extracted topic words, so a human should review every match.
- Search results are still-image suggestions from Wikimedia Commons, not a general-purpose stock video search.
- Wikimedia metadata is shown to help with crediting, but the user must review the individual file page and comply with its specific license before publishing.
- Speech recognition depends on browser support and may use browser-vendor services. It is not a guaranteed private, offline, or cross-browser transcription engine.
- Sentence timing is a starting estimate based on text length and can be edited. It is not word-level alignment.
- Rendering is client-side. Long recordings and high-resolution canvases may be slow or may exceed a device's memory.
- The export format depends on the browser. This prototype does not guarantee MP4, professional encoding settings, or a consistent format across devices.
- Projects can be exported as JSON, but durable cloud storage, project reopening, render recovery, and background jobs are not implemented.
- A backend is still needed for robust AI analysis, protected service credentials, dependable speech transcription, scalable media discovery, and consistent FFmpeg-based MP4 rendering.

## Suggested next engineering steps

1. Add an optional server-side transcription and scene-analysis endpoint, keeping provider credentials off the public website.
2. Improve semantic query generation and make the user able to inspect and edit the proposed subject for each scene.
3. Add per-scene motion presets and transitions, then let the user adjust crop, caption placement, and duration in a proper timeline.
4. Add a backend render job using FFmpeg for consistent MP4 output, real job status, and recoverable exports.
5. Add persistent project storage and a reopen-project workflow.

## External API references

- [Wikimedia Commons machine-readable metadata](https://commons.wikimedia.org/wiki/Commons:Machine-readable_data)
- [MediaWiki Imageinfo API](https://www.mediawiki.org/wiki/API:Imageinfo)
- [MediaWiki Search API](https://www.mediawiki.org/wiki/API:Search)
- [Wikimedia API rate limits](https://www.mediawiki.org/wiki/Wikimedia_APIs/Rate_limits)
- [Wikimedia API access policy and browser client identification](https://www.mediawiki.org/wiki/Wikimedia_APIs/Access_policy)

## Validation performed

The inline JavaScript was syntax-checked after the scene-engine changes. This confirms the script parses, but it is not a substitute for a full browser test. Microphone permissions, image loading/CORS, speech recognition, audio decoding, and final video capture still need hands-on testing in the target browsers.
