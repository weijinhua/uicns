# Charts Generator Architecture Spec

## 1. System Architecture Diagram (Text)

```text
┌────────────────────────────── Client (Next.js Web App) ──────────────────────────────┐
│                                                                                        │
│  Sidebar: Chart History       Main: Chart Viewer + Prompt Input + Actions            │
│  - List saved charts          - Render selected/generated chart                        │
│  - Select chart               - Export image                                            │
│  - Create new chart           - Save to history                                         │
│                                                                                        │
└──────────────────────────────────────────────┬─────────────────────────────────────────┘
                                               │ HTTPS (REST + SSE/WebSocket optional)
                                               ▼
┌────────────────────────────── API Layer (NestJS, TypeScript) ─────────────────────────┐
│                                                                                        │
│  Auth Module          Chart Module          AI Orchestration Module                    │
│  - Email register     - CRUD chart meta     - Prompt parsing                           │
│  - Login (JWT)        - Query history       - Data extraction                           │
│  - Session/JWT guard  - Save chart config   - Chart type recommendation                 │
│                       - Export task req      - JSON chart spec generation               │
│                                                                                        │
│  Export Module        i18n Module           Observability Module                        │
│  - Render to PNG      - Locale resources    - Structured logs                           │
│  - Download URL       - Message fallback    - Metrics + tracing                         │
│                                                                                        │
└──────────────────────────────┬─────────────────────────────────────────────────────────┘
                               │
                 ┌─────────────┴─────────────┐
                 ▼                           ▼
      PostgreSQL (primary DB)         Redis (cache + queue + rate limit)
      - users                          - session/cache
      - charts                         - hot chart history cache
      - chart_versions                 - export/ai async job queue
      - audit_log
                               │
                               ▼
                        LLM Provider(s)
                        - Prompt -> structured data
                        - Data -> chart recommendation + spec
```

## 2. Frontend / Backend Split

### Frontend (Next.js App Router)

- **UI composition**
  - Left panel: chart history list (virtualized list for long history).
  - Right top: chart rendering area.
  - Right bottom: prompt input + actions (`Generate`, `Save`, `Export`).
- **Rendering strategy**
  - Use a chart renderer component fed by a normalized `ChartSpec` JSON.
  - Keep chart library encapsulated in one adapter layer (easy replacement).
- **State model**
  - Server state: history list, chart detail, auth profile (React Query/SWR).
  - Local state: current prompt text, generation progress, selected chart.
- **i18n**
  - Default locale `zh-CN`.
  - All strings come from i18n dictionaries; no hardcoded UI text.
  - Locale routing and language bundle lazy loading.
- **Design System compliance**
  - All screens composed by design-system core components only.
  - Shared token-driven spacing/color/typography for consistency.

### Backend (NestJS)

- **Auth module**
  - Email registration and username/password login.
  - Password hashing with Argon2/Bcrypt.
  - JWT access + refresh token strategy.
- **Chart module**
  - History query, chart retrieval, save chart, chart versioning.
  - Export request endpoint.
- **AI orchestration module**
  - Prompt preprocessing and safety checks.
  - LLM call with strict JSON schema response.
  - Fallback/retry when parsing fails.
- **Export module**
  - Render chart spec into PNG/SVG in worker process.
  - Return signed download URL.
- **Infra module**
  - Redis cache, queue workers, rate limiting, logging, monitoring.

## 3. Data Storage Design

### Primary Database: PostgreSQL

- **users**
  - `id (uuid, pk)`, `email (unique)`, `username (unique)`, `password_hash`, `created_at`, `updated_at`
- **charts**
  - `id (uuid, pk)`, `user_id (fk users.id)`, `title`, `chart_type`, `source_prompt`, `current_version_id`, `created_at`, `updated_at`
- **chart_versions**
  - `id (uuid, pk)`, `chart_id (fk charts.id)`, `spec_json (jsonb)`, `extracted_data_json (jsonb)`, `llm_model`, `created_at`
- **exports**
  - `id (uuid, pk)`, `chart_version_id (fk chart_versions.id)`, `file_url`, `status`, `expires_at`, `created_at`
