---
id: walkthrough-initial-specs
title: Initial Architecture, Specifications & Design Walkthrough
type: walkthrough
version: 0.1.0
status: active
last_updated: 2026-09-06
authors:
  - Antigravity Pair Programmer
  - Celso Fassoni
tags:
  - walkthrough
  - architecture
  - specifications
  - okf
  - hermes-agent
  - tauri-v2
---

# Initial Architecture, Specifications & Design Walkthrough

## 1. Overview & Context

This walkthrough documents the foundational engineering, architectural definition, and specification phase for the **Hermes Chat App**, an open-source, lightweight, cross-platform client designed specifically for Nous Research's **`hermes-agent`**.

The work in this phase was conducted under the **Agile & Spec-Driven Design** methodology ("No Spec, No Code") and adheres strictly to **Google's Open Knowledge Format (OKF)** using the atomic concept ("LLM-Wiki") pattern.

---

## 2. Key Decisions & Architectural Blueprint

### 2.1 Multiplatform Runtime Stack
- **Native Host & Core:** **Tauri v2 (Rust)**
  - Native WebView binding (WebView2 on Windows; Android WebView on mobile).
  - Secure operating system boundary, spawning terminal subprocesses, filesystem management, and system-level notifications.
- **Presentation Layer:** **React 19 with TypeScript, Vite, and Tailwind CSS**
  - High-performance, streaming-capable conversational UI.
  - Markdown streaming with syntax-highlighted code blocks (Shiki/Prism) and LaTeX math rendering (KaTeX).
- **Data Persistence:** **Local-First SQLite** via Tauri SQL / `rusqlite` (IndexedDB fallback in pure Web mode).

### 2.2 Hermes Agent Split-Runtime & SSE Streaming
- **Server Connection:** Connects via HTTP/SSE (`/v1/chat/completions` or `/v1/responses` with `stream: true`) to local (`localhost:8000`), LAN, or cloud-hosted `hermes-agent` instances.
- **Protocol Nuances:** Custom parser for standard token chunks, reasoning `<thought>` accordion blocks, and `hermes.tool.progress` status events.
- **Client-Side Tool Dispatch (HITL):** Strict Human-In-The-Loop gate intercepts agent tool calls (e.g., PowerShell commands or file I/O). Prompts the user with exact command and risk rating before execution via Rust.

### 2.3 Multimodal Ingestion & Audio Pipeline
- **Sandbox Media Storage:** Uploaded files are copied into internal storage (`%APPDATA%/hermes-chat-app/media/`) for permanent message integrity.
- **Payload Limits:** 25MB for images/audio, 50MB for video/documents, up to 5 attachments per turn.
- **Voice Recording:** Push-to-toggle microphone capture (WebM/Opus or WAV PCM 16kHz) with real-time waveform visualizer.
- **No Local TTS:** Relies strictly on native audio streaming returned by Hermes.

### 2.4 Cross-Platform Notification Engine
- Native notifications via `tauri-plugin-notification` on Windows Action Center and Android System Notifications.
- Triggers on pending HITL authorizations, background generation completions, and scheduled Hermes Cron alerts.

---

## 3. Visual Design System & Responsiveness

The interface implements a strictly responsive layout matrix across Desktop (Windows/Web), Mobile (Android), and Tablets:
- **Desktop (`>= 1024px`):** Persistent, resizable sidebar with `Ctrl+B` toggle, centered reading container (`max-w-4xl`), and floating dialogs.
- **Mobile (`< 768px`):** Slide-in **Navigation Drawer** for sidebar, swipeable **Bottom Sheets** for HITL confirmations and settings, dynamic viewport height (`100dvh`) to prevent layout breakage on virtual keyboard display, and minimum 44x44px touch targets.

### High-Fidelity Design Mockups
- **Desktop Concept:** [hermes-chat-desktop-mockup.jpg](../assets/mockups/hermes-chat-desktop-mockup.jpg)  
  ![Desktop Mockup](../assets/mockups/hermes-chat-desktop-mockup.jpg)
- **Mobile Concept (Android):** [hermes-chat-mobile-mockup.jpg](../assets/mockups/hermes-chat-mobile-mockup.jpg)  
  ![Mobile Mockup](../assets/mockups/hermes-chat-mobile-mockup.jpg)

---

## 4. Google OKF Knowledge Graph Structure

The knowledge base was decomposed into atomic concepts, categorized in [`documentation/index.md`](../index.md) and audited in [`documentation/log.md`](../log.md):

```
documentation/
├── index.md                                   # Central Knowledge Catalog
├── log.md                                     # Audit & Change Log
├── architecture/
│   ├── system-topology.md                     # Runtime & Component Topology
│   └── data-model.md                          # SQLite Relational Schema
├── specs/
│   ├── spec-001-hermes-chat-core.md           # Master RFC & Acceptance Criteria
│   ├── sse-streaming-protocol.md              # SSE Event Parsing & Resilience
│   ├── hitl-tool-execution.md                 # Split-Runtime Tool Security Gate
│   ├── multimodal-audio-pipeline.md           # Media Sandbox & Voice Recording
│   ├── responsive-layout.md                   # Breakpoints & UI System
│   └── notification-engine.md                 # Native Notification Dispatcher
├── testing/
│   └── quality-and-testing-strategy.md        # Vitest, Cargo Test & Test Harness
├── walkthroughs/
│   └── initial-architecture-and-specs.md      # This Walkthrough Document
└── assets/
    └── mockups/
        ├── hermes-chat-desktop-mockup.jpg
        └── hermes-chat-mobile-mockup.jpg
```

---

## 5. Next Steps & Implementation Roadmap

1. **Commit & Pull Request Preparation:** Commit this documentation milestone on branch `docs/initial-specifications-and-architecture` and prepare PR description for review.
2. **Project Scaffolding Branch (`feat/project-scaffolding`):**
   - Initialize Vite + React 19 + TypeScript + Tailwind CSS structure.
   - Initialize Tauri v2 (`src-tauri`) with Rust dependencies.
   - Configure Vitest and Cargo test runners.
