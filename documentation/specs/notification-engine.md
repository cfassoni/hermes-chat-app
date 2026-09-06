---
id: spec-notification-engine
title: Cross-Platform Native Notification Engine
type: specification
version: 0.1.0
status: active
last_updated: 2026-09-06
authors:
  - Antigravity Pair Programmer
  - Celso Fassoni
tags:
  - specification
  - notifications
  - background
  - cron
---

# Cross-Platform Native Notification Engine

## Overview
The notification engine ensures the user remains informed of critical agent events when the application is minimized or running in the background.

## Technology & Platform Integrations
- **Windows:** Windows Action Center notifications via `tauri-plugin-notification`.
- **Android:** Android System Notifications (with sound and vibration flags) via `tauri-plugin-notification`.
- **Web:** Standard HTML5 Web Notifications API (`Notification.requestPermission()`).

## Notification Triggers

| Trigger | Priority | Notification Content | Action on Click |
| :--- | :--- | :--- | :--- |
| **HITL Authorization Pending** | High (Urgent) | *"Hermes requests permission to run `{tool_name}`"* | Focuses window and scrolls to HITL confirmation card |
| **Generation Completed** | Normal | *"Hermes finished responding in `{session_title}`"* | Focuses window on active session |
| **Hermes Cron / Alarm** | High | *"Scheduled task alert: `{task_summary}`"* | Opens conversation linked to scheduled event |

## Related Concepts
- [HITL Tool Execution](hitl-tool-execution.md)
- [System Topology](../architecture/system-topology.md)
