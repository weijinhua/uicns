<!--
  Sync Impact Report
  Version change: (template) → 1.0.0
  Modified principles: N/A (initial adoption from placeholders)
  Added sections: Core Principles (5), Technology & Security Constraints, Development Workflow & Quality Gates, Governance
  Removed sections: None (placeholders replaced)
  Templates: .specify/templates/plan-template.md ✅ | spec-template.md ✅ | tasks-template.md ✅ | checklist-template.md ✅ (no change required)
  Commands: .specify/templates/commands/*.md ⚠ not present in repo; .cursor/commands/speckit.*.md reviewed — no agent-specific updates needed
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

### IV. Verification & Continuous Integration

Changes MUST pass the repository’s automated checks before merge: `pnpm lint`, `pnpm typecheck`, and `pnpm test` when tests exist. Feature specifications that mandate tests MUST result in corresponding tasks and failing tests before implementation where TDD is required by the spec. Contract changes and cross-boundary flows SHOULD include integration or contract tests when materially affected.

**Rationale:** Keeps mainline shippable and aligns code with stated requirements.

### V. Simplicity & Incremental Scale

Prefer the smallest design that meets success criteria. New infrastructure (e.g., message buses, extra data stores, microservice splits) MUST be justified against measurable need or explicit non-functional requirements; avoid speculative layers. Align with the architecture stance: scale when metrics justify it, not by default.

**Rationale:** Reduces operational burden and matches the product’s maintainability goals.

## Technology & Security Constraints

- **Stack:** Node.js 20+, pnpm workspaces, Turbo; web stack as documented in `README.md` and `specs/01-architecture.md` (Next.js, NestJS, Postgres, object storage, external LLM via API).
- **API style:** REST/JSON for browser–server communication unless an architecture spec explicitly approves another pattern.
- **Localization:** User-visible strings in the web app MUST go through the established i18n mechanism (default locale as project defines).
- **Configuration:** Production secrets MUST NOT be committed; use `.env.example` patterns and deployment secrets.

## Development Workflow & Quality Gates

- **Specs first:** Significant behavior changes SHOULD start from `specs/` updates, then `/speckit.plan` and `/speckit.tasks` artifacts as used by this repo.
- **Reviews:** Pull requests SHOULD verify constitution MUST statements for touched areas (boundaries, contracts, security, CI).
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

**Version**: 1.0.0 | **Ratified**: 2026-04-19 | **Last Amended**: 2026-04-19
