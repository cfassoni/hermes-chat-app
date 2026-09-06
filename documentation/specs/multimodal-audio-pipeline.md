---
id: spec-multimodal-audio-pipeline
title: Multimodal File Ingestion & Bidirectional Audio Pipeline
type: specification
version: 0.1.0
status: active
last_updated: 2026-09-06
authors:
  - Antigravity Pair Programmer
  - Celso Fassoni
tags:
  - specification
  - multimodal
  - audio
  - voice
  - attachments
---

# Multimodal File Ingestion & Bidirectional Audio Pipeline

## Overview
The application enables rich multimodal input (images, documents, video, and audio) and native voice interaction with `hermes-agent`.

## Multimodal File Pipeline

### 1. File Storage Policy
To ensure chat history permanence, uploaded files are copied into the application's internal data directory:
- **Windows:** `%APPDATA%/hermes-chat-app/media/<sha256-filename>`
- **Android:** App-internal scoped storage directory

### 2. Supported Formats & Size Limits
- **Images:** PNG, JPEG, WEBP, GIF (Max 25MB default)
- **Audio:** WAV, MP3, OGG, WebM (Max 25MB default)
- **Video:** MP4, WebM (Max 50MB default)
- **Documents:** PDF, Markdown (`.md`), Plain Text (`.txt`), DOCX (Max 50MB default)
- **Attachment Limit:** Up to 5 files per turn (overridable in Profile settings).

### 3. Payload Encoding
Files are encoded as standard base64 data URIs or multipart payloads per Hermes multimodal API specifications.

## Bidirectional Audio Interaction

### 1. Voice Capture (User -> Hermes)
- **Mechanism:** Push-to-Toggle (click microphone icon once to record; click checkmark to send; click `X` to discard).
- **Format:** WebM/Opus (or WAV PCM 16kHz) for low latency, high voice fidelity, and bandwidth efficiency.
- **Waveform Visualizer:** Live canvas-based audio waveform animation and elapsed timer (`mm:ss`).

### 2. Audio Playback (Hermes -> User)
- **Native Streams:** If Hermes returns audio streams or audio payloads, the app renders an inline player with play/pause, seek scrubber, and speed controls.
- **No Local TTS:** Local text-to-speech synthesis is intentionally excluded; voice playback is driven strictly by Hermes audio streams.

## Related Concepts
- [Data Model](../architecture/data-model.md)
- [Responsive Layout](responsive-layout.md)
