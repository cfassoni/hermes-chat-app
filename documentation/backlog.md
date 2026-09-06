---
id: okf-backlog-roadmap
title: Hermes Chat App - Product Backlog & Engineering Roadmap
type: catalog
version: 1.0.0
status: active
last_updated: 2026-09-06
authors:
  - Antigravity Pair Programmer
  - Celso Fassoni
tags:
  - backlog
  - roadmap
  - agile
  - deliveries
  - personas
---

# Product Backlog & Engineering Roadmap

This document serves as the single centralized source of truth for all deliverables, phases, acceptance criteria (DoD), and multi-agent persona ownership for the **Hermes Chat App**.

---

## 1. Governance & Multi-Agent Execution Model

Each backlog item follows the collaborative lifecycle defined in [`AGENTS.md`](../AGENTS.md) and [`.agents/personas/`](../.agents/personas/):

| Persona | Role in Lifecycle |
| :--- | :--- |
| **Architect** | Authors/approves technical specifications, RFCs, and interface contracts. |
| **Coder** | Implements surgical, minimal code on dedicated feature branches (`feat/*`). |
| **QA Engineer** | Develops automated unit/integration tests and mocks (Vitest, Cargo). |
| **Security Gatekeeper** | Audits HITL policies, sandboxing, path traversal, and sensitive tokens. |
| **Reviewer** | Validates PR completeness, SemVer impact, conventional commits, and OKF docs. |

---

## 2. Phase-by-Phase Roadmap & Delivery Status

