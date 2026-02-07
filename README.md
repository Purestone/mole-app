# Mole.app (Electron wrapper) :video_game:

Electron shell for <http://mole.61.com/> with PPAPI Flash support, multi-window capability, and a stripped-down UI driven by a DOM cleanup script.

## What it does :sparkles:

- Loads <http://mole.61.com/> in a fixed-size window.
- Enables Pepper Flash (PPAPI) via a bundled plugin.
- Strips the page down to the Flash embed and centers it on a black background.
- Blocks external window launches (only same host is allowed).
- Adds keyboard shortcuts for new windows, reload, devtools, zoom reset, and quit.

## Requirements :clipboard:

- Node.js 18+ (for dev mode).
- Windows: PPAPI plugin at plugins/pepflashplayer64_26_0_0_131.dll (already included).

## Getting started :rocket:

1. Install dependencies:
   - npm install
2. Run the app:
   - npm start

## Packaging (Windows) :package:

- npm run package

This uses electron-packager to build a Windows x64 package into dist/ with icon_256x256.ico.

## Keyboard shortcuts :keyboard:

- CmdOrCtrl+N: New window
- CmdOrCtrl+Shift+I: Toggle DevTools
- F12: Toggle DevTools (Windows/Linux)
- CmdOrCtrl+W: Close window
- Alt+F4: Close window (Windows/Linux)
- CmdOrCtrl+R: Reload
- F5: Reload (Windows/Linux)
- CmdOrCtrl+Q: Quit
- CmdOrCtrl+0: Reset zoom

## Notes :warning:

- Flash is deprecated; use only if you trust the source.
- The window is fixed to 960x560 (plus a small title bar height).
- Menu bar is hidden on Windows/Linux; macOS keeps a minimal menu.
- Context isolation is disabled to allow Flash plugins.
- Electron version is defined in package.json (currently 11.5.0).
