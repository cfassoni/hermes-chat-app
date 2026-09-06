---
id: test-quality-strategy
title: Quality Assurance & Testing Strategy
type: specification
version: 0.1.0
status: active
last_updated: 2026-09-06
authors:
  - Antigravity Pair Programmer
  - Celso Fassoni
tags:
  - testing
  - quality
  - vitest
  - cargo-test
  - criteria
---

# Quality Assurance & Testing Strategy

## Overview
In accordance with Karpathy Principle 4 (*Goal-Driven Execution*), every component requires verifiable, declarative tests before and after implementation.

## Automated Testing Strategy

### 1. Frontend Unit Tests (Vitest + React Testing Library)
- **SSE Stream Parser:** Validates token delta stitching, reasoning `<thought>` encapsulation, and error recovery.
- **State Reducers:** Tests session switching, multi-turn message appending, and background session states.
- **Audio Recorder Hook:** Validates WebM audio blob creation, timer elapsed calculation, and discard flows.
- **Attachment Ingestion:** Tests file validation, size limit checks, and base64 encoding pipelines.

### 2. Backend Unit Tests (Rust `cargo test`)
- **Tool Dispatcher:** Tests process spawning, timeout abort logic, and stdout/stderr capture.
- **Security Engine:** Validates exact-command matching and directory boundary enforcement.
- **SQLite Migrations:** Tests database schema creation, CRUD operations, and transaction rollbacks.

### 3. Integration & Mock Harness
- **Mock Hermes SSE Server:** Automated lightweight Node.js/Rust mock server simulating:
  - Standard token streaming.
  - Multi-step tool execution loop (`tool_calls` -> output -> text completion).
  - Premature connection drop and resume handling.

## Definition of Done (DoD)
A feature or phase is considered complete only when:
1. [ ] Code compiles cleanly across Windows and Web targets without warnings.
2. [ ] All associated unit and integration tests pass with 100% green status.
3. [ ] No regression introduced in existing test suites.
4. [ ] Documentation updated to reflect changes in compliance with Google OKF.

## Related Concepts
- [System Topology](../architecture/system-topology.md)
- [SSE Streaming Protocol](../specs/sse-streaming-protocol.md)
- [HITL Tool Execution](../specs/hitl-tool-execution.md)
