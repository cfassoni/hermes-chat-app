---
id: walkthrough-wiki-sync-pipeline
title: GitHub Wiki Automated Documentation Sync Pipeline Walkthrough
type: walkthrough
version: 1.0.0
status: active
last_updated: 2026-09-06
authors:
  - Antigravity Pair Programmer
  - Celso Fassoni
tags:
  - walkthrough
  - wiki
  - documentation
  - ci-cd
  - github-actions
  - automation
  - okf
---

# GitHub Wiki Automated Documentation Sync Pipeline Walkthrough

## 1. Overview & Objectives

This walkthrough documents the design, implementation, and automated testing of the **Continuous GitHub Wiki Documentation Synchronization Pipeline** for the **Hermes Chat App**.

The primary objective was establishing an automated, continuous delivery mechanism that publishes the entire repository documentation knowledge base ([`documentation/`](../index.md), structured under Google's Open Knowledge Format) directly to the GitHub repository's Wiki (`https://github.com/cfassoni/hermes-chat-app/wiki`) upon Pull Request approval and merge into the `main` branch, as well as on-demand via manual workflow dispatch.

---

## 2. Multi-Agent Persona Responsibilities

In accordance with [`.agents/personas/README.md`](../../.agents/personas/README.md) and [`AGENTS.md`](../../AGENTS.md):
- **Lead Architect & RFC Specifier (`architect.md`)**: Formalized synchronization requirements, Google OKF transformation rules, navigation hierarchy for `_Sidebar.md`, and link normalization strategy.
- **Core Systems Engineer (`coder.md`)**: Implemented surgical, deterministic Node.js synchronization engine [`scripts/sync-wiki.mjs`](../../scripts/sync-wiki.mjs) and GitHub Actions automation [`.github/workflows/publish-wiki.yml`](../../.github/workflows/publish-wiki.yml).
- **Quality & Test Automation Engineer (`qa-engineer.md`)**: Implemented exhaustive Vitest unit tests in [`src/tests/sync-wiki.test.ts`](../../src/tests/sync-wiki.test.ts) validating dry-runs, directory synchronization, link rewriting, navigation structure, and target pruning.
- **UI/UX & Code Reviewer (`reviewer.md`)**: Audited git diff, SemVer impact, and verified zero unintended side effects.

---

## 3. Architectural Design & Implementation Details

```
+-------------------------------------------------------------+
|                main branch (PR Merged / Push)               |
+-------------------------------------------------------------+
                               |
                               v (GitHub Actions Trigger)
+-------------------------------------------------------------+
|        .github/workflows/publish-wiki.yml (Node.js 22)      |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                 scripts/sync-wiki.mjs                       |
|  - Maps documentation/index.md -> Home.md                   |
|  - Generates _Sidebar.md & _Footer.md                       |
|  - Normalizes external links to GitHub repo URLs            |
|  - Synchronizes specs/, architecture/, testing/, assets/    |
|  - Prunes obsolete target files (preserves .git)            |
+-------------------------------------------------------------+
                               |
                               v (git push origin master)
+-------------------------------------------------------------+
|       https://github.com/cfassoni/hermes-chat-app.wiki      |
+-------------------------------------------------------------+
```

### 3.1 Synchronizer Script Engine (`scripts/sync-wiki.mjs`)
- **CLI Options**: Supports `--source <dir>` (default: `documentation`), `--target <dir>` (default: `wiki-dist`), `--repo <owner/repo>` (default: `cfassoni/hermes-chat-app`), `--dry-run`, and `-h/--help`.
- **Homepage Transformation**: Maps `documentation/index.md` to `Home.md` at the root of the Wiki repository, conforming to GitHub Wiki's default landing page conventions.
- **Navigation Sidebar Generation (`_Sidebar.md`)**: Automatically builds a hierarchical navigation sidebar parsing the OKF document catalog in `documentation/index.md` across sections (Governance, Specifications, Architecture, Testing, Walkthroughs, and Repository). Any documentation markdown file discovered on disk that is not cataloged in `index.md` is safely appended to an "Additional Documentation" section.
- **Standardized Footer (`_Footer.md`)**: Generates attribution and provenance marker: `Synchronized automatically from the hermes-chat-app repository • Google OKF`.
- **Link Normalization**:
  - Rewrites internal documentation links to `index.md` as `Home.md`.
  - Transforms relative links pointing outside `documentation/` (e.g., `../AGENTS.md`, `../.agents/personas/README.md`) into fully-qualified GitHub repository URLs (`https://github.com/${repo}/blob/main/...` or `.../tree/main/...`).
  - Ignores code block contents (fenced with ```` ``` ````) to avoid corrupting code snippets or regex strings.
- **Target Pruning with `.git` Preservation**: Prunes obsolete files or empty directories from the cloned wiki repository without disturbing `.git/` tracking metadata.

### 3.2 GitHub Wiki (Gollum Engine) Native Rendering Optimization
- **Root Flattening:** GitHub Wiki (Gollum) treats files located inside subdirectories as raw downloadable assets or raw text rather than rendering them in the Wiki layout. The synchronizer now flattens all markdown documents directly to the wiki root (e.g., `specs/spec-001-hermes-chat-core.md` -> `spec-001-hermes-chat-core.md`).
- **YAML Frontmatter Stripping:** Gollum does not hide or parse OKF YAML frontmatter, displaying raw YAML text at the top of pages. The synchronizer strips leading `---...---` blocks so pages immediately begin with the primary `# Title`.
- **Clean Gollum Slugs:** Gollum navigates pages using extensionless slugs (e.g. `[Spec](spec-001-hermes-chat-core)`). Markdown links containing `.md` or directory prefixes force raw file downloads. The synchronizer converts all internal links in documents and `_Sidebar.md` into clean slugs, preserving `#anchors`.
- **Static Asset Raw URL Routing:** Asset links (images and media) are rewritten to absolute `raw.githubusercontent.com` URLs to ensure reliable rendering across all wiki pages without path resolution failure.

### 3.3 GitHub Actions Workflow (`.github/workflows/publish-wiki.yml`)
- **Triggers**:
  - `push` to branch `main` on changes to `documentation/**`, `.github/workflows/publish-wiki.yml`, or `scripts/sync-wiki.mjs`.
  - Manual dispatch via `workflow_dispatch`.
- **Permissions**: Configured with `contents: write` for `GITHUB_TOKEN`.
- **Pipeline Stages**:
  1. Checks out repository via `actions/checkout@v4`.
  2. Sets up Node.js 22 via `actions/setup-node@v4`.
  3. Clones the Wiki repository (`${{ github.repository }}.wiki.git`) with fallback auto-initialization.
  4. Runs `node scripts/sync-wiki.mjs --source documentation --target wiki-repo --repo "${{ github.repository }}"`.
  5. Commits changes via `github-actions[bot]` and pushes to the `master` branch if `git diff --staged` detects changes.

---

## 4. Verification & Testing Evidence

### 4.1 Automated Vitest Suite (`src/tests/sync-wiki.test.ts`)
The QA Engineer created 5 automated test cases covering:
1. **Dry-Run Mode Execution:** Asserts exit code `0`, logging output, and confirms zero files written.
2. **Full Sync & Directory Hierarchy:** Asserts generation of `Home.md`, `_Sidebar.md`, `_Footer.md`, and all subdirectories (`architecture/`, `specs/`, `testing/`, `walkthroughs/`, `assets/`).
3. **Sidebar Navigation Hierarchy:** Asserts generation of section headings and exact link formatting.
4. **Link Transformation Engine:** Asserts external links are converted to absolute GitHub URLs while internal paths remain intact.
5. **Target Pruning & Git Safety:** Asserts that orphan files and empty folders are removed while `.git/HEAD` is preserved.

Test execution output (`npm test`):
```text
 ✓ src/tests/storage.test.ts (4 tests) 4ms
 ✓ src/tests/sync-wiki.test.ts (5 tests) 390ms
 ✓ src/tests/smoke.test.tsx (1 test) 53ms

 Test Files  3 passed (3)
      Tests  10 passed (10)
   Duration  2.13s
```

### 4.2 Type Checking & Build Verification
- `npx tsc --noEmit`: 0 errors.
- `node scripts/sync-wiki.mjs --dry-run`: 20 source files discovered, 22 targets planned, 0 errors.

---

## 5. Artifacts Created & Modified

| File | Type | Description |
| :--- | :--- | :--- |
| [`scripts/sync-wiki.mjs`](../../scripts/sync-wiki.mjs) | Script | Native Node.js ES module for OKF to GitHub Wiki transformation. |
| [`.github/workflows/publish-wiki.yml`](../../.github/workflows/publish-wiki.yml) | Workflow | GitHub Actions workflow publishing documentation on merge to `main`. |
| [`src/tests/sync-wiki.test.ts`](../../src/tests/sync-wiki.test.ts) | Test Suite | Vitest unit tests verifying sync, parsing, link rewrites, and pruning. |
| [`documentation/walkthroughs/wiki-sync-pipeline-walkthrough.md`](wiki-sync-pipeline-walkthrough.md) | Walkthrough | This OKF walkthrough document. |
| [`documentation/backlog.md`](../backlog.md) | Backlog | Updated backlog with `INFRA-001` completion status. |
| [`documentation/log.md`](../log.md) | Audit Log | Registered milestone changes and documentation additions. |
| [`documentation/index.md`](../index.md) | Catalog | Cataloged new walkthrough in central index. |

---

## 6. Next Steps & Roadmap Progression

With the documentation wiki sync pipeline complete:
1. Stage changes (`git add`).
2. Await user confirmation for `git commit` and `git push`.
3. Open Pull Request for `feat/wiki-sync-pipeline` merging into `main`.
4. Upon PR merge, GitHub Actions will automatically execute the first production Wiki publish to `https://github.com/cfassoni/hermes-chat-app/wiki`.
5. Proceed to **Phase 2.2: Hermes SSE Streaming Protocol & Real-time Reasoning Parser** ([`documentation/specs/sse-streaming-protocol.md`](../specs/sse-streaming-protocol.md)).