### Phase 1: Scaffolding & Multiplatform Baseline
* **Status:** `COMPLETED` (Merged in PR #1)
* **Lead Persona:** Architect / Coder
* **Deliverables:**
  - [x] Tauri v2 (Rust) native host initialization.
  - [x] React 19 + TypeScript + Vite + Tailwind CSS frontend shell.
  - [x] Baseline testing infrastructure (`npm run test` Vitest, `cargo test`).
  - [x] Google OKF documentation baseline and personas framework.
* **Verification:** Walkthrough documented in [`documentation/walkthroughs/phase-1-scaffolding-walkthrough.md`](walkthroughs/phase-1-scaffolding-walkthrough.md).

---

### Phase 2.1: Local SQLite Persistence & Storage Adapters
* **Status:** `COMPLETED` (Merged in PR #2)
* **Lead Persona:** Coder / QA Engineer
* **Deliverables:**
  - [x] Embedded bundled SQLite via `rusqlite` in Tauri v2 (`%APPDATA%/hermes-chat-app/hermes.db`).
  - [x] Schema DDL with foreign keys, cascade deletion, indices, and auto-seeding.
  - [x] Strongly typed IPC commands in Rust (`src-tauri/src/commands/db.rs`).
  - [x] Polymorphic frontend `StorageAdapter` (`TauriStorageAdapter` + `WebStorageAdapter`).
  - [x] Asynchronous UI hydration in `src/App.tsx`.
  - [x] Windows 11 debug mode fixes (IPv4 loopback `127.0.0.1` and DWM Z-order stabilization).
* **Verification:** Walkthrough documented in [`documentation/walkthroughs/phase-2-sqlite-persistence-walkthrough.md`](walkthroughs/phase-2-sqlite-persistence-walkthrough.md).

---

### Phase 2.2: Hermes SSE Streaming Protocol & Real-time Reasoning Parser
* **Status:** `READY FOR IMPLEMENTATION` (Next Immediate Epic)
* **Lead Persona:** Coder / QA Engineer
* **Specification:** [`documentation/specs/sse-streaming-protocol.md`](specs/sse-streaming-protocol.md)
* **Deliverables:**
  - [ ] **SSE Client Engine:** HTTP streaming connection to `/v1/chat/completions` supporting Server-Sent Events with Bearer token authentication.
  - [ ] **Incremental Reasoning Parser:** Real-time stream chunk parser identifying `<thought>` opening and `</thought>` closing tags across chunk boundaries.
  - [ ] **Dual-Stream UI Routing:** Routes `<thought>` tokens to collapsible reasoning accordion and final markdown text to chat message body.
  - [ ] **Network Resilience:** Auto-reconnect with exponential backoff (1s, 2s, 4s... max 30s) and status pills (Connecting, Streaming, Reconnecting, Error).
  - [ ] **Mock Hermes SSE Server:** Automated Vitest test harness simulating chunked streaming and `<thought>` token boundaries.
* **Definition of Done (DoD):**
  - Full Vitest suite covering partial tag chunks, stream drops, and malformed SSE frames.
  - Interactive streaming demonstration in React UI with collapsible reasoning block.

---

### Phase 2.3: Split-Runtime Human-In-The-Loop (HITL) Tool Execution
* **Status:** `PENDING`
* **Lead Persona:** Security Gatekeeper / Coder
* **Specification:** [`documentation/specs/hitl-tool-execution.md`](specs/hitl-tool-execution.md)
* **Deliverables:**
  - [ ] **Tool Call Interceptor:** Parser for Hermes tool call events (`terminal`, `file_edit`, `read_file`, `web_search`).
  - [ ] **HITL Authorization Modal:** UI prompt detailing command payload, target file diff, and scoped CWD with `Authorize` / `Reject` buttons.
  - [ ] **Safe Execution Engine in Rust:** Sandboxed execution via Tauri Rust commands with 30s timeout and scoped directory enforcement.
  - [ ] **Immutable Audit Logging:** Persists every execution attempt, decision, and exit code into SQLite `tool_audit_log`.
* **Definition of Done (DoD):**
  - Path traversal and malicious payload rejection verified in automated tests.
  - Audit logs verified in SQLite.

---

### Phase 2.4: Multimodal Ingestion & Bidirectional Audio Pipeline
* **Status:** `PENDING`
* **Lead Persona:** Coder / QA Engineer
* **Specification:** [`documentation/specs/multimodal-audio-pipeline.md`](specs/multimodal-audio-pipeline.md)
* **Deliverables:**
  - [ ] **Attachment Handler:** Drag-and-drop / file picker copying media to internal sandbox and converting to base64 data URIs.
  - [ ] **Audio Capture Engine:** Browser/Tauri `MediaRecorder` capturing WebM/Opus audio with 16kHz sampling.
  - [ ] **Live Waveform Visualizer:** AudioContext-driven frequency visualization during recording.
  - [ ] **Voice Push-to-Toggle:** Push-to-talk / toggle microphone button in UI dock with duration timer.
* **Definition of Done (DoD):**
  - Audio recording verified in both browser preview and native Windows desktop.

---

### Phase 3: Android Native Target & Cross-Platform Notifications
* **Status:** `PENDING`
* **Lead Persona:** Architect / Coder
* **Specifications:** [`documentation/specs/notification-engine.md`](specs/notification-engine.md) & [`documentation/specs/responsive-layout.md`](specs/responsive-layout.md)
* **Deliverables:**
  - [ ] **Android Build Harness:** Tauri v2 Android toolchain (Cargo NDK + Gradle) generating debug/release APKs.
  - [ ] **Mobile Responsive Layout:** Bottom-sheet navigation drawer and mobile viewport optimization.
  - [ ] **Notification Dispatcher:** Native notifications (Windows Action Center + Android NotificationManager) for background job completion and alarms.
* **Definition of Done (DoD):**
  - Successful APK build and verified notification receipt.

---

## 3. Backlog Item Status Overview Table

| ID | Feature / Epic | Phase | Target Branch | Primary Persona | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `FEAT-001` | Multiplatform Scaffolding Baseline | 1 | `feat/project-scaffolding` | Architect / Coder | `COMPLETED` |
| `FEAT-002` | Local SQLite Persistence & Adapters | 2.1 | `feat/sqlite-persistence` | Coder / QA Engineer | `COMPLETED` |
| `FEAT-003` | Hermes SSE Streaming & `<thought>` Parser | 2.2 | `feat/hermes-sse-streaming` | Coder / QA Engineer | `UP NEXT` |
| `FEAT-004` | Split-Runtime HITL Tool Execution | 2.3 | `feat/hitl-tool-execution` | Security / Coder | `BACKLOG` |
| `FEAT-005` | Multimodal Ingestion & Audio Pipeline | 2.4 | `feat/multimodal-audio` | Coder / QA Engineer | `BACKLOG` |
| `FEAT-006` | Android Target & Native Notifications | 3 | `feat/android-notifications` | Architect / Coder | `BACKLOG` |
