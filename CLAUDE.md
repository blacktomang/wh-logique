# WH Logique Engineering Guide

## Project Goal
Build a pnpm-workspace monorepo containing:
- `apps/backend`: Go REST API using Gin.
- `apps/frontend`: React and TypeScript application.
- PostgreSQL as the primary database.
- Swagger/OpenAPI documentation.
- Docker Compose for the complete local stack.

The complete stack must start with:
```bash
docker compose up
```
This command must start the frontend, backend, and PostgreSQL together.

## General Rules
- Use English for code, identifiers, API messages, and documentation.
- Keep changes focused, modular, and consistent with existing patterns.
- Prefer small explicit functions over premature abstractions.
- Comment only to explain intent, constraints, or non-obvious behavior.
- Never hardcode secrets, credentials, hosts, or environment-specific values.
- Never weaken typing, linting, validation, or tests to make checks pass.
- Update documentation when setup commands or behavior change.

## Target Structure
```text
.
├── apps/
│   ├── backend/
│   │   ├── cmd/api/
│   │   ├── internal/
│   │   │   ├── config/
│   │   │   ├── handlers/
│   │   │   ├── middleware/
│   │   │   ├── models/
│   │   │   ├── repository/
│   │   │   ├── services/
│   │   │   └── validation/
│   │   ├── migrations/
│   │   ├── docs/
│   │   ├── Dockerfile
│   │   └── go.mod
│   └── frontend/
│       ├── src/
│       │   ├── api/
│       │   ├── components/
│       │   ├── features/
│       │   ├── hooks/
│       │   ├── layouts/
│       │   ├── pages/
│       │   ├── router/
│       │   ├── types/
│       │   └── utils/
│       ├── Dockerfile
│       └── package.json
├── packages/
├── docker-compose.yml
├── package.json
└── pnpm-workspace.yaml
```
- Use pnpm workspaces for JavaScript and TypeScript packages.
- Keep the Go module under `apps/backend`; pnpm must not manage Go dependencies.
- Create a shared package only when at least two consumers require it.

## Required Stack
### Backend
- Go and Gin.
- PostgreSQL.
- Swagger/OpenAPI.
- Environment-based configuration.
- Versioned SQL migrations using `.up.sql` and `.down.sql`.

### Frontend
- React with TypeScript strict mode.
- React Router v6.
- TanStack Query.
- pnpm.

### Infrastructure
- Docker and Docker Compose.
- Services named `frontend`, `backend`, and `postgres`.
- A named volume for PostgreSQL data.

## Backend Architecture
Use this dependency flow:
```text
HTTP request
  -> middleware
  -> handler/controller
  -> service
  -> repository
  -> PostgreSQL
```
Dependencies point inward only. Repositories must not import services or handlers,
and services must not import handlers.

### Handler or Controller
Handlers must:
- Bind path, query, header, and body input.
- Validate all external input before calling a service.
- Convert transport input into typed service input.
- Translate service results and typed errors into HTTP responses.
- Return the standard response envelope.
- Include required Swagger annotations.

Handlers must not contain business rules, execute SQL, access the database directly,
or pass `*gin.Context` into services.

### Service
Services must:
- Implement business rules and use-case orchestration.
- Accept `context.Context` and typed inputs.
- Own transaction boundaries for operations spanning repositories.
- Convert repository failures into domain or application errors.
- Remain independent of Gin request and response types.

### Repository
Repositories must:
- Encapsulate PostgreSQL queries and persistence behavior.
- Map database rows to domain models.
- Accept `context.Context`.
- Use parameterized SQL exclusively.
- Return typed or wrapped errors that services can interpret.
- Prevent driver-specific errors from leaking above the repository boundary.

Define repository interfaces when they improve separation or testability.
Keep interfaces close to consumers and avoid broad generic repositories.

### Models and DTOs
- Separate request DTOs, response DTOs, and database models when shapes differ.
- Use explicit JSON tags.
- Never expose sensitive or internal-only fields.
- Prefer concrete types over `map[string]any` for known structures.

## Middleware
Implement and consistently register:
1. Request logging.
2. Centralized error handling.
3. Standard response handling.
4. Panic recovery.

Request logs must include method, route, status, duration, and request ID.
Never log passwords, credentials, authorization tokens, or sensitive bodies.
Unexpected errors must be logged without exposing internals to clients.
Panic recovery must return a safe standard internal-error response.

## Input Validation
- Validate path, query, relevant headers, and JSON bodies in handlers.
- Finish validation before invoking a service.
- Validate required values, formats, ranges, enums, and transport constraints.
- Return field-level details for invalid input.
- Keep invariants requiring business knowledge or database access in services.
- Never rely on frontend validation for API safety.

## Standard API Envelope
Every endpoint must use reusable response types and helpers.
Do not construct unrelated response shapes in individual handlers.

### Success
```json
{
  "success": true,
  "message": "Item retrieved successfully",
  "data": {},
  "meta": { "page": 1, "limit": 10, "total": 42 }
}
```
- `success` is always `true`.
- `message` is stable and human-readable.
- `data` contains a resource, collection, or `null`.
- Include `meta` for pagination; omit it when not applicable.

