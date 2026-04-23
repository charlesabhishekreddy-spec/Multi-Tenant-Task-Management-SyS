# Multi-Tenant Task Management System (RBAC)

Production-ready backend API implementing strict organization isolation, JWT auth, optional Google OAuth, RBAC, task CRUD, and audit logging.

## Stack

- Node.js + Fastify + TypeScript
- PostgreSQL + Prisma ORM
- JWT access + refresh tokens
- Optional Google OAuth (`idToken` flow)
- Docker + docker-compose
- Vitest test suite

## Core Security Model

- Every protected request uses tenant context from JWT claims only.
- Every data query includes `organizationId` filter.
- Members can only manage their own tasks (`createdBy`).
- Admins have full access within their organization.
- Passwords are hashed with bcrypt.
- Basic request rate limiting is enabled.

## API Base

- `/api/v1`
- Swagger UI: `/docs`
- Health check: `/api/v1/health`

## Quick Start (Docker)

1. Copy env template:

```bash
cp .env.example .env
```

2. Build and run:

```bash
docker compose up --build
```

3. Apply migrations if needed:

```bash
docker compose exec backend npm run prisma:migrate
```

## Local Run

1. Install dependencies:

```bash
npm install
```

2. Configure `.env` (see `.env.example`).

3. Generate Prisma client and migrate:

```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Seed bootstrap org/user:

```bash
npm run prisma:seed
```

5. Start:

```bash
npm run dev
```

## Migrations

An initial migration is already checked in:

- `prisma/migrations/20260423_init/migration.sql`

Apply migrations in production/CI with:

```bash
npx prisma migrate deploy
```

## Key Endpoints

### Auth

- `POST /api/v1/auth/bootstrap-admin`
  - Create organization + initial admin user
- `POST /api/v1/auth/register`
  - Register member in existing organization (by slug)
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/google`
  - Body includes `organizationSlug` + Google `idToken`
- `POST /api/v1/auth/refresh`

### Tasks (Admin + Member)

- `POST /api/v1/tasks`
- `GET /api/v1/tasks?page=1&limit=20&status=TODO`
- `PATCH /api/v1/tasks/:taskId`
- `DELETE /api/v1/tasks/:taskId`

### Users (Admin only)

- `GET /api/v1/users`
- `POST /api/v1/users`
- `PATCH /api/v1/users/:userId/role`

### Audit Logs (Admin only)

- `GET /api/v1/audit-logs`

## RBAC Matrix

| Action       | Admin           | Member |
|--------------|-----------------|--------|
| Create Task  | Yes             | Yes    |
| View Tasks   | All in org      | Own    |
| Update Task  | All in org      | Own    |
| Delete Task  | All in org      | Own    |
| Manage Users | Yes             | No     |

## Tests

```bash
npm test
npm run test:unit
npm run test:integration
```

Includes:

- Unit tests for RBAC and tenant filtering behavior
- Integration-style service tests for auth flow and task CRUD with role/tenant enforcement

## CI

GitHub Actions pipeline is included at:

- `.github/workflows/ci.yml`

CI runs:

- Dependency installation (`npm ci`)
- Prisma client generation
- Prisma migrations deploy against Postgres service
- TypeScript build
- Full test suite

## Postman

Ready-to-import Postman assets:

- `docs/postman/MultiTenantTaskManager.postman_collection.json`
- `docs/postman/PostmanEnvironment.example.json`

## Notes

- Tenant leakage prevention is implemented both in middleware and query-level filters.
- Client-provided tenant IDs are ignored; token tenant claim is authoritative.
- `organizationId` indexes are defined on task/user/audit models for tenant-scoped performance.
