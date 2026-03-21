# Mole.app :video_game:

>唱别久悲不成悲  
>十分红处竟成灰  
>愿谁记得谁  
>最好的年岁

A lightweight Electron shell for playing [Mole's World (摩尔庄园)](http://mole.61.com/) with baked-in PPAPI Flash support, multi-window capability, and a stripped-down UI driven by a DOM cleanup script.

## What it does :sparkles:

- Loads the Mole game client in a fixed-size window (960x560).
- Enables Pepper Flash (PPAPI) natively via a bundled plugin.
- Strips the web page down to the core Flash embed and centers it on a black background.
- Blocks external window launches to keep your gameplay distraction-free.
- **Incognito Mode:** Supports private windows that clear session data upon closing.
- **Server Selection:** (macOS Native Menu) Switch seamlessly between Official, Parallel, and Sub-node servers.
- **Version Selection:** Access various historical game eras including Main, Knight, Christmas, Halloween, Fire Cup, and Taoyuan versions.
- **State Persistence:** Remembers your last played server and version across app restarts.
- Useful keyboard shortcuts for reloading, toggling devtools, and managing windows.

## Requirements :clipboard:

- Node.js 18+ (for dev mode).
- macOS: PPAPI plugin located at `plugins/PepperFlashPlayer.plugin`.

## Getting started :rocket:

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the app:

   ```bash
   npm start
   ```

## Keyboard shortcuts :keyboard:

- `Cmd+N`: New window
- `Cmd+Shift+N`: New Incognito window
- `Cmd+Option+I`: Toggle DevTools
- `Cmd+W`: Close window
- `Cmd+R`: Reload
- `Cmd+Q`: Quit application

## Notes :warning:

- **Security Warning:** Flash is officially deprecated. This application is intended solely for accessing trusted Mole environments.
- The window is fixed to 960x560.
- Uses a macOS native minimal menu providing Server/Version selection.
- Context isolation is disabled to properly allow Flash plugins to function.
