---
id: arch-data-model
title: SQLite Database Schema & Persistence Model
type: concept
version: 0.1.0
status: active
last_updated: 2026-09-06
authors:
  - Antigravity Pair Programmer
  - Celso Fassoni
tags:
  - architecture
  - sqlite
  - database
  - data-model
  - persistence
---

# SQLite Database Schema & Persistence Model

## Overview
The application follows a **local-first, offline-capable** persistence strategy. In native desktop (Windows) and mobile (Android), data is stored in a local SQLite database managed by the Tauri Rust backend. In standalone Web mode, it falls back to IndexedDB.

## Entity Relationship Diagram

```mermaid
erDiagram
    WORKSPACES ||--o{ SESSIONS : contains
    WORKSPACES ||--o| CONNECTION_PROFILES : defaults_to
    SESSIONS ||--o{ MESSAGES : contains
    SESSIONS ||--o{ TOOL_AUDIT_LOG : tracks
    MESSAGES ||--o{ ATTACHMENTS : includes

    WORKSPACES {
        string id PK
        string name
        string custom_system_prompt
        string scoped_cwd
        string default_profile_id FK
        datetime created_at
    }

    SESSIONS {
        string id PK
        string workspace_id FK
        string title
        boolean pinned
        datetime created_at
        datetime updated_at
    }

    MESSAGES {
        string id PK
        string session_id FK
        string role
        text content
        text reasoning_content
        int tokens_count
        datetime created_at
    }

    ATTACHMENTS {
        string id PK
        string message_id FK
        string file_name
        string file_type
        int file_size
        string local_stored_path
        string mime_type
        datetime created_at
    }

    CONNECTION_PROFILES {
        string id PK
        string name
        string base_url
        string api_key_secure_ref
        string model_name
        json params_json
        json limits_json
        boolean is_default
    }

    TOOL_AUDIT_LOG {
        string id PK
        string session_id FK
        string tool_name
        text command_payload
        string hitl_status
        int exit_code
        datetime executed_at
    }
```

## Tables Specification

### 1. `workspaces`
Groups projects, custom system instructions, and scoped working directory (`scoped_cwd`) for local tool execution.

### 2. `sessions`
Represents an individual conversational thread, ordered chronologically (*Today*, *Yesterday*, *Older*) and filterable by workspace.

### 3. `messages`
Stores multi-turn messages with distinct roles (`user`, `assistant`, `system`, `tool`). Captures separate `reasoning_content` for Hermes `<thought>` tags and token metrics.

### 4. `attachments`
Tracks files copied to the app's internal sandbox storage (`%APPDATA%/hermes-chat-app/media/`), ensuring links remain valid if original files are moved.

### 5. `connection_profiles`
Manages endpoints for different Hermes instances, API keys (via OS credential manager when available), inference parameters, and payload limits.

### 6. `tool_audit_log`
Immutable audit log recording every tool invocation requested by Hermes, the parameters, the user's HITL response (`authorized` or `denied`), and the exit code.

## Related Concepts
- [System Topology](system-topology.md)
- [HITL Tool Execution](../specs/hitl-tool-execution.md)
- [Multimodal Audio Pipeline](../specs/multimodal-audio-pipeline.md)
