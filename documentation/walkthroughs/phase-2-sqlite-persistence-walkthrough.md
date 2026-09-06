---
id: walkthrough-phase-2-sqlite-persistence
title: Phase 2.1 SQLite Persistence & Storage Layer Walkthrough
type: walkthrough
version: 0.1.0
status: active
last_updated: 2026-09-06
authors:
  - Antigravity Pair Programmer
  - Celso Fassoni
tags:
  - walkthrough
  - sqlite
  - rusqlite
  - persistence
  - tauri-v2
  - storage-adapter
  - okf
---

# Phase 2.1 SQLite Persistence & Storage Layer Walkthrough

## 1. Overview & Objectives

This walkthrough documents the delivery of **Phase 2.1: Local SQLite Persistence Layer & Storage Adapters** for the **Hermes Chat App**.

The primary objective was transforming the application from an ephemeral UI into a true **local-first, offline-capable** system. In desktop mode (Windows), data is managed and stored in a native SQLite database located at `%APPDATA%/hermes-chat-app/hermes.db` via Tauri v2 and `rusqlite` (bundled). For browser execution, a polymorphic `WebStorageAdapter` transparently falls back to `localStorage`.

---

## 2. Architectural Decisions & Implementation Details

### 2.1 Bundled SQLite Engine (`src-tauri/`)
- **Engine Choice:** Adopted `rusqlite = { version = "0.32", features = ["bundled"] }`. Bundling SQLite directly into the Rust static library eliminates runtime dynamic linking errors on Windows and future target platforms (Android).
- **Thread-Safe State:** The database handle is wrapped in `std::sync::Mutex<rusqlite::Connection>` and managed via Tauri's state container (`app.manage(database)`).
- **In-Memory Testing:** Implemented `Database::in_memory()` allowing comprehensive, deterministic unit testing in memory without touching disk.

### 2.2 Schema & Migrations (`src-tauri/src/db/schema.rs`)
Conforms strictly to the data model defined in [`documentation/architecture/data-model.md`](../architecture/data-model.md):
- **`workspaces`**: Organizes projects, custom system prompts, and scoped working directory (`scoped_cwd`).
- **`sessions`**: Conversational threads tied to workspaces with model configuration and pinned state. Foreign key cascade enabled (`ON DELETE CASCADE`).
- **`messages`**: Multi-turn dialogue history storing role, visible content, Hermes `<thought>` reasoning text, token usage metadata, and creation timestamps.
- **`attachments`**: Tracks files copied to internal app storage.
- **`connection_profiles`**: Stores Hermes endpoints, models, and parameter overrides.
- **`tool_audit_log`**: Immutable audit log capturing tool invocations, HITL decisions, and command exit codes.
- **Auto-Seeding:** If the database is initialized empty, initial seed records (General Workspace, Welcome Chat, introductory greeting message, and default profile) are created automatically.

### 2.3 IPC Commands Layer (`src-tauri/src/commands/db.rs`)
Exposed strongly typed Tauri commands registered in `lib.rs`:
- `db_get_workspaces`, `db_create_workspace`, `db_delete_workspace`
- `db_get_sessions`, `db_create_session`, `db_update_session_title`, `db_delete_session`
- `db_get_messages`, `db_save_message`, `db_delete_message`
- `db_get_connection_profiles`, `db_save_connection_profile`
- `db_log_tool_execution`, `db_get_tool_audit_logs`

### 2.4 Frontend Polymorphic Storage Adapter (`src/services/storage/`)
- **`StorageAdapter` Interface (`types.ts`)**: Pure abstraction layer defining asynchronous CRUD operations.
- **`TauriStorageAdapter` (`TauriStorageAdapter.ts`)**: Bridges frontend calls to Tauri Rust commands via `@tauri-apps/api/core` `invoke()`.
- **`WebStorageAdapter` (`WebStorageAdapter.ts`)**: Provides web/preview storage support with cascade deletion and seed defaults.
- **Factory (`index.ts`)**: Auto-detects runtime environment (`__TAURI_INTERNALS__` presence) and serves the active singleton.
- **UI Integration (`src/App.tsx`)**: Replaced hardcoded initial state with reactive hydration from the active storage adapter on component mount.

---

## 3. Directory Structure Updates

