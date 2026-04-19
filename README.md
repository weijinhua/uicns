# Charts Generator

Monorepo: **Next.js** (`apps/web`), **NestJS** (`apps/api`), shared **contracts** and **UI** design tokens/components.

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) 9 (`corepack enable`)

## Local development

1. Copy environment examples:

   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env.local
   ```

2. Start Postgres + MinIO (optional for API features that need them):

   ```bash
   docker compose up -d postgres minio
   ```

3. Install and run apps:

   ```bash
   pnpm install
   pnpm dev
   ```

   Or run each terminal:

   ```bash
   pnpm --filter @charts-generator/api dev
   pnpm --filter @charts-generator/web dev
   ```

- Web: [http://localhost:3000](http://localhost:3000) (locale prefix, e.g. `/zh-CN`)
- API health: [http://localhost:3001/api/v1/health](http://localhost:3001/api/v1/health)

## Docker (all services)

```bash
docker compose up --build
```

Set real `LLM_API_KEY` and secrets via `apps/api/.env` or compose overrides for non-local use.

**Note:** `next build` omits `output: "standalone"` by default so builds succeed on Windows without symlink privileges. On Linux CI you can enable `standalone` in `apps/web/next.config.ts` for smaller deploy images.

## Scripts

| Command        | Description        |
|----------------|--------------------|
| `pnpm dev`     | Turbo: dev tasks   |
| `pnpm build`   | Build all packages |
| `pnpm lint`    | ESLint             |
| `pnpm typecheck` | TypeScript       |
| `pnpm test`    | Tests (placeholders) |

## Specs

Product and technical specs live under `specs/`. Project governance—spec-driven delivery, package boundaries, contracts, code quality, testing, UX consistency, and performance—is in `.specify/memory/constitution.md`.
