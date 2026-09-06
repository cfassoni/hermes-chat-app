---
id: spec-sse-streaming-protocol
title: Hermes SSE Streaming Protocol & Event Parser
type: specification
version: 0.1.0
status: active
last_updated: 2026-09-06
authors:
  - Antigravity Pair Programmer
  - Celso Fassoni
tags:
  - specification
  - sse
  - hermes-agent
  - streaming
---

# Hermes SSE Streaming Protocol & Event Parser

## Overview
The client interacts with `hermes-agent` using Server-Sent Events (SSE) over HTTP POST (`/v1/chat/completions` or `/v1/responses` with `stream: true`).

## Supported Event Stream Types

| Event Type | Payload Format | Client Handling |
| :--- | :--- | :--- |
| `chat.completion.chunk` | OpenAI standard JSON chunk | Extracts `delta.content` and appends to message stream buffer |
| `response.output_text.delta` | Token delta object | Real-time token appending |
| `hermes.tool.progress` | Tool status string / step metadata | Renders live tool execution progress pill in UI |
| Reasoning Tags | `<thought>...</thought>` in text stream | Parsed into dedicated collapsible Thinking Accordion |
| Context Warnings | `on_context_truncation` / memory alerts | Renders subtle context compaction warning badge |

## Connection Resilience & Background Streams
- **Decoupled Stream State:** Each active session manages its own SSE reader independent of the active UI view. Switching between chats in the sidebar does not abort background generation.
- **Unexpected Disconnections:** If network terminates prematurely, the client preserves all partial tokens received to date and presents an inline `[Retry / Resume Generation]` button.

## Related Concepts
- [System Topology](../architecture/system-topology.md)
- [HITL Tool Execution](hitl-tool-execution.md)