- **audit_logs**
  - `id`, `user_id`, `action`, `resource_type`, `resource_id`, `meta_json`, `created_at`

### Cache / Queue: Redis

- **Cache**
  - `history:user:{userId}`: recent chart list cache.
  - `chart:detail:{chartId}`: chart detail/spec cache.
- **Queue**
  - `job:ai-generate`: optional async generation for heavy prompts.
  - `job:export-image`: chart export image jobs.
- **Rate limit**
  - Token bucket counters by `userId` and IP.

### Storage for exported images

- Object storage (S3-compatible) for generated files.
- Short-lived signed URL for secure download.

## 4. API Style

- **Style**: REST-first JSON API, OpenAPI documented.
- **Versioning**: `/api/v1/...`
- **Auth**: Bearer JWT.
- **Error shape**: consistent code/message/details format.
- **Idempotency**: support idempotency key on generation/export create endpoints.

### Core endpoints

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/charts`
- `GET /api/v1/charts/{chartId}`
- `POST /api/v1/charts/generate`
- `POST /api/v1/charts/{chartId}/save`
- `POST /api/v1/charts/{chartId}/export`
- `GET /api/v1/exports/{exportId}`

### Request/response contract principle

- `generate` endpoint receives `prompt`, optional `preferredChartType`, optional `locale`.
- Response always returns normalized `ChartSpec`:
  - `title`
  - `chartType`
  - `dimensions/axes`
  - `series[]`
  - `annotations[]`
  - `rawData[]`

## 5. Scalability Strategy

- **10k users target**
  - Stateless API instances behind load balancer.
  - Horizontal scale for NestJS pods/instances.
- **Performance**
  - Redis caching for hot history/detail.
  - DB indexes: `(user_id, updated_at)` on charts, GIN on `spec_json` if needed.
  - Pagination for history list.
- **Async processing**
  - Export and heavy AI tasks offloaded to queue workers.
  - Worker autoscaling by queue depth.
- **Resilience**
  - LLM timeout + retry + circuit breaker.
  - Graceful degradation: if AI fails, return actionable error with retry guidance.
- **Observability**
  - Metrics: request latency, LLM latency, export latency, queue lag, error rate.
  - Distributed tracing for generate flow.
  - Alerting for p95 latency and failure spikes.

## 6. AI Integration Points

### Integration flow

1. User submits natural language prompt.
2. Backend validates input and checks quota/rate limit.
3. AI Orchestrator calls LLM with strict system prompt and JSON schema.
4. LLM returns:
   - extracted structured data
   - suggested chart type (unless user specified one)
   - chart title/labels and rendering spec
5. Backend validates schema; on pass, persists chart version and returns `ChartSpec`.
6. Frontend renders the chart directly from returned spec.

### Guardrails

- Enforce JSON schema validation before persistence/rendering.
- Sanitize text fields to avoid script injection in chart labels.
- Keep deterministic fallback rules:
  - if AI recommendation invalid, fallback by rule-based chart selection.
  - if extraction partially fails, return editable draft spec to user.

### Prompting policy

- System prompt and output schema are versioned.
- Include locale context (`zh-CN` default) so titles/labels are localized.
- Track model and prompt-template version in `chart_versions`.

### Extensibility

- Provider adapter interface (`LLMProvider`) to support multiple models/vendors.
- A/B testing hooks for model selection and prompt-template variants.
- Feature flags for rolling out new AI parsing strategies safely.

## 7. Technology Decisions (Aligned with Team Stack)

- Frontend: Next.js + TypeScript + Design System core components + i18n framework.
- Backend: NestJS + TypeScript.
- Data: PostgreSQL + Redis.
- Queue: BullMQ (or equivalent Redis-based queue).
- Storage: S3-compatible object storage for export artifacts.
- Deployment: containerized services with horizontal autoscaling.

## 8. Security and Compliance Baseline

- Password hashes only, never plaintext.
- JWT secret rotation strategy.
- TLS enforced end-to-end.
- Input validation on all API boundaries.
- Per-user data isolation in all chart and export queries.
- Audit log for critical operations (login, chart save, export).

