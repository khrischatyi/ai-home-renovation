# AI Home Renovation Platform - helpico.ai

## Project Overview
AI-powered home renovation platform that serves homeowners, not contractors. Unlike lead-gen services (HomeAdvisor, Angi), this platform provides genuine value: contractor matching, cost estimates, and AI-driven project management.

## Tech Stack
- **Backend**: FastAPI + SQLAlchemy 2.0 (async) + asyncpg + Alembic + Celery/Redis
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS v4 + Zustand
- **Database**: PostgreSQL 16
- **Queue**: Redis 7 + Celery (worker + beat)
- **Proxy**: Caddy (dev: reverse proxy, prod: auto-TLS + static files)
- **Auth**: JWT httpOnly cookies (access 15min + refresh 7days)
- **Payments**: Stripe (mock for MVP)
- **AI**: OpenClaw (to be integrated)

## Architecture
Modular monolith with domain modules:
```
Router (thin) -> Service (business logic) -> Repository (DB queries)
                     |
               Celery Tasks (async jobs)
```

### Domain Modules
- `users/` - Authentication, profile management
- `contractors/` - Search, scoring engine, review aggregation
- `projects/` - CRUD, cost estimation, contractor matching
- `payments/` - Stripe intents, webhooks

## Quick Commands
```bash
make dev          # Start all services (Docker)
make down         # Stop all services
make migrate      # Run DB migrations
make migration msg="description"  # Create new migration
make seed         # Seed contractor data
make logs         # Tail all logs
make shell        # Shell into backend
make test         # Run tests
```

## Project Structure
```
ai-home-renovation/
├── .env                     # Shared environment (DB, Redis, Stripe, etc.)
├── docker-compose.yml       # Development
├── docker-compose.prod.yml  # Production
├── Makefile
├── backend/
│   ├── pyproject.toml
│   ├── app/
│   │   ├── main.py          # FastAPI app factory
│   │   ├── config.py        # Pydantic settings from .env
│   │   ├── database.py      # Async SQLAlchemy engine/session
│   │   ├── dependencies.py  # DI: DbSession, CurrentUser
│   │   ├── seed.py          # Seed script (20 contractors)
│   │   ├── domain/
│   │   │   ├── users/       # Auth + profile
│   │   │   ├── contractors/  # Search + scoring
│   │   │   ├── projects/    # Intake + cost engine
│   │   │   └── payments/    # Stripe
│   │   └── worker/          # Celery tasks
│   └── alembic/             # DB migrations
├── frontend/
│   ├── src/
│   │   ├── pages/           # Home, ProjectIntake, ContractorResults, etc.
│   │   ├── components/      # UI components + layout
│   │   ├── api/             # API client + typed endpoints
│   │   └── stores/          # Zustand state
└── caddy/                   # Reverse proxy configs
```

## API Endpoints
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/projects           # Create project (anonymous OK)
GET    /api/v1/projects/{id}
PATCH  /api/v1/projects/{id}
POST   /api/v1/projects/{id}/match
GET    /api/v1/projects/{id}/contractors
POST   /api/v1/estimates
GET    /api/v1/contractors
GET    /api/v1/contractors/{id}
GET    /api/v1/contractors/{id}/reviews
POST   /api/v1/payments/create-intent
POST   /api/v1/payments/webhook
GET    /api/v1/payments/history
GET    /api/v1/users/me
PATCH  /api/v1/users/me
DELETE /api/v1/users/me
GET    /api/v1/health
```

## User Flow (3 Tiers)

### Tier 1: Free Instant Results (The Hook)
1. User selects project type (bathroom/kitchen/windows/roofing)
2. Fills in location, property details, scope, budget, timeline
3. System saves project to DB, runs cost estimation
4. Returns 5 top-ranked contractors with scores and cost range
5. **No account required** - tracked by anonymous session_id

### Tier 2: AI Design & Visualization ($25 paywall)
1. After Tier 1, user can explore design options
2. Material selection, measurement input, AI visualization
3. Detailed cost breakdown with specific materials
4. **OpenClaw integration point** - AI conversation for design consultation
5. Paywall triggers after 1-2 free iterations

### Tier 3: AI Concierge Services ($200-$500)
1. Account creation required
2. AI agent contacts contractors, schedules visits
3. Quote comparison, negotiation, project coordination
4. **OpenClaw integration point** - autonomous agent actions

## OpenClaw Integration Plan

### Where OpenClaw Plugs In

#### 1. Project Intake Enhancement (Tier 1)
- **Current**: Form-based step-by-step wizard
- **With OpenClaw**: Conversational AI intake that asks follow-up questions naturally
- **Integration point**: Replace/augment ProjectIntake page with chat interface
- **Data flow**: OpenClaw conversation -> extract structured data -> POST /api/v1/projects
- **Slack notification**: On project creation, send intake summary + any photos to configured Slack channel

#### 2. Contractor Search & Intelligence (Tier 1-2)
- **Current**: Database search with composite scoring
- **With OpenClaw**: AI-powered contractor research from multiple sources
- **Flow**:
  1. Project created -> Celery task queued
  2. OpenClaw agent searches Google Business, Yelp, licensing boards
  3. Aggregates reviews, extracts sentiment, verifies licenses
  4. Calculates composite scores using scoring engine weights
  5. Stores results in contractors table
  6. Notifies user when results ready
- **Integration point**: `app/worker/tasks/contractor_sync.py`

#### 3. Design Consultation (Tier 2)
- **Current**: Static material selection cards
- **With OpenClaw**: Interactive AI design consultant
- **Flow**:
  1. User enters design phase
  2. OpenClaw guides material selection conversationally
  3. Photo upload -> OpenClaw analyzes space, suggests options
  4. Generates design visualization (via image generation API)
  5. Produces detailed cost breakdown
- **Integration point**: New chat endpoint + frontend chat component
- **Token tracking**: Count tokens per session, trigger $25 paywall at threshold

#### 4. Contractor Negotiation (Tier 3)
- **Current**: Placeholder concierge service
- **With OpenClaw**: Autonomous contractor outreach agent
- **Flow**:
  1. User purchases concierge service
  2. OpenClaw composes professional outreach emails/SMS
  3. Sends via Twilio/SendGrid to top 5 contractors
  4. Parses contractor responses (availability, quotes, questions)
  5. Follows up automatically, schedules on-site visits
  6. Compiles quotes into comparison view
  7. All actions logged to user dashboard
- **Integration point**: `app/worker/tasks/contractor_outreach.py` (to be created)
- **Slack notification**: All outbound communications and responses logged to Slack channel
- **Human escalation**: Flag complex situations for user approval

### Slack Integration Plan
- Channel receives: project intake summaries, uploaded photos, contractor outreach logs, quote comparisons
- Format: Rich Slack blocks with project details, images, contractor info
- **Implementation**: Celery task that posts to Slack webhook on key events
- **Events to notify**:
  - New project created (with all intake details)
  - Contractor matches found
  - Outbound email/SMS sent to contractor
  - Contractor response received
  - Quote submitted
  - Escalation needed

### Data Flow Diagram
```
User -> Frontend Chat/Form -> POST /api/v1/projects
                                    |
                            Backend saves to DB
                                    |
                         Celery task: openclaw_search
                                    |
                    OpenClaw Agent -> Google/Yelp/BBB APIs
                                    |
                         Store contractors in DB
                                    |
                      Notify user (+ Slack channel)
                                    |
                    User views results -> Tier 2/3 upsell
                                    |
                    OpenClaw Design Agent / Negotiation Agent
                                    |
                         Slack channel: activity log
