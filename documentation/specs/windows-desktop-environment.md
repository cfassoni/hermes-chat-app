---
id: spec-windows-desktop-environment
title: Windows Desktop Environment & Runtime Integration
type: specification
version: 0.1.0
status: active
last_updated: 2026-09-06
authors:
  - Antigravity Pair Programmer
  - Celso Fassoni
tags:
  - windows
  - tauri-v2
  - webview2
  - runtime
  - networking
  - dwm
---

# Windows Desktop Environment & Runtime Integration

This specification formalizes the native Windows 11 / Windows 10 runtime architecture, networking configurations, and window lifecycle requirements for the **Hermes Chat App**.

---

## 1. Executive Summary

Hermes Chat App executes on Windows as a native dual-process architecture:
1. **Host Process (`hermes-chat-app.exe`):** A compiled Rust binary leveraging Tauri v2 and Tao/Wry for native system integration, SQLite database persistence, and local hardware access.
2. **WebView2 Render Engine (`msedgewebview2.exe`):** Out-of-process Evergreen Microsoft Edge Chromium WebView2 instance rendering the React 19 / Tailwind CSS presentation layer.

To ensure stability, fast startup in development mode, and robust window presentation, specific Windows platform constraints must be respected.

---

## 2. Loopback Networking Architecture (`127.0.0.1`)

### The IPv6 / IPv4 Resolution Hazard
On Windows 11 with Node.js 22+, standard `localhost` hostnames resolve preferentially to IPv6 loopback (`::1`). However, standard Node/Vite development servers bind to IPv4 loopback (`127.0.0.1`) by default unless dual-stack binding is explicitly configured.

When Microsoft Edge WebView2 boots and attempts navigation to `http://localhost:1420`, connection delays or `ECONNREFUSED` errors can occur, stalling application startup in development mode.

### Mandatory IPv4 Loopback Standard
* In `vite.config.ts`, `server.host` MUST be locked to `"127.0.0.1"`.
* In `src-tauri/tauri.conf.json`, `build.devUrl` MUST be locked to `"http://127.0.0.1:1420"`.

---

## 3. Window Lifecycle & DWM Z-Order Governance

### Windows Foreground Lock (`LockSetForegroundWindow`)
Windows enforces security policies preventing background or child processes spawned from a console/terminal from stealing user focus or forcing themselves above existing top-level windows.

### The `set_always_on_top` Demotion Anti-Pattern
* Synchronously cycling `window.set_always_on_top(true)` followed immediately by `window.set_always_on_top(false)` during the Tauri `setup` hook causes Windows Desktop Window Manager (DWM) to demote the window to the bottom of the Z-order.
* This produces a visual artifact where the window flashes for a single frame and vanishes behind active IDE or terminal windows, appearing to the user as an immediate crash or unexpected closure.

### Standard Window Elevation Protocol
Window initialization in `src-tauri/src/lib.rs` must adhere strictly to standard, non-interfering Tauri v2 window APIs:
```rust
if let Some(window) = app.get_webview_window("main") {
    let _ = window.show();
    let _ = window.set_focus();
    let _ = window.center();
}
```

---

## 4. Single Source of Truth for Windows Configuration

* Window geometry, title, and initial states must be declared in `src-tauri/tauri.conf.json` under `"app": { "windows": [...] }`.
* The Rust `setup` hook must NEVER attempt redundant window creation (`WebviewWindowBuilder::new`) for windows already defined in the configuration.

---

## 5. Related Concepts & References

- [System Topology Architecture](../architecture/system-topology.md)
- [Data Model & SQLite Persistence](../architecture/data-model.md)
- [Tauri Windows Troubleshooting Skill](../../.agents/skills/tauri-windows-troubleshooting/SKILL.md)
- [Phase 2.1 SQLite Persistence Walkthrough](../walkthroughs/phase-2-sqlite-persistence-walkthrough.md)
