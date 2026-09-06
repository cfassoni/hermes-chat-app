---
name: google-okf
description: >-
  Provides procedures, templates, and guidelines for authoring and maintaining
  documentation conforming to Google's Open Knowledge Format (OKF). Activate this
  skill whenever creating, updating, or refactoring documentation, architectural concepts,
  specifications, or knowledge catalogs.
---

# Google Open Knowledge Format (OKF) Skill

This skill guides agents and engineers in authoring and maintaining documentation conforming to Google's Open Knowledge Format (OKF).

---

## 1. Core Architectural Principles

### A. Atomic Concept Granularity ("LLM-Wiki")
- Each Markdown document MUST represent **exactly one** discrete concept (e.g., a single data model, an API contract, a subsystem topology, or a layout matrix).
- **Prohibition on Monolithic Files:** Never create multi-domain monolithic specifications. Breaking knowledge into atomic documents allows AI agents to ingest only the relevant concept into their context window, preventing context exhaustion and hallucinations.

### B. Directory Structure
```text
documentation/
├── index.md                 # Central Catalog / Knowledge Index
├── log.md                   # Chronological Audit & Change Log
├── architecture/            # Architectural concepts and models
│   ├── system-topology.md
│   └── data-model.md
├── specs/                   # Technical specifications and RFCs
│   ├── sse-streaming-protocol.md
│   └── hitl-tool-execution.md
├── testing/                 # Quality assurance, test strategies, DoD
│   └── quality-and-testing-strategy.md
├── walkthroughs/            # Milestone and phase walkthrough documents
│   └── initial-architecture-and-specs.md
└── assets/                  # Media, diagrams, and mockups
    └── mockups/
```

---

## 2. Standard YAML Frontmatter Schema

Every OKF document MUST start with standard YAML frontmatter:

```yaml
---
id: <kebab-case-unique-id>
title: <Human-Readable Title>
type: concept | specification | catalog | log
version: <semver>
status: active | draft | review_pending | deprecated
last_updated: YYYY-MM-DD
authors:
  - <Author Name>
tags:
  - <relevant-tag-1>
  - <relevant-tag-2>
---
```

---

## 3. Semantic Cross-Linking

- OKF builds a navigable, bidirectional knowledge graph.
- Every concept document must cross-reference related concepts using relative Markdown links:
  ```markdown
  ## Related Concepts
  - [System Topology](../architecture/system-topology.md)
  - [Data Model](../architecture/data-model.md)
  ```

---

## 4. Maintenance & Audit Synchronization Workflow

Whenever creating, modifying, or deprecating a concept:

1. **Write/Edit the Concept File:** Keep content atomic, concise, and focused strictly on the designated concept.
2. **Update `documentation/index.md`:** Register the document in its respective category table.
3. **Record in `documentation/log.md`:** Add an entry under `## Change History` detailing the action, artifacts changed, and context.
4. **Git Staging Gate:** Always stage changes (`git add documentation/`), and await user instructions before committing.

---

## 5. Asset Colocation

- Never scatter raw images across the root or document directories.
- Place all diagrams, mockups, and exported assets in `documentation/assets/<category>/`.
- Embed images in concept notes using relative Markdown image links:
  `![Caption](../assets/<category>/filename.png)`

---

## 6. Proactive Milestone Walkthroughs Protocol

- **Autonomous Authoring:** At the conclusion of every major task, architectural phase, or milestone delivery, the agent MUST proactively author or update a walkthrough document under `documentation/walkthroughs/` without requiring user reminders.
- **Walkthrough Content:**
  - Executive summary of the completed milestone.
  - Key architectural and design decisions.
  - Concept documents and artifacts created or modified.
  - Testing verification results and evidence.
  - Concrete next steps.
- **Index & Log Registration:** Register the walkthrough in `documentation/index.md` (under `## Project Walkthroughs`) and log the entry in `documentation/log.md`.

---

## 7. GitHub Wiki (Gollum Engine) Transformation Standards

When publishing OKF documentation to GitHub Wiki (`.wiki.git`), the following structural transformations are mandatory to ensure rich, native Markdown rendering:

1. **Root Flattening:** GitHub Wiki (Gollum) renders markdown documents inside subdirectories as raw downloadable blobs/text without Wiki theme or sidebar. All markdown files MUST be flattened directly into the target root (e.g., `documentation/specs/spec-001.md` -> `spec-001.md`, `documentation/index.md` -> `Home.md`).
2. **YAML Frontmatter Stripping:** Gollum does not hide frontmatter; leading `---...---` blocks must be stripped during synchronization so pages immediately display their primary `# Title`.
3. **Clean Gollum Slugs:** Internal cross-document links and `_Sidebar.md` navigation MUST use extensionless slugs without `.md` and without directory prefixes (e.g., `[Spec](spec-001-hermes-chat-core)` instead of `[Spec](specs/spec-001-hermes-chat-core.md)`). Preserving `#anchor` hashes is supported.
4. **Asset URL Rewriting:** Relative image paths break across page views in GitHub Wiki. Images in `documentation/assets/` must be rewritten to absolute raw GitHub URLs (`https://raw.githubusercontent.com/${repo}/main/documentation/...`).
5. **Target Pruning:** Obsolete files and empty directories in the Wiki clone must be pruned while strictly preserving `.git/` metadata.