### Error
```json
{
  "success": false,
  "message": "SKU already exists",
  "errors": [{ "field": "sku", "reason": "Duplicate entry" }]
}
```
- `success` is always `false`.
- `message` must not expose internal details.
- `errors` contains actionable details when applicable.
- Use consistent status codes for validation, authentication, authorization,
  not-found, conflict, and internal failures.

## Pagination
- Use `page` and `limit` unless cursor pagination is explicitly required.
- Validate both in the handler and enforce a reasonable maximum limit.
- Return `page`, `limit`, and `total` in `meta`.
- Use deterministic ordering in repository list queries.

## Configuration and Secrets
- Read runtime configuration from environment variables.
- Centralize backend configuration in `internal/config`.
- Validate required values during startup and fail clearly when invalid.
- Provide a safe `.env.example` file.
- Never commit `.env`, credentials, tokens, or production secrets.
- Configure HTTP port, environment, database, logging, and CORS externally.

## Database Migrations
Store migrations in `apps/backend/migrations` as matching pairs:
```text
000001_create_items.up.sql
000001_create_items.down.sql
000002_add_item_sku_index.up.sql
000002_add_item_sku_index.down.sql
```
- `.up.sql` applies a schema change.
- `.down.sql` reverses it whenever technically possible.
- Use sequential zero-padded version numbers.
- Never edit a migration that may already have been applied.
- Add a new pair for every later schema change.
- Never rely on manual database modifications.
- Use constraints for integrity and indexes for real query patterns.
- Keep seed or demo data separate from schema migrations.
- Document commands for applying and rolling back migrations.

## Docker Compose
The root `docker-compose.yml` must:
- Start `postgres`, `backend`, and `frontend` with `docker compose up`.
- Use environment variables or Compose variable substitution.
- Persist PostgreSQL data in a named volume.
- Include a PostgreSQL health check.
- Make the backend wait for database health, not only container start order.
- Configure the frontend API URL through environment variables.
- Expose documented ports without coupling application code to them.
- Provide a documented migration command or migration service.
- Use the same Compose network and database settings for migrations.
- Support graceful shutdown and useful container logs.
- Never embed production secrets in Compose files.

## Swagger and OpenAPI
- Document every public endpoint, parameter, request body, and response.
- Include schemas for standard success and error envelopes.
- Keep documented schemas consistent with actual DTOs.
- Keep generated files separate from hand-edited source.
- Document authentication requirements when authentication is added.
- Control Swagger UI exposure according to the environment.

## Frontend Architecture
Organize code by feature where practical. A feature may own its API calls,
components, hooks, types, and tests.

### Components
- One component must have one clear responsibility.
- Split components that mix unrelated behavior.
- Separate data orchestration from reusable presentation components.
- Prefer composition over large components with many mode flags.
- Keep pages focused on route-level coordination.

### Custom Hooks
Move stateful and data-fetching logic into focused hooks such as `useItems`,
`useItem`, `useCreateItem`, `useUpdateItem`, and `useStock`.
- Encapsulate relevant TanStack Query operations and stable query keys.
- Own mutation invalidation or cache updates.
- Return a small intentional API to components.
- Keep pure transformations in utility functions rather than hooks.

### TanStack Query
- Use TanStack Query for server state.
- Do not duplicate server state in component state without a clear reason.
- Define stable feature-scoped query-key factories.
- Handle loading, empty, error, and success states explicitly.
- Invalidate or update relevant cached queries after mutations.
- Normalize envelope parsing and API errors in the API client layer.

### React Router v6
- Define route configuration in `src/router`.
- Use nested routes and layouts for shared UI.
- Keep route guards focused on routing concerns.
- Provide not-found and route-level error handling.
- Centralize reused paths instead of scattering string literals.

### TypeScript
- Type every API request, resource, envelope, error, and pagination object.
- Do not use `any`; use `unknown` at untrusted boundaries and narrow safely.
- Separate transport types from UI types when their shapes differ.
- Prefer discriminated unions for mutually exclusive states.
- Never use unchecked assertions to bypass API validation.

## Error Handling
- Use typed or sentinel application errors in Go.
- Map application errors centrally to HTTP responses.
- Wrap unexpected errors with operation context while preserving the cause.
- Convert frontend API failures into a consistent typed error.
- Show useful messages without leaking server internals.
- Never silently swallow errors.

## Completion Checklist
Before considering a feature complete, confirm:
- Handlers validate input before service invocation.
- Business logic and database access stay in services and repositories respectively.
- API envelopes, errors, and backend/frontend data structures are consistently typed.
- Stateful frontend logic uses focused hooks and single-purpose components.
- Schema changes have `.up.sql`/`.down.sql` pairs and configuration has no secrets.
- Swagger, documentation, and relevant tests match actual behavior.
- `docker compose up` starts PostgreSQL, backend, and frontend together.
