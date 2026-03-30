# Claude SplitView

A lightweight Electron desktop app that lets you run multiple Claude AI conversations side by side. No more switching between chats — work on multiple projects simultaneously.

> **Status: Work in Progress** — MVP is functional. Auth, split panes, and keyboard shortcuts all work. More features coming.

![Electron](https://img.shields.io/badge/Electron-33+-47848F?logo=electron&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-Windows-blue?logo=windows)
![License](https://img.shields.io/badge/License-MIT-green)

## What It Does

- Opens 2–4 Claude AI panes side by side in a single window
- Each pane is a full claude.ai session — chat, upload files, use artifacts, everything
- Sign in once with Google and all panes are authenticated
- Toolbar with pane indicators, add/close/reload buttons
- Keyboard shortcuts for fast pane switching

## Quick Start

### Prerequisites

- [Node.js 20 LTS](https://nodejs.org) or newer
- A Claude AI account (free or Pro)

### Install and Run

```bash
git clone https://github.com/mamamia0729/claude-splitview.git
cd claude-splitview
npm install
npm start
```

### Sign In

1. Click **Continue with Google** on either pane
2. A sign-in window opens — log in with your Google account
3. Both panes authenticate automatically (shared session)

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+1` / `Ctrl+2` / `Ctrl+3` / `Ctrl+4` | Focus pane 1–4 |
| `Ctrl+N` | Add new pane (max 4) |
| `Ctrl+W` | Close active pane |
| `Ctrl+\` | Reset to equal split |

## Build Installer (.exe)

```bash
npm run build
```

The installer will be in the `dist/` folder.

## Project Structure

```
claude-splitview/
  main.js              # Electron main process — window, panes, auth, shortcuts
  preload.js           # Security bridge for toolbar <> main process
  package.json         # Dependencies and build config
  renderer/
    index.html         # Toolbar UI
    styles.css         # Toolbar styling
    app.js             # Toolbar logic
  assets/
    icon.ico           # App icon (Windows)
    icon.png           # App icon (PNG)
```

## How It Works

The app is a thin Electron wrapper around claude.ai. Each pane is a `WebContentsView` that loads the real claude.ai website. All panes share the default Electron session, so one login authenticates everything. Google OAuth popups are handled natively by Electron with `window.opener` preserved, so the auth callback works exactly like it does in a regular browser.

## Roadmap

- [x] Two-pane split view
- [x] Google OAuth sign-in
- [x] Add/remove panes (up to 4)
- [x] Keyboard shortcuts
- [ ] Draggable divider to resize panes
- [ ] Horizontal/vertical split toggle
- [ ] Pane labels (name your projects)
- [ ] Save/restore layout presets
- [ ] Mixed content panes (docs, GitHub alongside chat)
- [ ] System tray with global hotkey
- [ ] macOS and Linux builds

## Troubleshooting

**Blank panes:** Check your internet connection. The app loads claude.ai live.

**Login issues:** Click Reload in the toolbar, then try signing in again.

**Passkey popup (Windows Security):** Just click Cancel — Google will fall back to email/password.

## License

MIT
