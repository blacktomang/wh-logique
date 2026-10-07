# Warehouse Inventory Management

A compact full-stack warehouse inventory application for managing item master data, warehouse locations, stock balances, and stock receipt history.

The project is a monorepo with a Go REST API, a React/TypeScript dashboard, PostgreSQL persistence, versioned migrations, and a Docker Compose development environment.

> **Reviewer shortcuts:** [Open the live demo](https://wh-logique.syamarif.my.id) · [Run the app with Docker](#quick-start-with-docker) · [Run the verification checks](#verification)

## Features

### Item management

- Create, list, view, edit, and soft-delete items.
- Enforce unique, case-normalized SKUs.
- Search by SKU or name with a 300 ms debounce.
- Filter by category and browse server-side pagination.
- Keep the table structure and column headers visible when no items match.

### Stock and locations

- Browse seeded warehouse locations.
- Receive stock into a selected location.
- Increment the existing item/location balance on every receipt.
- Apply multi-line receipts atomically.
- Show current stock by location and an append-only receipt log on the item detail page.

### User experience

- Responsive dashboard for desktop and tablet layouts.
- Explicit select controls, form validation, loading states, skeletons, empty states, error handling, and toast feedback.
- Dedicated pages for item creation, editing, and detail views.

## Technology stack

| Area | Technology |
| --- | --- |
| Backend | Go 1.26, Gin, pgx, Zap |
| Database | PostgreSQL 17 |
| Frontend | React 18, TypeScript, React Router 6 |
| Data fetching | TanStack Query 5 |
| UI | Tailwind CSS 4, Headless UI |
| API contract | OpenAPI 3.0 |
| Local environment | Docker, Docker Compose, pnpm |

## Architecture

```text
.
├── apps
│   ├── backend
│   │   ├── cmd/server             # Application entry point and routes
│   │   ├── docs                   # OpenAPI contract
│   │   ├── internal
│   │   │   ├── handlers           # HTTP binding and validation
│   │   │   ├── services           # Business rules
│   │   │   ├── repository         # PostgreSQL access
│   │   │   ├── middleware         # Logging, errors, recovery, CORS
│   │   │   └── models
│   │   └── migrations             # Versioned schema and seed data
│   └── frontend
│       └── src
│           ├── api                # HTTP client and endpoint functions
│           ├── components         # Shared UI primitives
│           ├── features           # Feature-level UI
│           ├── hooks              # Query and form hooks
│           ├── pages              # Route pages
│           └── types              # API and domain types
├── docker-compose.yml
└── package.json                   # Root Docker helper scripts
```

The backend follows `handler -> service -> repository`. Handlers own transport validation, services enforce business invariants, and repositories contain persistence concerns. API responses use a consistent envelope:

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

## Quick start with Docker

### Prerequisites

- Docker with Docker Compose v2

### Run the application

```bash
cp .env.example .env
docker compose up --build
```

After all services are healthy:

- Dashboard: <http://localhost:3000>
- API base URL: <http://localhost:8080/api/v1>
- OpenAPI specification: [`apps/backend/docs/swagger.yaml`](apps/backend/docs/swagger.yaml)

Migrations and location seed data run automatically before the API starts. Stop the stack with:

```bash
docker compose down
```

The PostgreSQL volume is retained. To remove it as well, use `docker compose down --volumes` only when the local data is no longer needed.

## Local development

### Prerequisites

- Go 1.26 or later
- Node.js 20 or later
- Corepack with pnpm 10.33.0
- Docker with Docker Compose v2, for PostgreSQL and migrations

Create the environment file and start the database:

```bash
cp .env.example .env
docker compose up -d postgres
docker compose run --rm migrate
```

Start the backend in one terminal:

```bash
cd apps/backend
go mod download
go run ./cmd/server
```

Start the frontend in another terminal:

```bash
cd apps/frontend
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

The development dashboard is available at <http://localhost:5173>. Vite proxies `/api/v1` requests to `http://localhost:8080`, so no frontend environment override is required for the default setup.

## Configuration

Copy `.env.example` to `.env` and adjust values when needed.

| Variable | Default | Purpose |
| --- | --- | --- |
| `POSTGRES_DB` | `wh_logique` | PostgreSQL database name |
| `POSTGRES_USER` | `wh_logique` | PostgreSQL user |
| `POSTGRES_PASSWORD` | `wh_logique_dev` | PostgreSQL password for local development |
| `POSTGRES_PORT` | `5432` | Host port exposed by PostgreSQL |
| `APP_ENV` | `development` | Backend runtime mode |
| `HTTP_PORT` | `8080` | Backend port for direct local execution |
| `BACKEND_PORT` | `8080` | Host port exposed by the backend container |
| `DATABASE_URL` | Local PostgreSQL URL | Backend database connection string |
| `CORS_ALLOWED_ORIGINS` | `*` | Comma-separated allowed origins |
| `FRONTEND_PORT` | `3000` | Host port exposed by the frontend container |
| `VITE_API_URL` | `/api/v1` | Frontend API base path |

For a deployed environment, use secret-managed database credentials and restrict `CORS_ALLOWED_ORIGINS` to the expected frontend origin.

## API overview

All endpoints are prefixed with `/api/v1`.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/locations` | List seeded warehouse locations |
| `POST` | `/items` | Create an item |
| `GET` | `/items` | Search, filter, and paginate active items |
| `GET` | `/items/{id}` | Get an active item |
| `PUT` | `/items/{id}` | Update an active item |
| `DELETE` | `/items/{id}` | Soft-delete an item |
| `POST` | `/stock/receive` | Increment stock and create receipt log entries |
| `GET` | `/stock/{item_id}` | Get stock balances by location |
| `GET` | `/stock/{item_id}/logs` | Get receipt history, newest first |

The complete schemas, parameters, and response definitions are in the [OpenAPI specification](apps/backend/docs/swagger.yaml).

## Verification

Run the backend tests that cover the assignment's handler and business-rule requirements:

```bash
cd apps/backend
go test -v -cover ./internal/handlers ./internal/services
```

These unit tests cover handler-level input validation, duplicate-SKU `409` responses, missing-item `404` responses, SKU normalization, repository-to-service error translation, and rejection of zero or negative stock receipts. The verbose output lists each requirement-focused test, while `-cover` reports coverage for both packages.

Run frontend static checks and a production build:

```bash
cd apps/frontend
pnpm lint
pnpm build
```

## Design decisions and trade-offs

### Layered backend

HTTP, business logic, and persistence are separated into handler, service, and repository layers. This adds interfaces and some boilerplate to a compact project, but keeps validation rules independently testable and makes storage or transport changes less invasive.

### Atomic stock receipt and audit log

A stock receipt uses a PostgreSQL transaction to increment balances and insert append-only log rows together. The log write is deliberately synchronous and transaction-bound rather than dispatched to a goroutine, so a successful response guarantees that both the balance and its audit record were committed. This prioritizes consistency and straightforward failure handling over the lower request latency an asynchronous approach could provide. The trade-off is tighter coupling to PostgreSQL transaction and upsert behavior, and the log table will require retention or pagination work at larger scale. At higher throughput, asynchronous logging would require a durable queue, retry handling, and idempotency safeguards rather than an untracked background goroutine.

### Soft deletion with reserved SKUs

Deleting an item sets `deleted_at`; default item queries exclude deleted rows. The database uniqueness constraint still reserves the SKU. This preserves identity and audit history, but reusing a SKU would require an explicit restore or administrative purge workflow.

### Server-driven list state

Search, category filtering, and pagination are handled by the API, while TanStack Query caches each parameter combination. This scales better than downloading the complete catalog and the 300 ms debounce limits search traffic. It also introduces request-state complexity and means a filter change may briefly show a loading transition.

### Containerized, versioned migrations

Database migrations run in a dedicated one-shot Docker service before the backend starts. Reviewers and maintainers therefore do not need to install a migration CLI or decide which SQL files to execute manually: the pinned migration tool applies every pending version in order. The same workflow is useful during development because the schema history is repeatable and remains synchronized across environments. The trade-off is an additional container and startup dependency; if a migration fails, the backend intentionally remains unavailable until the migration problem is resolved.

## Known limitations and next steps

- Automated coverage currently focuses on backend handlers and services; repository integration tests and frontend component/end-to-end coverage remain future work.
- Stock log responses are not paginated yet.
- The implemented inventory movement is inbound receipt only; outbound, adjustment, and transfer workflows are not included.
- Authentication and authorization are not included in the current scope.

## AI-assisted development disclosure

I do not have professional Go experience, so I began by reading [Understanding the Layered Architecture Pattern: A Comprehensive Guide](https://dev.to/yasmine_ddec94f4d4/understanding-the-layered-architecture-pattern-a-comprehensive-guide-1e2j). I then studied [Sanoy24/gin-rest-api-project-structure](https://github.com/Sanoy24/gin-rest-api-project-structure) as a practical Go and Gin reference that demonstrated the pattern clearly. Based on that research and the technical-test requirements, I defined the initial backend folder structure and created `CLAUDE.md` as a project-level engineering guide for the AI-assisted workflow.

AI generated an estimated 80% of the codebase. This is an approximate contribution estimate, not a line-by-line measurement. The generated work was directed by the architecture, stack, constraints, and implementation rules documented in `CLAUDE.md`. OpenAI Codex was also used for pair programming and review, including the dashboard redesign, stock workflow and log integration, requirement auditing, requirement-focused backend unit tests, verification, and README drafting.

My direct contributions included the initial architectural research and project structure, defining and refining the AI instructions, integrating the generated work, and reviewing and correcting implementations that did not meet the intended behavior. Examples of manual corrections include the loading-spinner and toast behavior, as well as backend request validation. When the initial generated backend code did not validate input in the handler layer as required, I corrected the implementation and added explicit handler-validation rules to `CLAUDE.md` so subsequent work would follow the same requirement.

AI output was treated as implementation assistance rather than an authority on the requirements. The technical-test specification and the project engineering guide remained the source of truth when generated code and required behavior differed.

## Submission checklist

- [ ] Run the verification commands above from a clean checkout.
