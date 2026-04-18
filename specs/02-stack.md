# Charts Generator — Tech Stack Selection

**Input:** `specs/01-architecture.md`  
**Goals:** mature ecosystem, minimal unnecessary complexity, MVP-friendly.

---

## Three stack options

### Option A — Split: Next.js + NestJS + PostgreSQL (architecture default)

| Layer | Choice |
|--------|--------|
| **Frontend** | Next.js (App Router), TypeScript, design-system UI, `next-intl` (or equivalent) for i18n |
| **Backend** | NestJS, REST `/api/v1`, JWT or session auth, LLM adapter module |
| **Database** | PostgreSQL (JSONB for `chart_spec`); Prisma or TypeORM |
| **Object storage** | S3-compatible API (AWS S3, Cloudflare R2, MinIO in dev) |
| **Infra** | Docker Compose (web + api + db + minio) locally; CI builds two artifacts or one monorepo image per service |

### Option B — Lean API: Next.js + Fastify + PostgreSQL

| Layer | Choice |
|--------|--------|
| **Frontend** | Same as Option A |
| **Backend** | Fastify + `@fastify/jwt` / session plugins, Zod for validation, modular route files |
| **Database** | PostgreSQL; Drizzle ORM (lightweight, SQL-first) or Prisma |
| **Object storage** | Same S3-compatible pattern |
| **Infra** | Same Docker/CI pattern (replace `api` service image with Fastify app) |

### Option C — Monolith app: Next.js “full stack” + PostgreSQL

| Layer | Choice |
|--------|--------|
| **Frontend + API** | Next.js App Router: Route Handlers or Server Actions for auth, charts CRUD, and `generate` (server-only LLM calls) |
| **Backend** | No separate Node service; boundary is **modules/folders** inside the Next repo |
| **Database** | PostgreSQL; Prisma or Drizzle colocated in the same repo |
| **Object storage** | Same S3-compatible pattern (upload from server actions or API routes) |
| **Infra** | Single deployable (one container or Vercel-style split build); simplest process count |

---

## Comparison

| Criterion | Option A (Next + Nest) | Option B (Next + Fastify) | Option C (Next full stack) |
|-----------|-------------------------|----------------------------|-----------------------------|
| **Dev speed** | High if team already knows Nest patterns (modules, DI, guards). Slightly more boilerplate than Fastify for small endpoints. | Fast to add routes and validation; less ceremony than Nest. | Fastest to ship **one** repo and one runtime; fewer network hops in dev. Risk: API logic grows inside Next and needs discipline to avoid a “fat” app directory. |
| **Scalability** | Excellent: scale web and API independently; familiar horizontal scaling story. | Same as A (separate processes). | Good for ~10k users: scale the Next workload. If LLM or DB becomes hot, you may later **extract** an API service (migration cost). |
| **Cost** | Two services to host (or two PaaS apps) + DB + storage + LLM usage. | Same operational cost profile as A. | Often **lowest** host bill (one app) until you need extraction. |
| **AI friendliness** | Strong: Nest module for LLM adapter, clear boundaries, DTOs, testable services. Docs and examples are plentiful. | Strong: plain TS services + Fastify routes; slightly fewer “batteries” than Nest for large apps. | Strong for small teams: one codebase; Cursor/agents navigate one tree. Weaker if you want strict backend-only integration tests without Next test harness. |

**Summary:** A and B are equivalent for scalability and similar cost; A wins on structure for larger backend teams, B on minimalism. C wins on simplicity and initial cost; it trades long-term separation for speed.

---

## MVP selection: **Option A (Next.js + NestJS + PostgreSQL)**

**Rationale**

1. **Matches `specs/01-architecture.md` and PRD** — already assumes NestJS for auth, charts, and LLM orchestration; changing to C would rewrite boundaries.
2. **Team familiarity** — PRD states comfort with NestJS, Next.js, and TypeScript; no new backend paradigm for MVP.
3. **AI integration** — Nest’s module/service layout fits an LLM adapter, validation pipes, and rate limiting without improvising structure.
4. **Scalability / 10k users** — stateless API + poolable Postgres is enough; independent scaling of UI vs API remains available without a later rewrite.

Option B is a valid alternative if the team prefers less framework weight than Nest. Option C is best when minimizing deployables is the top priority and the team accepts possible future extraction work.

---

## Locked stack for MVP (concrete)

| Area | Choice |
|------|--------|
| **frontend** | **Next.js** (App Router, TypeScript), i18n via `next-intl` or equivalent, chart library picked in implementation (e.g. ECharts, Recharts) |
| **backend** | **NestJS** (TypeScript), REST API, structured LLM output validation (e.g. Zod/class-validator) |
| **database** | **PostgreSQL** |
| **infra** | **Docker** (Compose for local: `web`, `api`, `postgres`, object storage dev service), **CI/CD** (e.g. GitHub Actions: lint, typecheck, test, build on PR; deploy main to staging/prod) |

**Also required (from architecture):** S3-compatible **object storage** for chart exports; **LLM provider** via HTTPS (keys only on server).

**Deferred (not MVP blockers):** Redis, read replicas, message queues — add when metrics require them.

---

## CI/CD expectations (minimal)

- **On PR:** install deps, `eslint` / `prettier` check, TypeScript build, unit tests for API and critical UI.
- **On main:** same + build Docker images (or platform-native build) and deploy to staging; production gated on tag or manual approval.
- **Secrets:** LLM keys, DB URL, storage keys in CI/CD and runtime secret stores — not in the repo.

This document should stay aligned with `specs/01-architecture.md`; any stack change here should trigger an architecture doc update.
