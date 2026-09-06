---
id: spec-hitl-tool-execution
title: Split-Runtime Human-In-The-Loop (HITL) Tool Execution
type: specification
version: 0.1.0
status: active
last_updated: 2026-09-06
authors:
  - Antigravity Pair Programmer
  - Celso Fassoni
tags:
  - specification
  - hitl
  - security
  - tools
  - rust
---

# Split-Runtime Human-In-The-Loop (HITL) Tool Execution

## Overview
Hermes Agent supports split-runtime execution where the agent's LLM reasoning operates remotely, but system-level tool invocations (shell commands, file reads/writes) are dispatched to the client device. To safeguard the host, every tool call is gated by a strict **Human-In-The-Loop (HITL)** security mechanism.

## Tool Execution Lifecycle

```mermaid
sequenceDiagram
    autonumber
    participant Hermes as Hermes Agent
    participant Client as Hermes Chat App (Frontend)
    participant User as Human User
    participant Rust as Tauri Rust Backend
    participant OS as Host OS (Windows/Android)

    Hermes->>Client: SSE Stream emits `tool_calls`
    Client->>Client: Pause generation stream & parse parameters
    Client->>User: Display HITL Modal with exact command & risk rating
    alt User Rejects
        User->>Client: Click "Deny"
        Client->>Hermes: Return tool message: "Execution rejected by user."
    else User Authorizes
        User->>Client: Click "Authorize" (or "Always Allow in Session" for exact command)
        Client->>Rust: Invoke Tauri Command `execute_tool(name, params)`
        Rust->>OS: Execute command within scoped `cwd` (30s timeout)
        OS-->>Rust: stdout, stderr, exit_code
        Rust-->>Client: Return execution payload
        Client->>Hermes: HTTP POST with `role: "tool"`, `tool_call_id`, `content: output`
        Hermes->>Client: Resume SSE stream until final completion
    end
```

## Security Guardrails

1. **Scoped Working Directory (`cwd`):** Tools execute in the workspace's configured directory or the isolated app sandbox (`%APPDATA%/hermes-chat-app/workspaces/<project-id>/`).
2. **Granular Session Scope:** "Always Allow in Session" grants authorization **only** to that exact command string and arguments, preventing silent escalation to other commands.
3. **Execution Timeout:** Non-interactive execution is enforced with a configurable 30-second default timeout and an interactive `[Abort / Cancel]` button in the UI.
4. **Audit Trail:** Every invocation (authorized, denied, timed out) is permanently recorded in [`tool_audit_log`](../architecture/data-model.md).

## Supported Tools Matrix by Platform
| Tool Identifier | Description | Windows | Android | Web |
| :--- | :--- | :---: | :---: | :---: |
| `run_shell_command` | Execute PowerShell/CMD commands | Full | Disabled | Emulated |
| `read_file` | Read local file content | Full | App Sandbox Storage | File Picker |
| `write_file` | Write content to local file | Full | App Sandbox Storage | Download Trigger |
| `list_directory` | List contents of a directory | Full | App Sandbox Storage | Disabled |
| `get_system_info` | OS, CPU, Memory, Architecture | Full | Device Info API | Navigator API |

## Related Concepts
- [System Topology](../architecture/system-topology.md)
- [Data Model](../architecture/data-model.md)
- [Notification Engine](notification-engine.md)
