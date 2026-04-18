# Charts Generator — Architecture Specification

**Source:** `specs/00-prd.md`  
**Principles:** simple, maintainable, avoid over-engineering; scale when metrics justify it.

---

## 1. System architecture (text diagram)

```
                                    ┌─────────────────────────────────────┐
                                    │           CDN / Static assets        │
                                    │   (Next.js build, fonts, images)     │
                                    └──────────────────┬──────────────────┘
                                                       │
┌──────────────┐         HTTPS (REST)                  │
│   Browser    │◄────────────────────────────────────┤
└──────┬───────┘                                      │
       │                                              ▼
       │  SSR / RSC / client bundle          ┌─────────────────┐
       └──────────────────────────────────► │   Next.js app   │
              (same origin or BFF)           │  (UI + i18n)    │
                                             └────────┬────────┘
                                                      │ REST / JSON
                                                      ▼
                                             ┌─────────────────┐
                                             │  NestJS API     │
                                             │  (auth, charts, │
                                             │   AI orchestr.) │
                                             └────────┬────────┘
                                                      │
                    ┌─────────────────────────────────┼─────────────────────────────┐
                    │                                 │                             │
                    ▼                                 ▼                             ▼
            ┌───────────────┐                ┌───────────────┐              ┌───────────────┐
            │  PostgreSQL   │                │ Object store  │              │ LLM provider  │
            │  (users,      │                │ (chart export │              │ (HTTP API)    │
            │   charts meta)│               │  PNG/SVG)     │              │               │
            └───────────────┘                └───────────────┘              └───────────────┘
```

**Deployment shape (initial):** one Next.js process, one NestJS process, one Postgres, one object-storage bucket, external LLM API. No separate message bus or service mesh.

---

## 2. Frontend / backend split

| Layer | Responsibility |
|--------|----------------|
| **Next.js (frontend)** | Pages, layout (left history + right chart + bottom input), design-system components only, **all UI strings via i18n** (default `zh-CN`), client-side chart rendering (library TBD in implementation), export triggers (download), optimistic UX. |
| **NestJS (backend)** | Email/password registration and login, sessions or JWT issuance, CRUD for saved charts and metadata, **orchestrating** LLM calls (prompt assembly, schema validation), persisting chart spec + rendered asset references, rate limiting and authz. |

**Rule:** the browser does not call the LLM directly. Secrets and provider quotas stay on the server.

---

## 3. Data storage design

### 3.1 PostgreSQL (relational)

| Area | Contents |
|------|-----------|
| **Users** | `id`, `email` (unique), password hash, timestamps; optional `email_verified_at` if verification is added later. |
| **Charts (saved)** | `id`, `user_id`, `title` (display name in list), `chart_spec` (JSON: type, data, labels — versioned shape), `thumbnail_url` or inline hash, `created_at`, `updated_at`. |
| **Sessions** (if cookie-based) | `id`, `user_id`, `expires_at` — or use stateless JWT with short TTL + refresh strategy (choose one in implementation). |

**Indexes:** `(user_id, updated_at DESC)` for the left-panel list; unique on `users.email`.

### 3.2 Object storage (blobs)

Exported PNG/SVG (and optional thumbnails) stored as objects; DB holds **URL or key + MIME type**, not large binaries in Postgres rows (keeps DB backups small and queries fast).

### 3.3 Caching (optional, later)

Redis only if profiling shows hot read paths or session storage needs; **not required for MVP** if traffic is modest and Postgres + connection pooling suffice.

---

## 4. API style

- **REST over HTTPS**, JSON request/response bodies.
- **Version prefix:** `/api/v1/...` (or Nest global prefix) for forward compatibility.
- **Errors:** consistent envelope (e.g. `code`, `message`, `details`) — message keys for i18n on client where applicable.
- **Auth:** `Authorization: Bearer <token>` or HTTP-only session cookie; align with Next.js data fetching (same-site cookies simplify SSR calls if applicable).

Representative resources:

- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`
- `GET /charts`, `GET /charts/:id`, `POST /charts`, `PATCH /charts/:id`, `DELETE /charts/:id`
- `POST /charts/generate` — body: user prompt (+ optional `chartType`); response: normalized `chart_spec` + metadata (LLM work done server-side)

---

## 5. Scalability strategy

**Target:** ~10k users, low latency, easy to scale.

| Mechanism | Purpose |
|-----------|---------|
| **Horizontal scaling** | Stateless API instances behind a load balancer; sticky sessions only if using server-side sessions without shared store (prefer JWT or Redis sessions for scale-out). |
| **DB** | Connection pooling (PgBouncer or driver pool), read replicas only if read-heavy — defer until needed. |
| **Next.js** | Static assets on CDN; SSR nodes scale independently of API. |
| **LLM calls** | Async job queue **only if** latency SLOs require it; otherwise synchronous with strict timeouts and streaming optional — start simple (sync + timeout). |
| **Rate limiting** | Per user/IP on `generate` and `auth` routes to protect cost and abuse. |

**Rule:** measure first; add Redis, queues, or replicas when metrics (p95 latency, error rates, DB CPU) justify the complexity.

---

## 6. AI integration points

1. **Input:** Natural-language prompt (+ optional explicit chart type from UI).
2. **Server-side pipeline:**
   - Validate auth and quotas.
   - Call LLM with a **fixed system prompt** and structured output contract (e.g. JSON schema for extracted series, categories, chart type).
   - Validate LLM output; on failure, return a safe error (no partial render of invalid data).
3. **Output:** Normalized `chart_spec` consumed by the frontend chart library; optional persistence on user “Save”.
4. **Observability:** Log request ids, latency, token usage (if available); no prompt/PII in logs in production without redaction policy.

**Boundary:** LLM is a **replaceable adapter** (interface in NestJS) so the provider can change without touching HTTP controllers or DB schema.

---

## 7. System modules

| Module | Role |
|--------|------|
| **Auth** | Registration, login, password hashing, token/session issuance. |
| **Users** | User profile projection (minimal). |
| **Charts** | List/detail CRUD, naming for sidebar, link to stored exports. |
| **Generation** | Prompt → LLM → validate → `chart_spec` response. |
| **Export** | Server or client render to image; upload to object storage; return download URL. |
| **Integrations / LLM** | Provider client, retries, timeouts. |

---

## 8. Service boundaries

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         NestJS monolith                                  │
│  ┌─────────┐  ┌─────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  Auth   │  │ Charts  │  │ Generation   │  │  LLM Adapter         │ │
│  │ module  │  │ module  │  │ module       │  │  (external HTTP)     │ │
│  └────┬────┘  └────┬────┘  └──────┬───────┘  └──────────┬─────────────┘ │
│       │            │              │                      │               │
│       └────────────┴──────────────┴──────────────────────┘               │
│                              │                                           │
│                    Shared: config, logging, guards, DTOs                 │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Charts** does not import LLM internals; **Generation** depends on **LLM adapter** and **Charts** persistence when saving.
- **Next.js** talks only to **HTTP API**, not to Postgres or LLM.

---

## 9. API flow (typical)

**Generate chart**

1. User submits prompt in Next.js → `POST /api/v1/charts/generate` with credentials.
2. NestJS **Auth** guard validates identity.
3. **Generation** builds LLM request, calls **LLM adapter**, parses/validates structured result.
4. Response returns `chart_spec` (+ optional `suggested_title`); UI renders in the chart panel.
5. On **Save**, `POST /api/v1/charts` persists title + `chart_spec` (+ export upload if implemented as part of save).

**Load history**

1. `GET /api/v1/charts` → sorted list for left panel.
2. `GET /api/v1/charts/:id` → full spec for selected item; UI renders without recalling LLM.

---

## 10. Data flow

```
User prompt (text)
       │
       ▼
Next.js ──JSON──► NestJS Generation
                       │
                       ▼
                 LLM (structured JSON)
                       │
                       ▼
              Validated chart_spec
                       │
         ┌─────────────┴─────────────┐
         ▼                             ▼
   In-memory render              Persist (optional)
   in browser                    Postgres + object store
         │                             │
         └─────────────┬───────────────┘
                       ▼
              Display / export image
```

**Export path:** chart library produces image client-side or server-side → upload to object storage → DB stores reference → client downloads via signed URL or proxied `GET`.

---

## 11. CI/CD (non-functional alignment)

- **Pipeline:** lint, typecheck, unit tests, build (Next + Nest), optional E2E on main; deploy artifacts to chosen host (containers or PaaS).
- **Environments:** `dev` / `staging` / `prod` with separate DB and storage buckets; secrets via vault or host secret manager.

---

## 12. Summary

| Topic | Decision |
|-------|----------|
| **Stack** | Next.js + NestJS + TypeScript (team familiarity). |
| **Topology** | Monolith API + separate frontend; single Postgres + object storage + external LLM. |
| **API** | REST/JSON, versioned, server-mediated AI. |
| **Scale** | Horizontal app instances, pooling, rate limits; add cache/queue/replicas by measurement. |
| **UI/i18n** | All copy via i18n; design system + core components only (per PRD). |

This document is the baseline for implementation specs and Cursor rules; detailed library choices (charting, i18n package, auth mechanism) belong in subsequent task-level specs.
