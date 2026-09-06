# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes, derived from Andrej Karpathy's observations on LLM coding pitfalls, tailored for **hermes-chat-app**.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

---

## Core Rule: Project Language & Communication

- **Written Project Content (Mandatory American English):** All project content *written* into the codebase—including source code, comments, docstrings, variable/type naming, documentation, commit messages, PR descriptions, test cases, and configuration files—MUST be written in **American English (en-US)**.
- **Agent-User Interaction (Chat Language):** For conversational interactions between the AI agent and the user in the chat, the agent MUST communicate in the language initiated by the user for that session (e.g., Brazilian Portuguese if the user addresses the agent in Portuguese). This ensures natural, seamless collaboration while keeping all written repository artifacts strictly in American English.

---

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

---

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

---

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

---

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" -> "Write tests for invalid inputs, then make them pass"
- "Fix the bug" -> "Write a test that reproduces it, then make it pass"
- "Refactor X" -> "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] -> verify: [check]
2. [Step] -> verify: [check]
3. [Step] -> verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

## 5. Git, Branching & Release Standards

- **Commit Specification:** Adhere strictly to [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat:`, `fix:`, `refactor:`, `perf:`, `test:`, `docs:`, `chore:`, `build:`, `ci:`).
- **Semantic Versioning (SemVer):** Strictly follow [SemVer](https://semver.org/) (`MAJOR.MINOR.PATCH`) for all version increments, tagging, and releases.
- **Branching Model:**
  - Every new feature or non-trivial change MUST be developed in an isolated, dedicated branch (e.g., `feat/<feature-name>`, `fix/<issue-name>`).
  - **Forbidden:** Pushing directly to the `main` branch is strictly prohibited under all circumstances.
- **Staging & Commit Gate:**
  - Always stage changes (`git add`).
  - MUST pause and await explicit user instructions before running `git commit`. Never commit autonomously.
- **Push & PR Gate:**
  - MUST pause and await explicit user instructions before running `git push`. Never push autonomously.
  - Upon pushing, immediately prepare a detailed Pull Request (PR) description (title, concise summary, detailed changes breakdown, testing/verification proof, SemVer impact assessment) and await user approval.
- **CI/CD Handling (e.g., GitHub Actions):**
  - When CI/CD pipelines run, request the user to check and report the pipeline status.
  - NEVER enter active polling loops or wait loops to inspect CI/CD execution.

---

## 6. Agile & Spec-Driven Design (Mandatory Planning Gate)

- **No Spec, No Code:** Nothing shall be coded until a technical and development specification has been thoroughly discussed, presented, and explicitly approved by the user.
- **Centralized Living Backlog (`documentation/backlog.md`):**
  - All phases, epics, deliverables, and definition of done (DoD) criteria MUST be tracked in `documentation/backlog.md`.
  - The agent MUST ALWAYS consult `documentation/backlog.md` before proposing or discussing next steps, eliminating investigative guesswork.
  - Upon completion and merging of each phase, the agent MUST immediately update `documentation/backlog.md` status (`COMPLETED`, `IN PROGRESS`, `READY`).
- **Prerequisites for Implementation:** Every specification MUST define:
  1. Detailed architectural & technical implementation plan.
  2. Testing methodology (autonomous, automated unit/integration tests, or manual test protocols).
  3. Clear, unambiguous acceptance criteria (definition of done).
- **Iterative Cadence:** Adhere to Agile delivery principles with incremental, verifiable deliverables.

---

## 7. Project Documentation Architecture (Google OKF Standards)

- **Storage Location:** All project documentation is maintained in the `documentation/` directory at the repository root, structured with subdirectories created as needed.
- **Google Open Knowledge Format (OKF):** Documentation must strictly conform to Google's Open Knowledge Format (OKF):
  - **Strictly Atomic Concepts ("LLM-Wiki" Pattern):** Each document MUST represent a single, discrete, atomic concept (e.g., one architectural component, one data model, one API contract, or one feature specification). Monolithic multi-domain specifications are strictly prohibited to prevent AI context window bloat and ensure fast, modular retrieval.
  - **YAML Frontmatter:** Every markdown document MUST include YAML frontmatter declaring metadata (`id`, `title`, `type`, `status`, `tags`, etc.).
  - **Central Index:** Maintain `documentation/index.md` as the unified table of contents and semantic catalog.
  - **Audit Log:** Maintain `documentation/log.md` to track document versioning and change history.
  - **Semantic Cross-Linking:** Concepts must link to related concepts using standard relative Markdown links.
  - **Asset Colocation:** Visual mockups, diagrams, and media must be stored in designated `documentation/assets/<category>/` folders and linked directly within concept documents.
  - **Milestone Walkthroughs:** Every architectural phase, major feature implementation, or milestone delivery MUST include an atomic walkthrough document stored under `documentation/walkthroughs/` conforming to OKF standards (summarizing goals, architectural decisions, artifacts created, verification results, and next steps), registered in `documentation/index.md`, and recorded in `documentation/log.md`.
- **Proactive Maintenance:** The agent must ALWAYS consult the `documentation/` directory before proposing changes and keep all documentation synchronized and up to date.

---

## 8. Specialized Agent Skills

- **Dynamic Creation:** Specialized skills can be created opportunistically (under `.agents/skills/<skill-name>/SKILL.md`) whenever complex, repeatable procedures, domain runbooks, or specialized workflows arise.
- **Agent Invocation:** The agent shall proactively invoke relevant specialized skills when executing tasks matching their scope.

---

## 9. Multi-Agent Personas & Subagent Delegation

- **Atomic Persona Catalog:** The project defines discrete developer personas under `.agents/personas/` (`architect.md`, `coder.md`, `qa-engineer.md`, `security-gatekeeper.md`, `reviewer.md`).
- **Mandatory Subagent Delegation (No Monolithic Execution):**
  - The Coordinator agent MUST NOT execute end-to-end feature implementations monolithically in the primary chat thread.
  - Every non-trivial phase or feature delivery MUST be explicitly delegated to specialized subagents corresponding to the persona catalog:
    1. **Architect:** Formalizes technical specs, contracts, and implementation plans.
    2. **Coder:** Implements surgical, minimal code in isolated feature branches.
    3. **QA Engineer:** Implements automated unit/integration tests and mocks (Vitest, Cargo).
    4. **Security Gatekeeper:** Audits sandboxing, HITL policies, and security guardrails.
    5. **Reviewer:** Conducts pre-PR code review, diff audit, and SemVer checks.
  - The Coordinator reports subagent dispatch, progress, and results transparently to the user.
- **Single Source of Truth:** Always reference atomic documentation in `documentation/specs/` and `documentation/testing/` to avoid polluting context windows.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
