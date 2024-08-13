# DiFA Logviewer

## Getting started

- NodeJS >= 18.x required
- `npm install`
- `npm run dev`
- In your browser, navigate to `http://localhost:5173/`
- To load alternative screencasts, add a URL parameter like this `http://localhost:5173/?sequence=MyScreencast.mp4`
- To add screencasts, make sure the following files are present (public/Screencsts):
- - MyScreencast.mp4
- - MyScreencast.mp4.json
- - MyScreencast.mp4.events.json

TODO:
- Adding an offset (in seconds) to synchronize the beginning of the video with the start of the event-stream (ts_begin) - or cut the beginning if the video
- Add a filter for event types