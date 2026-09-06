# Hermes Chat App

> A multi-platform, lightweight client designed specifically for Nous Research's **`hermes-agent`**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![SemVer](https://img.shields.io/badge/SemVer-0.3.0-success.svg)](https://semver.org/)
[![Architecture](https://img.shields.io/badge/Docs-Google%20OKF-orange.svg)](documentation/index.md)
[![Agent Guidelines](https://img.shields.io/badge/Guidelines-Karpathy%20Principles-purple.svg)](AGENTS.md)

---

## Overview

**Hermes Chat App** is a fast, responsive, and local-first cross-platform application (Windows desktop, Android mobile, and modern web) engineered to interface seamlessly with **`hermes-agent`**. 

Built with **Tauri v2**, **TypeScript**, and **SQLite**, Hermes Chat App prioritizes low resource consumption, secure split-runtime tool authorization, and real-time Server-Sent Events (SSE) streaming.

---

## Key Capabilities

* **⚡ Real-Time SSE Streaming:** Low-latency token rendering with syntax-highlighted code blocks, mathematical equations (KaTeX), and thinking trace visualization.
* **🛡️ Split-Runtime HITL Tool Authorization:** Human-in-the-loop (HITL) permission gating requiring explicit operator approval before executing shell commands, file modifications, or external API calls.
* **💾 Local-First Persistence:** Embedded SQLite engine running in WAL mode with indexed search, session history isolation, and zero third-party cloud database dependencies.
* **🎙️ Multimodal & Voice Pipeline:** Bidirectional audio transcription/speech synthesis and sandboxed media attachment handling (images, PDFs, documents).
* **📱 Responsive Layout Matrix:** Adaptive layout system designed for widescreen desktop monitors (collapsible multi-column panels) down to mobile touchscreens (collapsible bottom sheets).
* **🔔 Native Notification Engine:** Cross-platform system tray integration, background task alerts, and HITL authorization prompts.

---

## Visual Concept Mockups

| Desktop Experience (Windows / Web) | Mobile Experience (Android) |
| :---: | :---: |
| ![Desktop Concept](documentation/assets/mockups/hermes-chat-desktop-mockup.jpg) | ![Mobile Concept](documentation/assets/mockups/hermes-chat-mobile-mockup.jpg) |

---

## Project Documentation & Knowledge Base

Hermes Chat App adheres strictly to **Google's Open Knowledge Format (OKF)** using an atomic "LLM-Wiki" pattern. All architectural decisions, protocols, and technical RFCs are maintained in modular documents:

* **[Knowledge Catalog Root (`documentation/index.md`)](documentation/index.md)**: Central directory of all specifications and domain concepts.
* **[Master RFC (`documentation/specs/spec-001-hermes-chat-core.md`)](documentation/specs/spec-001-hermes-chat-core.md)**: Core functional requirements and system boundaries.
* **[SSE Streaming Protocol (`documentation/specs/sse-streaming-protocol.md`)](documentation/specs/sse-streaming-protocol.md)**: Real-time event parser and buffer specification.
* **[HITL Tool Execution (`documentation/specs/hitl-tool-execution.md`)](documentation/specs/hitl-tool-execution.md)**: Security and authorization protocol.
* **[Multi-Agent Personas Architecture (`documentation/architecture/multi-agent-personas.md`)](documentation/architecture/multi-agent-personas.md)**: Dev team persona collaboration topology.
* **[Audit & Change Log (`documentation/log.md`)](documentation/log.md)**: Version history of knowledge base updates.

---

## AI Dev Team Personas

The project utilizes specialized AI developer personas defined under [`.agents/personas/`](.agents/personas/README.md) compatible with Google Antigravity, Claude Code, and OpenCode:

| Persona | Role | Primary Scope |
| :--- | :--- | :--- |
| **[Lead Architect](.agents/personas/architect.md)** | System Design & RFCs | OKF specifications, data modeling, Karpathy simplicity. |
| **[Core Systems Engineer](.agents/personas/coder.md)** | Surgical Implementation | Lean code changes, zero speculative abstractions. |
| **[QA & Verification Engineer](.agents/personas/qa-engineer.md)** | Test Automation | Automated test suites, defect reproduction, regression gates. |
| **[Security Gatekeeper](.agents/personas/security-gatekeeper.md)** | Governance & Integrity | SemVer enforcement, Conventional Commits, branch isolation. |
| **[UI/UX Reviewer](.agents/personas/reviewer.md)** | Experience & Accessibility | Layout matrix fidelity, streaming UX ergonomics. |

---

## Engineering Guidelines & Governance

Development in this repository is governed by the principles in **[AGENTS.md](AGENTS.md)** and **[CLAUDE.md](CLAUDE.md)**:

* **Written Project Language:** All written code, comments, docstrings, specifications, commit messages, and PRs **must be in American English (`en-US`)**.
* **Karpathy Principles:** Think before coding, simplicity first, surgical changes, and goal-driven verification.
* **Branching Model:** Direct pushes to `main` are restricted to baseline bootstrap. Feature work occurs in dedicated branches (`feat/*`, `fix/*`) with Conventional Commits.

---

## Technology Stack

* **Desktop/Mobile Shell:** [Tauri v2](https://v2.tauri.app/) (Rust backend + Web frontend)
* **Frontend:** React + TypeScript + Tailwind CSS
* **Database:** SQLite (Embedded, WAL Mode)
* **Target Platforms:** Windows 10/11, Android 10+, Modern Web Browsers

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
