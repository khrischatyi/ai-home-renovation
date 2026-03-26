# AI Home Renovation Platform — Scaffold Design

**Date:** 2026-03-25
**Status:** Approved

## Decisions

- **Architecture:** Modular monolith with domain modules (users, contractors, projects, payments)
- **Backend:** FastAPI + SQLAlchemy 2.0 async + asyncpg + Alembic + Celery/Redis
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Zustand
- **Auth:** JWT (access + refresh) in httpOnly cookies, anonymous sessions for Tier 1
- **DB:** PostgreSQL with async driver
- **Queue:** Redis + Celery (worker + beat)
- **Proxy:** Caddy (dev: reverse proxy, prod: reverse proxy + static files + auto-TLS)
- **Python packages:** TOML (pyproject.toml)
- **AI:** Skipped for now — user will integrate OpenClaw later
- **Design style:** Palmetto-inspired (bold serif headings, dark/light alternating sections, rounded cards, coral CTAs)

## Project Structure

```
ai-home-renovation/
├── .env / .env.example
├── docker-compose.yml              # Dev
├── docker-compose.prod.yml         # Prod
├── Makefile
├── backend/
│   ├── pyproject.toml
│   ├── Dockerfile / Dockerfile.prod
│   ├── alembic.ini + alembic/
│   └── app/
│       ├── main.py, config.py, database.py, dependencies.py
│       ├── middleware/
│       ├── domain/
│       │   ├── users/      (models, schemas, repository, service, router)
│       │   ├── contractors/ (+ scoring.py)
│       │   ├── projects/    (+ cost_engine.py)
│       │   └── payments/
│       └── worker/ (celery_app.py + tasks/)
├── frontend/
│   ├── package.json, Dockerfile, Dockerfile.prod
│   ├── vite.config.ts, tailwind.config.ts
│   └── src/
│       ├── api/, components/ (ui/, layout/), pages/, hooks/, stores/, styles/
└── caddy/
    ├── Caddyfile.dev
    └── Caddyfile.prod
```

## Layered Architecture

```
Router (thin) → Service (business logic) → Repository (DB queries)
                     ↓
               Celery Tasks (async jobs)
```

- Routers: parse + validate + delegate
- Services: business logic, orchestrate repositories
- Repositories: async SQLAlchemy queries only
- Scoring engine and cost engine as standalone modules

## Database Schema

**Tables:** users, contractors, contractor_reviews, projects, project_contractors, payments

Key points:
- `projects.user_id` nullable for anonymous Tier 1
- `session_id` UUID for anonymous tracking
- JSONB for scope, preferences, score_breakdown
- Separate contractor_reviews for multi-source aggregation

## API Design

- Versioned: `/api/v1/`
- Endpoints: auth (register/login/refresh/logout), projects CRUD + matching, contractors search, cost estimates, payments (Stripe intents + webhooks), user profile, health check
- Response format: `{ "data": ..., "error": ... }` with pagination meta
- Anonymous access for Tier 1, JWT required for Tier 3

## Docker Compose

- **Dev:** 6 services (backend, frontend, db, redis, celery-worker, caddy), hot-reload via volume mounts
- **Prod:** + celery-beat, multi-stage builds, Caddy serves static frontend, auto-TLS

## Makefile

Targets: dev, prod, down, migrate, migration, seed, logs, shell, test, lint

## Frontend

Pages: Home, ProjectIntake, ContractorResults, DesignStudio, Dashboard, Login, Register, Checkout

Palmetto style: bold serif headings, alternating dark/light sections, rounded cards, coral accent CTAs, generous whitespace, mobile-first.
