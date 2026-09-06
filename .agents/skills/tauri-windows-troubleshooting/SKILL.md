---
name: tauri-windows-troubleshooting
description: >-
  Provides procedures, diagnostic guidelines, and architectural guardrails for
  troubleshooting, configuring, and resolving Windows-specific runtime, networking,
  and window lifecycle issues in Tauri v2 applications (WebView2, DWM Z-order, and loopback bindings).
---

# Tauri v2 Windows Troubleshooting & Diagnostics Skill

This skill documents established patterns, diagnostic runbooks, and critical failure modes when developing, debugging, and running Tauri v2 desktop applications on Windows 11 / Windows 10.

---

## 1. Critical Failure Modes & Anti-Patterns

### A. The "Open and Immediately Closes" Trap (`set_always_on_top` Z-Order Demotion)

* **Symptom:** When running `npm run tauri dev` or launching the debug executable, a window flashes on screen for a split second and immediately vanishes. The developer assumes the application crashed or closed immediately.
* **Root Cause:**
  * When a child GUI process is launched from a terminal (e.g., PowerShell, VS Code terminal), Windows enforces `LockSetForegroundWindow`.
  * Attempting to bypass this by calling `window.set_always_on_top(true)` immediately followed by `window.set_always_on_top(false)` synchronously in the Tauri `setup` hook causes Windows Desktop Window Manager (DWM) to instantly demote the window to the bottom of the Z-order, behind all active windows.
  * The process remains completely alive in the background (`Responding: True`, HWND active), but the window is pushed behind maximized windows or hidden from user view.
* **Anti-Pattern (Never Use):**
  ```rust
  // FORBIDDEN: Causes instant window demotion on Windows
  window.set_always_on_top(true)?;
  window.set_focus()?;
  window.set_always_on_top(false)?;
  ```
* **Correct Practice:**
  Rely exclusively on standard Tauri window lifecycle methods:
  ```rust
  if let Some(window) = app.get_webview_window("main") {
      window.show()?;
      window.set_focus()?;
      window.center()?;
  }
  ```

---

### B. Loopback Address Mismatch (IPv6 `localhost` vs IPv4 `127.0.0.1`)

* **Symptom:** `tauri dev` hangs indefinitely or shows a blank/white screen while waiting for the development server.
* **Root Cause:**
  * In Node 22+ and modern Vite on Windows 11, the dev server defaults to `localhost`. On Windows, `localhost` often prioritizes IPv6 (`::1`), while Vite binds exclusively to IPv4 (`127.0.0.1`) or vice-versa.
  * Microsoft Edge WebView2 attempts connection to `::1`, resulting in connection drops (`ECONNREFUSED`) or handshake timeouts.
* **Correct Practice:**
  Explicitly lock both Vite and Tauri configuration to IPv4 loopback (`127.0.0.1`):
  * In `vite.config.ts`:
    ```ts
    server: {
      port: 1420,
      strictPort: true,
      host: host || "127.0.0.1",
    }
    ```
  * In `src-tauri/tauri.conf.json`:
    ```json
    "build": {
      "beforeDevCommand": "npm run dev",
      "devUrl": "http://127.0.0.1:1420",
      "beforeBuildCommand": "npm run build",
      "frontendDist": "../dist"
    }
    ```

---

### C. Duplicate Window Instantiation

* **Symptom:** Window fails to open, reports `Error::WindowAlreadyExists`, or behaves erratically on startup.
* **Root Cause:**
  * The window `"main"` is already declared under `"app": { "windows": [...] }` in `tauri.conf.json`.
  * Adding an `else` branch in Rust `setup` that attempts `tauri::WebviewWindowBuilder::new(app, "main", ...).build()` creates conflicting window registrations.
* **Correct Practice:**
  Treat `tauri.conf.json` as the declarative single source of truth for window properties (title, width, height, resizable). Use Rust `setup` only to query `app.get_webview_window("main")`.

---

## 2. Windows Diagnostic Runbook

When investigating suspected startup crashes or invisible windows on Windows:

### Step 1: Verify Process Liveness & Session
Run in PowerShell to confirm whether the process is alive or actually crashed:
```powershell
Get-Process -Name "hermes-chat-app" -ErrorAction SilentlyContinue |
    Select-Object Id, ProcessName, MainWindowTitle, MainWindowHandle, Responding, SessionId
```
* If `Responding: True`, the application is alive and did not panic.
* If `SessionId: 1`, the process is attached to the active interactive desktop session.

### Step 2: Inspect WebView2 Child Processes
Edge WebView2 runs out-of-process renderer and GPU threads:
```powershell
Get-CimInstance Win32_Process |
    Where-Object { $_.Name -like "*hermes*" -or $_.Name -like "*edge*" } |
    Select-Object ProcessId, ParentProcessId, Name, CommandLine
```
* Check if `msedgewebview2.exe` was spawned with the parent PID matching the Tauri executable.
* Inspect `C:\Users\<user>\AppData\Local\<identifier>\EBWebView\Crashpad` for any crash minidumps.

### Step 3: Check Windows Event Logs for Real Crashes
If the process exited unexpectedly, query Windows Error Reporting and Application logs:
```powershell
Get-WinEvent -FilterHashtable @{LogName='Application'; StartTime=(Get-Date).AddMinutes(-15)} -MaxEvents 20
```

### Step 4: Add File Logging in Rust `setup`
If Rust panics occur prior to console rendering, file logging in `setup` provides immediate insight:
```rust
let log_path = "startup_debug.log";
let _ = std::fs::write(log_path, format!("Setup status: ok\n"));
```
