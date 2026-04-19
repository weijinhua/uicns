<!--
  Sync Impact Report
  Version change: 1.0.0 → 1.1.0
  Modified principles:
    - IV. Verification & Continuous Integration → V. Testing Standards & Automated Verification (expanded)
    - V. Simplicity & Incremental Scale → IV. Code Quality & Maintainability and VII. Performance & Efficiency (split; simplicity rationale preserved)
  Added sections: IV. Code Quality & Maintainability; VI. User Experience Consistency; VII. Performance & Efficiency (Core Principles renumbered I–VII)
  Removed sections: None
  Templates: .specify/templates/plan-template.md ✅ | spec-template.md ✅ | tasks-template.md ✅ | checklist-template.md ✅ (no change required)
  Commands: .specify/templates/commands/*.md — not present in repo
  Follow-up TODOs: None
-->

# Charts Generator Constitution

## Core Principles

### I. Specification-Driven Delivery

Work MUST trace from product intent to executable plans: authoritative inputs live under `specs/` (including PRD and architecture references). Every feature MUST have a written specification with prioritized user stories, acceptance scenarios, and measurable success criteria before implementation planning proceeds. Plans and tasks MUST map to those stories and requirements without orphan scope.

**Rationale:** Prevents drift between intent and code and keeps increments independently testable.

### II. Monorepo Package Boundaries

Code MUST respect the monorepo layout: UI and SSR in `apps/web`, HTTP API and server-only logic in `apps/api`, shared TypeScript types and API contracts in `packages/contracts`, reusable UI primitives and tokens in `packages/ui`. Shared logic MUST not duplicate types across apps when `packages/contracts` can express them. The browser MUST NOT call LLM providers or hold API keys; secrets and orchestration remain server-side.

**Rationale:** Preserves security boundaries and keeps dependencies acyclic and maintainable.

### III. Shared Contracts & Stable API Surface

HTTP JSON shapes, shared error codes, and cross-frontend/backend types MUST be defined or re-exported from `packages/contracts` (or a successor package explicitly named in the architecture spec). Breaking changes to published request/response shapes MUST be versioned or accompanied by a documented migration and compatibility strategy.

**Rationale:** Avoids silent breakage between Next.js and NestJS and gives reviewers a single source of truth.

### IV. Code Quality & Maintainability

Code MUST remain easy to read, reason about, and change: follow repository formatting and lint rules (`pnpm lint`); TypeScript MUST typecheck (`pnpm typecheck`) with no new `any` or unsafe escapes unless justified in review. Modules MUST have a single clear responsibility; duplicated logic across packages MUST be consolidated when it creates divergence risk. Changes MUST avoid drive-by refactors and unrelated edits in the same commit as feature work.

**Rationale:** Keeps review focused, reduces defects, and holds the line on technical debt.

### V. Testing Standards & Automated Verification

Automated verification MUST stay green before merge: `pnpm lint`, `pnpm typecheck`, and `pnpm test` when tests exist. Where the feature spec mandates tests or TDD, tasks MUST include failing tests before implementation. Contract changes and cross-boundary flows MUST include integration or contract tests when behavior is materially affected; pure presentation tweaks MAY rely on manual verification only when the spec explicitly allows it.

**Rationale:** Makes requirements executable and catches regressions at boundaries that types alone cannot.

### VI. User Experience Consistency

User-visible behavior and presentation MUST align with established patterns: user-facing strings in the web app MUST go through the project i18n mechanism and reuse locale conventions; shared visuals MUST use `packages/ui` tokens and components when they exist rather than one-off styling. New screens or flows MUST match navigation, spacing, and interaction patterns documented or exemplified in existing app surfaces unless the spec documents an intentional departure. Accessibility baseline: interactive controls MUST be keyboard reachable and have discernible names where applicable (WCAG-oriented; escalate exceptions in spec or review).

**Rationale:** Users experience one product, not a patchwork of isolated pages.

### VII. Performance & Efficiency

Features MUST not regress perceived performance or server cost without analysis: list and dashboard views SHOULD avoid unbounded queries and N+1 access patterns; client bundles SHOULD avoid unnecessary large dependencies on hot paths; API handlers SHOULD meet latency expectations stated in specs or architecture docs when present. New infrastructure (extra services, caches, queues) MUST be justified by measured need, explicit non-functional requirements, or spec-approved scale targets—prefer the smallest change that meets success criteria.

**Rationale:** Keeps the product responsive and operations predictable as usage grows.

## Technology & Security Constraints

- **Stack:** Node.js 20+, pnpm workspaces, Turbo; web stack as documented in `README.md` and `specs/01-architecture.md` (Next.js, NestJS, Postgres, object storage, external LLM via API).
- **API style:** REST/JSON for browser–server communication unless an architecture spec explicitly approves another pattern.
- **Localization:** User-visible strings in the web app MUST go through the established i18n mechanism (default locale as project defines).
- **Configuration:** Production secrets MUST NOT be committed; use `.env.example` patterns and deployment secrets.

## Development Workflow & Quality Gates

- **Specs first:** Significant behavior changes SHOULD start from `specs/` updates, then `/speckit.plan` and `/speckit.tasks` artifacts as used by this repo.
- **Reviews:** Pull requests MUST verify constitution MUST statements for touched areas (boundaries, contracts, code quality gates, tests, UX consistency, performance).
- **Documentation:** Keep `README.md` accurate for install and run paths when workflow changes.

## Governance

This constitution supersedes ad-hoc conventions when they conflict. Amendments MUST:

1. Update this file with a version bump per semantic rules below.
2. Set **Last Amended** to the amendment date (ISO **YYYY-MM-DD**).
3. Propagate mandatory template or command changes in the same change set when principles add new MUST/SHOULD gates.

**Versioning (this document):**

- **MAJOR:** Removal or incompatible redefinition of a principle, or a new MUST that invalidates prior workflows.
- **MINOR:** New principle, new MUST section, or materially expanded guidance.
- **PATCH:** Clarifications, wording, typos, non-normative refinements.

**Compliance:** SpecKit workflows (`/speckit.plan`, `/speckit.analyze`, etc.) MUST treat this file as authoritative for normative rules. Runtime coding standards in `README.md` and `specs/` MUST not contradict it without a constitution update.

**Version**: 1.1.0 | **Ratified**: 2026-04-19 | **Last Amended**: 2026-04-19
