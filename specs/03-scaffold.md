# Charts Generator — Project Scaffold

**Inputs:** `specs/01-architecture.md`, `specs/02-stack.md`  
**Stack:** Next.js (web) + NestJS (api) + PostgreSQL + S3-compatible storage  
**Shape:** TypeScript monorepo, **pnpm** workspaces (mature, strict, fast; swap for npm/yarn if policy requires).

---

## 1. Design principles

| Principle | How it shows up in the scaffold |
|-----------|----------------------------------|
| **Clean boundaries** | `apps/web` only talks to HTTP API; `apps/api` owns DB and LLM; shared **types/contracts** live in `packages/*`, not duplicated strings. |
| **Scalable** | Stateless API, env-driven config, separate deployables per app, optional future `packages/*` growth without rewiring imports. |
| **Monorepo-friendly** | Single lockfile, workspace protocol (`workspace:*`), root scripts, shared ESLint/Prettier/TSConfig. |

---

## 2. Directory tree

```
charts-generator/                          # repo root
├── .editorconfig
├── .gitattributes
├── .gitignore
├── .nvmrc                               # optional: pin Node LTS
├── package.json                         # workspaces, root scripts
├── pnpm-workspace.yaml
├── turbo.json                           # optional: Turborepo task graph (lint, build, test)
├── docker-compose.yml                   # local: postgres, minio, optional mail mock
├── docker-compose.override.example.yml  # optional local overrides (gitignored copy)
├── README.md
├── .github/
│   └── workflows/
│       └── ci.yml                     # lint, typecheck, test, build (web + api)
├── apps/
│   ├── web/                           # Next.js (App Router)
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   ├── tsconfig.json
│   │   ├── eslint.config.mjs          # or .eslintrc — align with root
│   │   ├── .env.example
│   │   ├── public/
│   │   └── src/
│   │       ├── app/
│   │       │   ├── layout.tsx
│   │       │   ├── page.tsx
│   │       │   ├── globals.css
│   │       │   └── [locale]/            # if locale in path (next-intl)
│   │       ├── components/              # app-level compositions (uses design system)
│   │       ├── features/                # optional: feature folders (charts, auth forms)
│   │       ├── lib/                     # api client, auth token helpers, env
│   │       └── i18n/
│   │           ├── request.ts
│   │           ├── routing.ts
│   │           └── messages/
│   │               ├── zh-CN.json
│   │               └── en.json
│   └── api/                           # NestJS
│       ├── package.json
│       ├── nest-cli.json
│       ├── tsconfig.json
│       ├── tsconfig.build.json
│       ├── eslint.config.mjs
│       ├── .env.example
│       └── src/
│           ├── main.ts
│           ├── app.module.ts
│           ├── common/                  # filters, guards, interceptors, pipes, decorators
│           ├── config/                  # validated env module (e.g. @nestjs/config + Joi/Zod)
│           ├── auth/
│           ├── users/
│           ├── charts/
│           ├── generation/              # LLM orchestration
│           ├── integrations/
│           │   └── llm/                 # LLM adapter implementation(s)
│           └── storage/                 # S3 client wrapper (upload, signed URLs)
├── packages/
│   ├── eslint-config/                 # shared ESLint flat config
│   │   ├── package.json
│   │   └── index.mjs
│   ├── typescript-config/             # shared tsconfig bases
│   │   ├── package.json
│   │   ├── base.json
│   │   ├── nextjs.json
│   │   └── nestjs.json
│   └── contracts/                     # shared DTO types / API contracts (Zod or TS types)
│       ├── package.json
│       ├── src/
│       │   ├── index.ts
│       │   ├── auth.ts
│       │   ├── charts.ts
│       │   └── errors.ts
│       └── tsconfig.json
└── tooling/                           # optional: scripts, codegen
    └── README.md
```

**Notes**

