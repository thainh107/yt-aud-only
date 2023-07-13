## YT Audio Player
### What is this?
This is a YouTube audio-only player consisting of a Javascript frontend and Node.js backend.

### What is this written in?
- Javascript (pure),
- Node.js.

### What are some of the main features?
- Uses [node-ytdl-core](https://github.com/fent/node-ytdl-core) to acquire the URL of an audio stream only (as YouTube provides separate video and audio streams and muxes them in-browser),
- Uses the Web Audio API to natively play the audio stream,
- Uses pure JS and DOM manipulation to provide a simple and responsive UI in the form of a player and playlist,
- Uses the Web Storage API to store the playlist in local storage.

### What's the point?
Mostly familiarizing myself with the Web Audio API and practicing DOM manipulation, although there is a point to be made about this tool being useful in limited data scenarios.

### How do I use this?
1. Paste YouTube URL in the appropriate input field,
2. Select the audio in the playlist,
3. Listen.