```

## Database Schema
Key tables: users, contractors, contractor_reviews, projects, project_contractors, payments
- `projects.scope` (JSONB) - stores all intake form data
- `projects.preferences` (JSONB) - contact info, notes
- `projects.session_id` - anonymous user tracking
- `contractors.score_breakdown` (JSONB) - per-factor scores
- `contractors.service_area_zips` (ARRAY) - zip codes served
- `contractors.specialties` (ARRAY) - project types (bathroom, kitchen, windows, roofing)

## Contractor Scoring Engine
Composite score (0-100) is a weighted blend of:
- **Review score** - Aggregated from Google, Yelp, BBB (normalized to 5.0 scale)
- **License score** - Active/verified = 100, expired = 40, none = 0
- **Insurance score** - Verified = 100, unverified = 0
- **Experience score** - Based on years in business (capped at ~25 years)
- **Responsiveness score** - How quickly contractor responds to inquiries

## Environment Variables
See `.env` for all required variables. Key settings:
- `DATABASE_URL` - Async PostgreSQL connection (asyncpg)
- `DATABASE_URL_SYNC` - Sync PostgreSQL connection (for scripts like seed)
- `REDIS_URL` - Redis for Celery task queue
- `SECRET_KEY` - JWT signing key
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` - Payment processing
- `CORS_ORIGINS` - Allowed frontend origins
- `DEBUG` - Enable debug mode and SQL echo

## Design System
- **Style**: Exaggerated minimalism, modern teal/orange
- **Headlines**: Epilogue (bold, 700-900 weight)
- **Body**: DM Sans (400-500 weight)
- **Primary**: Teal (#0D9488)
- **CTA**: Orange (#F97316)
- **Dark sections**: Slate-900 (#0F172A)
- **Light sections**: Cool off-white (#F8FAFB)

## Development Workflow

### Adding a new domain module
1. Create directory under `backend/app/domain/<module>/`
2. Add `models.py`, `schemas.py`, `service.py`, `repository.py`, `router.py`
3. Register router in `app/main.py`
4. Create migration: `make migration msg="add <module> tables"`
5. Apply migration: `make migrate`

### Running the seed script
```bash
make seed
# Or directly:
docker compose exec backend python -m app.seed
```
The seed script inserts 20 contractors (5 per project type) across zip codes in Beverly Hills (90210-90212), Manhattan (10001-10003), and Chicago (60601-60602). It is idempotent - it will skip seeding if contractors already exist.

### Database access
```bash
make shell-db    # Opens psql in the database container
```

## Code Conventions
- **Backend**: Python 3.12+, type hints everywhere, async by default
- **Models**: SQLAlchemy 2.0 mapped_column style (not legacy Column)
- **Schemas**: Pydantic v2 with model_config
- **Frontend**: TypeScript strict mode, functional components, Zustand for state
- **CSS**: Tailwind v4 utility classes, no custom CSS unless necessary
- **API**: RESTful, versioned under `/api/v1/`, JSON responses with consistent error format