- **`packages/contracts`:** keeps request/response shapes aligned between web and api; api can import for validation, web for typing fetch wrappers. Alternative name: `@charts-generator/api-types`.
- **`apps/api/src/*` modules:** mirror architecture modules (Auth, Users, Charts, Generation, Integrations/LLM, Storage). Nest feature modules scale by adding folders, not by merging concerns.
- **`features/` under web:** optional; use if the UI grows beyond a few screens. For a thin MVP, `components/` + `app/` may suffice.

---

## 3. File list (minimum production-ready set)

### Root

| File | Purpose |
|------|---------|
| `package.json` | `private: true`, `scripts` (`dev`, `build`, `lint`, `test`, `typecheck`), `engines` optional |
| `pnpm-workspace.yaml` | `packages: ['apps/*', 'packages/*']` |
| `turbo.json` | Optional pipeline: `build` depends on `^build`, cache outputs |
| `.gitignore` | `node_modules`, `.env`, `.turbo`, `dist`, `.next`, coverage |
| `docker-compose.yml` | `postgres`, `minio` (S3 API), networks/volumes |
| `.github/workflows/ci.yml` | Install pnpm, cache store, run lint/typecheck/test/build |

### `apps/web`

| File | Purpose |
|------|---------|
| `package.json` | `next`, `react`, `next-intl`, dependency on `contracts` |
| `next.config.ts` | i18n-related config, `NEXT_PUBLIC_*` only for safe client vars |
| `tsconfig.json` | extends `typescript-config/nextjs.json` |
| `eslint.config.mjs` | extends shared config + Next plugin |
| `.env.example` | Public API base URL, public app URL (see §5) |
| `src/app/layout.tsx` | Root layout, providers |
| `src/lib/api-client.ts` | Typed fetch to `NEXT_PUBLIC_API_URL` + auth header |
| `src/i18n/*` | Locales, default `zh-CN` |

### `apps/api`

| File | Purpose |
|------|---------|
| `package.json` | `@nestjs/*`, `prisma` or `typeorm` + driver, `zod`/`class-validator`, `@aws-sdk/client-s3` or `minio`, dependency on `contracts` |
| `nest-cli.json` | Standard Nest build |
| `tsconfig.json` / `tsconfig.build.json` | Nest compile |
| `eslint.config.mjs` | Shared rules + Nest-friendly |
| `.env.example` | DB, JWT, S3, LLM keys (§5) |
| `src/main.ts` | Bootstrap, global prefix `/api/v1`, validation pipe |
| `src/app.module.ts` | Imports feature modules |
| `src/config/*.ts` | Validated configuration |
| `prisma/schema.prisma` | **If Prisma:** User, Chart, migrations folder |

### `packages/contracts`

| File | Purpose |
|------|---------|
| `package.json` | `main`/`types` to `dist` or `src` with `typescript` as devDep |
| `src/index.ts` | Re-export contracts |

### `packages/eslint-config` & `packages/typescript-config`

| File | Purpose |
|------|---------|
| Shared configs | One place to bump TS/ESLint rules for all apps |

---

## 4. Package manager setup

| Item | Choice |
|------|--------|
| **Manager** | **pnpm** (`packageManager` field in root `package.json` for Corepack) |
| **Workspaces** | `apps/*`, `packages/*` |
| **Internal deps** | `"@charts-generator/contracts": "workspace:*"` (adjust scope name to taste) |
| **Hoisting** | Default pnpm isolation; avoids phantom dependencies |

**Root scripts (illustrative)**

- `pnpm dev` — run web + api (concurrently via `turbo run dev` or `pnpm -r --parallel dev`)
- `pnpm build` — `turbo run build` or ordered build: contracts → api → web
- `pnpm lint` / `pnpm typecheck` / `pnpm test` — same pattern

---

## 5. Environment design

### 5.1 Principles

- **Never commit secrets.** Only `.env.example` files in repo.
- **API holds secrets** (DB, JWT private material, LLM keys, S3 keys). Web exposes only **`NEXT_PUBLIC_*`** where unavoidable (e.g. public API base URL).
- **Single source of truth** for non-secret defaults: `apps/api/src/config` validation (fail fast on boot).

