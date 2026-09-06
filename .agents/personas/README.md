# AI Dev Team - Multi-Agent Personas

This directory contains atomic persona definitions for the autonomous and pair-programming AI agents working on the **Hermes Chat App** project.

---

## Persona Catalog

| File | Persona Role | Model Recommendation | Tool Permissions | Key Scope |
| :--- | :--- | :--- | :--- | :--- |
| [`architect.md`](./architect.md) | **Lead Architect & RFC Specifier** | `pro` / high reasoning | Read, Write (docs only) | Architectural design, RFCs, Google OKF specs, Karpathy simplicity. |
| [`coder.md`](./coder.md) | **Core Systems Engineer** | `inherit` / fast coding | Read, Write, Execute | Surgical implementation, zero unrequested abstractions, clean diffs. |
| [`qa-engineer.md`](./qa-engineer.md) | **Quality & Test Automation Engineer** | `inherit` | Read, Write (tests), Execute | Automated tests, edge-case failure reproduction, regression gates. |
| [`security-gatekeeper.md`](./security-gatekeeper.md) | **Security, Governance & Release Overseer** | `inherit` | Read, Audit commands | SemVer enforcement, Conventional Commits, branch isolation, secret hygiene. |
| [`reviewer.md`](./reviewer.md) | **UI/UX & Code Reviewer** | `inherit` | Read-only | Cross-platform design parity (Windows/Android/Web), streaming UX, PR reviews. |

---

## Tool Interoperability Guide

### 1. Google Antigravity
Personas can be launched programmatically using `define_subagent` and `invoke_subagent`:
```typescript
// Example: Invoking the Lead Architect for RFC work
invoke_subagent({
  Subagents: [{
    TypeName: "architect",
    Role: "Lead System Architect",
    Prompt: "Draft specification for local SQLite encryption key management.",
    Model: "pro"
  }]
});
```
Or referenced on-demand via specialized skills under `.agents/skills/`.

### 2. Claude Code (CLI) & Claude Desktop
In Claude Code, refer to a persona directly:
* Read the persona specification before taking action:
  `claude "Adopting the persona in .agents/personas/qa-engineer.md, write unit tests for the SSE parser."`
* In Claude Desktop, attach `.agents/personas/` as project knowledge or reference them in Project Custom Instructions.

### 3. OpenCode & OpenHands
Open-source agent frameworks can directly ingest the Markdown files as system prompts in coordinator-worker workflows.

---

## Governance Reminder
Per [AGENTS.md](../../AGENTS.md), all written files, code, tests, and documentation produced by any persona must be in **American English (en-US)**.
