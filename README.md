# Warehouse Inventory Management

A full-stack warehouse inventory app for managing items, locations, stock balances, and stock receipt history.

**Stack:** Go + Gin API · React + TypeScript dashboard · PostgreSQL · Docker Compose

[Live demo](https://wh-logique.syamarif.my.id) · [Quick start](#quick-start) · [API overview](#api-overview) · [Run checks](#verification)

## What it does

- **Manage items:** create, search, filter, edit, view, and soft-delete item records.
- **Protect SKU integrity:** normalize SKUs, enforce uniqueness, and show availability feedback while editing.
- **Receive stock:** add one or more item/location quantities in a single atomic operation.
- **Track inventory:** view current balances per location and an append-only receipt history.
- **Handle real UI states:** validation, loading skeletons, empty states, errors, and toast feedback.

## Choose a setup

| Option | Best for | Trade-off |
| --- | --- | --- |
| [Docker Compose](#quick-start) | Reviewing or trying the complete app quickly | Rebuild the containers to pick up source changes |
| [Local development](#local-development) | Active backend or frontend development | Requires Go, Node.js, and pnpm locally |

Both options use PostgreSQL in Docker and apply the versioned migrations automatically or through the migration service.

## Quick start

### Prerequisite

- Docker with Docker Compose v2

### Start the complete application

```bash
cp .env.example .env
docker compose up --build
```

Wait for the services to become healthy, then open:

- Dashboard: <http://localhost:3000>
- API: <http://localhost:8080/api/v1>
- API contract: [`apps/backend/docs/swagger.yaml`](apps/backend/docs/swagger.yaml)

The database schema and location seed data are applied before the API starts.

### Stop or reset

```bash
docker compose down
```

This keeps the PostgreSQL volume. To also erase local database data, run `docker compose down --volumes`.

## Local development

### Prerequisites

- Go 1.26 or later
- Node.js 20 or later
- Corepack with pnpm 10.33.0
- Docker with Docker Compose v2

### 1. Start PostgreSQL and apply migrations

```bash
cp .env.example .env
docker compose up -d postgres
docker compose run --rm migrate
```

### 2. Start the API

In one terminal:

```bash
cd apps/backend
go mod download
go run ./cmd/server
```

### 3. Start the dashboard

In another terminal:

```bash
cd apps/frontend
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open <http://localhost:5173>. Vite proxies `/api/v1` to `http://localhost:8080`, so the default setup needs no frontend environment override.

## How the system is organized

```text
Browser
  -> React dashboard
  -> Go HTTP handler       validates transport input
  -> Service               applies business rules
  -> Repository            reads and writes PostgreSQL
```

```text
.
├── apps
│   ├── backend
│   │   ├── cmd/server          # Entry point and routes
│   │   ├── docs                # OpenAPI contract
│   │   ├── internal
│   │   │   ├── handlers        # HTTP binding and validation
│   │   │   ├── services        # Business rules
│   │   │   ├── repository      # PostgreSQL access
│   │   │   ├── middleware      # Logging, errors, recovery, CORS
│   │   │   └── models
│   │   └── migrations          # Schema and seed data
│   └── frontend
│       └── src
│           ├── api             # HTTP client and endpoints
│           ├── components      # Shared UI primitives
│           ├── features        # Feature-level UI
│           ├── hooks           # Query and form hooks
│           ├── pages           # Route pages
│           └── types           # API and domain types
├── docker-compose.yml
└── package.json                # Root Docker helper scripts
```

API responses use a consistent envelope:

```json
{
  "success": true,
  "message": "Items retrieved successfully",
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 0
  }
}
```

## Important behavior

- Item list searches match SKU or name after a 300 ms debounce.
- Category filters and pagination are server-driven.
- Deleting an item is a soft delete; its SKU remains reserved.
- A multi-line stock receipt either commits all balance and log changes or commits none.
- SKU availability feedback is advisory; the database constraint remains the source of truth.

## API overview

All endpoints use the `/api/v1` prefix.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/locations` | List seeded warehouse locations |
| `POST` | `/items` | Create an item |
| `GET` | `/items` | Search, filter, and paginate active items |
| `GET` | `/items/sku-availability` | Check exact SKU availability |
| `GET` | `/items/{id}` | Get an active item |
| `PUT` | `/items/{id}` | Update an active item |
| `DELETE` | `/items/{id}` | Soft-delete an item |
| `POST` | `/stock/receive` | Receive stock and write receipt logs |
| `GET` | `/stock/{item_id}` | Get balances by location |
| `GET` | `/stock/{item_id}/logs` | Get receipt history, newest first |

See the [OpenAPI specification](apps/backend/docs/swagger.yaml) for parameters, schemas, and response definitions.

## Configuration

Copy `.env.example` to `.env`. The defaults are intended for local development.

| Variable | Default | Purpose |
| --- | --- | --- |
| `POSTGRES_DB` | `wh_logique` | Database name |
| `POSTGRES_USER` | `wh_logique` | Database user |
| `POSTGRES_PASSWORD` | `wh_logique_dev` | Local database password |
| `POSTGRES_PORT` | `5432` | PostgreSQL host port |
| `APP_ENV` | `development` | Backend runtime mode |
| `HTTP_PORT` | `8080` | Backend port for direct local execution |
| `BACKEND_PORT` | `8080` | Backend container host port |
| `DATABASE_URL` | Local PostgreSQL URL | Backend connection string |
| `CORS_ALLOWED_ORIGINS` | `*` | Comma-separated allowed origins |
| `FRONTEND_PORT` | `3000` | Frontend container host port |
| `VITE_API_URL` | `/api/v1` | Frontend API base path |

For deployment, use secret-managed database credentials and restrict `CORS_ALLOWED_ORIGINS` to the expected frontend origin.

## Verification

### Backend tests

```bash
cd apps/backend
go test -v -cover ./internal/handlers ./internal/services
```

These tests cover handler validation, duplicate-SKU `409` responses, missing-item `404` responses, SKU normalization, service error translation, and rejection of non-positive stock receipts.

### Frontend checks

```bash
cd apps/frontend
pnpm lint
pnpm build
```

## Design decisions and trade-offs

| Decision | Why it helps | Cost / trade-off | If the system grows |
| --- | --- | --- | --- |
| Transactional balance and receipt-log writes | A successful response guarantees inventory and its audit record agree | Synchronous writes add latency and depend on PostgreSQL transaction/upsert behavior | Add log pagination and retention; use a durable queue with retries and idempotency only if async processing becomes necessary |
| Soft-delete items while reserving SKUs | Preserves identity and historical references | A deleted SKU cannot be reused | Add an explicit restore or administrative purge workflow |
| Server-side search, filtering, and pagination | Avoids downloading the full catalog and scales with catalog size | More request state and loading transitions in the UI | Add indexed search and tune caching for larger datasets |
| Debounced SKU availability check | Gives earlier feedback and avoids many failed submissions | Adds an endpoint and extra requests; results can become stale before save | Keep the database uniqueness constraint and submit-time `409` as the source of truth |
| One-shot, versioned migration container | Makes schema setup repeatable without a locally installed migration CLI | Adds a startup dependency; the API stays unavailable after a failed migration | Add deployment migration checks, backups, and rollback procedures |

## Known limitations

- Tests currently focus on backend handlers and services; repository integration and frontend component/end-to-end tests are not included.
- Stock receipt logs are not paginated.
- Inventory movements support inbound receipts only, not outbound, adjustment, or transfer workflows.
- Authentication and authorization are outside the current scope.

## AI-assisted development disclosure

I do not have professional Go experience, so I first studied a [layered architecture guide](https://dev.to/yasmine_ddec94f4d4/understanding-the-layered-architecture-pattern-a-comprehensive-guide-1e2j) and [Sanoy24/gin-rest-api-project-structure](https://github.com/Sanoy24/gin-rest-api-project-structure). I used that research and the technical-test requirements to define the initial backend structure and the project rules in `CLAUDE.md`.

AI generated an estimated 80% of the codebase; this is an approximate contribution estimate, not a line-by-line measurement. AI assisted with implementation and review, including the dashboard redesign, stock workflow and logs, requirement auditing, backend unit tests, verification, and README drafting.

My direct work included the initial research and architecture, defining and refining AI instructions, integrating generated code, and reviewing and correcting behavior. Manual corrections included loading-spinner and toast behavior and backend request validation. After generated code placed validation outside the required handler layer, I fixed it and added explicit validation rules to `CLAUDE.md`.

The technical-test specification and project engineering guide remained the source of truth whenever generated output differed from the required behavior.