# Development Guidelines (Karpathy Principles & Project Standards)

Behavioral and engineering guidelines derived from Andrej Karpathy's observations on LLM coding pitfalls, tailored for the **hermes-chat-app** project.

**Premise:** Prioritize rigor and clarity over raw speed. For trivial tasks, use judgment; for architectural and logic changes, adhere strictly to these principles.

---

## Core Rule: Project Language & Communication

- **Written Project Content (Mandatory American English):** All content *written* into the project—including source code, comments, docstrings, variable/type naming, documentation, commit messages, PR descriptions, test cases, and configuration files—MUST be written in **American English (en-US)**.
- **Agent-User Interaction (Chat Language):** For conversational interactions between the AI agent and the user in the chat, the agent MUST communicate in the language initiated by the user for that session (e.g., Brazilian Portuguese if the user addresses the agent in Portuguese). This ensures natural, seamless collaboration while keeping all written repository artifacts strictly in American English.

---

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing any changes:
- **State assumptions explicitly:** If there is any uncertainty or multiple interpretations exist, present them and ask rather than guessing silently.
- **Suggest simpler approaches:** If a simpler or leaner solution exists, state it and push back against unnecessary complexity.
- **Stop when confused:** If anything in the requirements or architecture seems contradictory or unclear, halt immediately, identify the confusion, and align with the user.

---

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

Combat overengineering:
- **No unrequested features:** Never implement speculative features "for the future".
- **No premature abstractions:** Do not create factories, generic wrappers, or interfaces for single-use code.
- **No superfluous configurability:** Do not add unrequested flags, settings, or parameterizations.
- **No handling for impossible scenarios:** Keep error handling focused on real, verifiable failure modes.
- **Conciseness rule:** If 200 lines were written where 50 would achieve the same outcome with equal clarity, rewrite it in 50.

> **Evaluation Test:** *"Would a senior engineer consider this overcomplicated?"* If yes, simplify.

---

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- **No drive-by refactoring:** Do not alter formatting, comments, variable names, or adjacent code unrelated to the task.
- **Don't fix what isn't broken:** If you spot dead code or technical debt, report it rather than modifying or deleting it silently.
- **Match existing patterns:** Follow established conventions, style, and libraries already in use.
- **Clean up your own orphans:** Remove imports, variables, or helpers that *your* changes made obsolete. Do not touch pre-existing dead code unless asked.

> **Evaluation Test:** Every changed line in `git diff` must trace directly back to the user's request.

---

## 4. Goal-Driven Execution

**Define clear success criteria. Loop until verified.**

Transform imperative tasks into verifiable declarative goals:
- Instead of *"add validation"*, use: *"Write tests for invalid inputs, then make them pass"*.
- Instead of *"fix the bug"*, use: *"Write a test reproducing the issue, then ensure the fix resolves it without regressions"*.
- Instead of *"refactor X"*, use: *"Ensure test suites pass cleanly before and after the modification"*.

For multi-step tasks, structure the plan with explicit verification steps:
```
1. [Step 1] -> Verification: [specific command/test]
2. [Step 2] -> Verification: [specific command/test]
3. [Step 3] -> Verification: [specific command/test]
```

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
- **Post-Merge, Auto-Learn & Session Wrap-Up (Always Return to `main`):**
  - Upon completion and merging of any PR, or at the conclusion of a work session, the agent MUST always return the local repository to the `main` branch (`git checkout main`), pull the latest upstream changes (`git pull origin main`), delete the merged local feature branch (`git branch -d <branch>`), and verify that the working tree is 100% clean (`git status`).
  - **Mandatory Autonomous `/learn` Trigger:** Immediately following return to `main` after any merged PR, the agent MUST automatically execute the `/learn` evaluation workflow: analyze recent interactions for explicit user feedback, corrections, or reusable procedures, create/update a `learning_proposal.md` artifact with structured diffs/rationales, and proactively present it for user review and approval.
  - Never leave the repository on temporary feature branches or with unstaged/uncommitted files at session end.

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
  - Every non-trivial phase or feature delivery MUST be explicitly delegated to specialized subagents (`invoke_subagent`) corresponding to the persona catalog:
    1. **Architect:** Formalizes technical specs, contracts, and implementation plans.
    2. **Coder:** Implements surgical, minimal code in isolated feature branches.
    3. **QA Engineer:** Implements automated unit/integration tests and mocks (Vitest, Cargo).
    4. **Security Gatekeeper:** Audits sandboxing, HITL policies, and security guardrails.
    5. **Reviewer:** Conducts pre-PR code review, diff audit, and SemVer checks.
  - The Coordinator reports subagent dispatch, progress, and results transparently to the user.
- **Autonomous & Explicit Delegation:**
  - In Antigravity, the coordinator agent invokes specialized subagents (`invoke_subagent`) configured with the corresponding persona's role, system prompt, model tier, and tool permissions.
  - Subagents communicate through asynchronous messages (`send_message`) and shared atomic OKF documents under `documentation/`.
  - Subagents performing speculative or risky modifications must use isolated workspace branching (`Workspace: branch`).
- **Single Source of Truth:** Changes must follow the collaboration lifecycle: Architecture/RFC -> Test Strategy -> Surgical Code -> Verification Proof -> Security/Release Gate.

---

## Success Criteria

These guidelines are succeeding when:
1. Git diffs contain exclusively the requested changes, free of noise.
2. Rewrites driven by overcomplication are eliminated.
3. Clarifying questions occur **before** implementation, not after mistakes are committed.
4. The codebase remains concise, robust, testable, and maintainable.