```text
hermes-chat-app/
├── src-tauri/
│   ├── Cargo.toml                             # Added rusqlite (bundled), uuid, chrono
│   └── src/
│       ├── lib.rs                             # App data dir resolution, DB init, command handlers
│       ├── commands/
│       │   ├── mod.rs                         # Command modules declaration
│       │   └── db.rs                          # Tauri IPC command implementations
│       └── db/
│           ├── mod.rs                         # Database struct, thread-safe connection, unit tests
│           ├── models.rs                      # Strongly-typed Rust entity models
│           └── schema.rs                      # DDL schema, migrations, auto-seeding
├── src/
│   ├── App.tsx                                # Connected to StorageAdapter for dynamic persistence
│   ├── services/
│   │   └── storage/
│   │       ├── index.ts                       # Environment detection & factory
│   │       ├── types.ts                       # StorageAdapter interface & storage types
│   │       ├── TauriStorageAdapter.ts         # Tauri IPC adapter
│   │       └── WebStorageAdapter.ts           # Browser localStorage adapter
│   ├── tests/
│   │   ├── setup.ts                           # Added robust localStorage test mock
│   │   ├── smoke.test.tsx                     # Updated with async waitFor for DB hydration
│   │   └── storage.test.ts                    # Full CRUD & cascade deletion unit tests
│   └── types/
│       └── index.ts                           # Added scopedCwd, customSystemPrompt to Workspace
└── documentation/
    ├── index.md                               # Catalog registration of Phase 2.1 walkthrough
    ├── log.md                                 # Change log audit record
    └── walkthroughs/
        └── phase-2-sqlite-persistence-walkthrough.md # This document
```

---

## 4. Verification & Testing Proof

### 4.1 Backend Rust Tests (`cargo test`)
Command executed:
```bash
cd src-tauri && cargo test
```
Result:
```text
running 2 tests
test tests::test_greet ... ok
test db::tests::test_in_memory_db_seeding_and_crud ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

### 4.2 Backend Rust Sanity Check (`cargo check`)
Command executed:
```bash
cd src-tauri && cargo check
```
Result:
```text
Finished `dev` profile [unoptimized + debuginfo] target(s) in 2.40s (Exit Code 0)
```

### 4.3 Frontend Unit Tests (Vitest)
Command executed:
```bash
npm run test
```
Result:
```text
 ✓ src/tests/storage.test.ts (4 tests) 9ms
 ✓ src/tests/smoke.test.tsx (1 test) 152ms

 Test Files  2 passed (2)
      Tests  5 passed (5)
   Duration  4.24s
```

### 4.4 Frontend Production Build (`npm run build`)
Command executed:
```bash
npm run build
```
Result:
```text
vite v6.4.3 building for production...
✓ 1596 modules transformed.
dist/index.html                   0.64 kB │ gzip:  0.39 kB
dist/assets/index-GpL7tDVM.css   21.06 kB │ gzip:  4.65 kB
dist/assets/index-DLOjs9q7.js   215.14 kB │ gzip: 66.64 kB
✓ built in 3.66s
```

### 4.5 Windows Desktop Debug Runtime Validation & Troubleshooting
During local verification on Windows 11:
- **Loopback DNS Resolution:** Fixed IPv6 resolution timeout by strictly binding Vite and Tauri to IPv4 (`127.0.0.1:1420`).
- **DWM Z-Order Governance:** Eliminated the `set_always_on_top` cycling anti-pattern in `src-tauri/src/lib.rs` which caused the Windows Desktop Window Manager to immediately demote the window behind active terminals, ensuring stable and immediate window presentation upon running `npm run tauri dev`.
- **Knowledge Capture:** Formalized this pattern in [`.agents/skills/tauri-windows-troubleshooting/SKILL.md`](../../.agents/skills/tauri-windows-troubleshooting/SKILL.md) and [`documentation/specs/windows-desktop-environment.md`](../specs/windows-desktop-environment.md).

---

## 5. Definition of Done Checklist

- [x] Dedicated branch `feat/sqlite-persistence` created and active.
- [x] Rust backend configured with `rusqlite` (bundled), `uuid`, and `chrono`.
- [x] SQLite schema created conforming to [`documentation/architecture/data-model.md`](../architecture/data-model.md) with foreign keys and cascade deletion.
- [x] Tauri IPC commands implemented and registered for workspaces, sessions, messages, profiles, and audit log.
- [x] Polymorphic `StorageAdapter` pattern implemented with `TauriStorageAdapter` and `WebStorageAdapter`.
- [x] `src/App.tsx` hydrated from active storage adapter on mount with session creation and message saving.
- [x] 100% green status across Rust `cargo test` and frontend `vitest`.
- [x] Clean production build via `npm run build`.
- [x] Google OKF documentation updated (`index.md`, `log.md`, walkthrough).

---

## 6. Next Steps

- **User Staging & Commit:** Review `git status` and await explicit user command to commit `feat: implement local SQLite persistence layer and storage adapters`.
- **Phase 2.2 Implementation:**
  - Implement Hermes SSE streaming protocol client with real-time `<thought>` reasoning token parser matching [`documentation/specs/sse-streaming-protocol.md`](../specs/sse-streaming-protocol.md).
