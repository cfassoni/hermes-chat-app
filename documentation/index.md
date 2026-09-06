---
id: okf-catalog-root
title: Hermes Chat App Knowledge Base
type: catalog
version: 0.6.0
status: active

last_updated: 2026-09-06
authors:
  - Antigravity Pair Programmer
  - Celso Fassoni
tags:
  - okf
  - index
  - architecture
  - specifications
  - hermes-chat-app
---

# Hermes Chat App - Knowledge Catalog

Welcome to the central knowledge repository for the **Hermes Chat App**, organized under Google's Open Knowledge Format (OKF).

This knowledge graph is maintained continuously by human contributors and AI agents to serve as the single source of truth for architectural concepts, technical specifications, and development governance.

---

## 1. Project Governance & Standards

- **[Project Guidelines (AGENTS.md)](../AGENTS.md)**: Core Karpathy principles, American English mandate, Git standards, and Spec-Driven rules.
- **[Product Backlog & Engineering Roadmap](backlog.md)**: Centralized deliverable tracking, phase statuses, and persona assignments.
- **[AI Dev Team Personas (.agents/personas/README.md)](../.agents/personas/README.md)**: Specifications for specialized subagents (Architect, Coder, QA, Security, Reviewer).
- **[Audit & Change Log](log.md)**: Chronological history of knowledge base modifications.

---

## 2. Technical Specifications & RFCs (`specs/`)

| Specification ID | Title | Status | Concept Document |
| :--- | :--- | :--- | :--- |
| `spec-001-hermes-chat-core` | Master Specification & Architectural RFC | `active` | [SPEC-001](specs/spec-001-hermes-chat-core.md) |
| `spec-sse-streaming-protocol` | Hermes SSE Streaming Protocol & Event Parser | `active` | [SSE Streaming Protocol](specs/sse-streaming-protocol.md) |
| `spec-hitl-tool-execution` | Split-Runtime Human-In-The-Loop Tool Execution | `active` | [HITL Tool Execution](specs/hitl-tool-execution.md) |
| `spec-multimodal-audio-pipeline` | Multimodal Ingestion & Bidirectional Audio | `active` | [Multimodal & Audio Pipeline](specs/multimodal-audio-pipeline.md) |
| `spec-responsive-layout` | Responsive Layout Matrix & Design System | `active` | [Responsive Layout Matrix](specs/responsive-layout.md) |
| `spec-notification-engine` | Cross-Platform Native Notification Engine | `active` | [Notification Engine](specs/notification-engine.md) |
| `spec-windows-desktop-environment` | Windows Desktop Environment & Runtime Integration | `active` | [Windows Desktop Environment](specs/windows-desktop-environment.md) |

---

## 3. Architecture & Domain Concepts (`architecture/`)

| Concept ID | Domain Area | Status | Document |
| :--- | :--- | :--- | :--- |
| `arch-system-topology` | System Topology & Multiplatform Architecture | `active` | [System Topology](architecture/system-topology.md) |
| `arch-data-model` | SQLite Database Schema & Persistence Model | `active` | [Data Model](architecture/data-model.md) |
| `arch-multi-agent-personas` | Multi-Agent Personas & Collaboration Topology | `active` | [Multi-Agent Personas](architecture/multi-agent-personas.md) |

---

## 4. Quality & Testing Strategy (`testing/`)

| Strategy ID | Scope | Status | Document |
| :--- | :--- | :--- | :--- |
| `test-quality-strategy` | Quality Assurance & Testing Strategy | `active` | [Quality & Testing Strategy](testing/quality-and-testing-strategy.md) |

---

## 5. Design Assets & UI Concepts (`assets/mockups/`)

- **[Desktop UI Concept Mockup](assets/mockups/hermes-chat-desktop-mockup.jpg)**: Visual reference for Windows desktop & wide web viewport.
- **[Mobile UI Concept Mockup](assets/mockups/hermes-chat-mobile-mockup.jpg)**: Visual reference for Android mobile screen viewport.

---

## 6. Project Walkthroughs (`walkthroughs/`)

- **[Initial Architecture & Specifications Walkthrough](walkthroughs/initial-architecture-and-specs.md)**: End-to-end summary of the initial architectural decisions, functional requirements, and OKF knowledge graph.
- **[Multi-Agent Personas Architecture Walkthrough](walkthroughs/multi-agent-personas-walkthrough.md)**: Design, formalization, and operational mapping of the AI Dev Team personas across Antigravity, Claude Code, and OpenCode.
- **[Phase 1 Scaffolding & Multiplatform Baseline Walkthrough](walkthroughs/phase-1-scaffolding-walkthrough.md)**: Multiplatform baseline setup with Tauri v2, React 19, TypeScript, Tailwind CSS, Vitest, and Cargo test runners.
- **[Phase 2.1 SQLite Persistence & Storage Layer Walkthrough](walkthroughs/phase-2-sqlite-persistence-walkthrough.md)**: Local SQLite storage layer via bundled rusqlite in Tauri v2, DDL migrations, IPC commands, and polymorphic WebStorageAdapter.