### 5.2 `apps/web/.env.example`

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Base URL of Nest API (e.g. `http://localhost:3001`) |
| `NEXT_PUBLIC_APP_URL` | Yes | Browser-facing origin (OAuth/callbacks if added later) |

No database or LLM variables in web.

### 5.3 `apps/api/.env.example`

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `development` / `production` |
| `PORT` | No | Default `3001` |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | Yes* | If using JWT (*or equivalent session secret config) |
| `S3_ENDPOINT` | Dev | MinIO: `http://minio:9000` |
| `S3_REGION` | Yes | e.g. `us-east-1` |
| `S3_BUCKET` | Yes | Bucket for exports |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | Yes | MinIO dev keys |
| `S3_PUBLIC_BASE_URL` | Optional | Public CDN/base for returned URLs |
| `LLM_API_KEY` | Yes | Provider secret |
| `LLM_BASE_URL` | Optional | OpenAI-compatible base if not default |
| `LLM_MODEL` | Optional | Model id |
| `CORS_ORIGIN` | Yes | Web origin(s), e.g. `http://localhost:3000` |

Add `RATE_LIMIT_*` later if needed; omit for minimal MVP if acceptable.

### 5.4 Docker Compose

- **`postgres`:** mount volume, expose `5432` to host for local tools.
- **`minio`:** S3-compatible; create bucket on startup via init script or documented one-time step.
- **Optional:** do not put LLM keys in Compose; use `.env` for api container `env_file: apps/api/.env`.

---

## 6. Clean architecture mapping (API)

NestJS maps cleanly without a second meta-framework:

| Layer | Location | Responsibility |
|-------|----------|----------------|
| **Delivery** | `*.controller.ts` | HTTP, DTOs, status codes |
| **Application** | `*.service.ts` | Use cases: register user, save chart, run generation |
| **Domain** | `entities/`, value objects | Pure TS where useful; avoid leaking ORM into controllers |
| **Infrastructure** | `*.repository.ts`, Prisma/TypeORM modules, `integrations/llm`, `storage/` | DB, S3, HTTP to LLM |

**Rule:** controllers → services → repositories/adapters; LLM and S3 behind interfaces if you want easy mocks in tests.

---

## 7. CI/CD touchpoints (scaffold level)

| Stage | Action |
|-------|--------|
| **Install** | `pnpm install --frozen-lockfile` |
| **Lint** | ESLint on `apps/*`, `packages/*` |
| **Typecheck** | `tsc -b` or per-package `typecheck` |
| **Test** | Jest/Vitest (api unit), optional Playwright later for web |
| **Build** | Build `contracts` → `api` → `web` (order matters if web depends on types from contracts build) |
| **Artifacts** | Docker images `Dockerfile` per app under `apps/web` and `apps/api` when ready (not mandatory day one) |

---

## 8. Scalability notes (scaffold-level)

- **Apps split:** `apps/web` and `apps/api` deploy independently; env per environment.
- **DB migrations:** owned by api (Prisma migrate or TypeORM migrations); run in deploy pipeline before rolling new api.
- **Packages:** add later `packages/ui` (design system) if shared outside web; keep contracts slim.

---

## 9. Summary

| Area | Scaffold choice |
|------|------------------|
| **Monorepo** | pnpm workspaces + optional Turborepo |
| **apps/web** | Next.js App Router, `next-intl`, `src/app`, `src/i18n`, API client via env base URL |
| **apps/api** | NestJS, global prefix `/api/v1`, feature modules, validated config |
| **database** | PostgreSQL; Prisma in `apps/api` (or TypeORM — pick one, single ORM) |
| **infra (local)** | Docker Compose: Postgres + MinIO |
| **config** | Root + per-app `.env.example`; secrets only on server |
| **shared** | `packages/contracts`, `packages/eslint-config`, `packages/typescript-config` |

This document is the blueprint for running `/x-bootstrap-project` or manual repo creation; adjust package scope names (`@charts-generator/*`) once the final npm/org scope is fixed.
