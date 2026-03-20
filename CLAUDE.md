# Hostel Pro

Hostel/student accommodation management system. Migrating from NestJS + Supabase to a modern Bun + Next.js + PostgreSQL stack.

## Tech Stack

- **Runtime**: Bun 1.2.5
- **Framework**: Next.js (App Router) — single app for API + frontend
- **Database**: PostgreSQL 18 via Drizzle ORM + `postgres` driver
- **Auth**: Better Auth with custom OTP plugin (SMS via Twilio/MSG91)
- **Storage**: Local filesystem with HMAC signed URLs
- **Validation**: Zod (NOT class-validator)
- **Testing**: Vitest (unit/integration) + Playwright Test (E2E) + Playwright CLI (visual)
- **Styling**: Tailwind CSS 4 + Lucide React icons
- **i18n**: `next-intl` — cookie-based locale, no URL prefix (English + Hindi)
- **Payments**: Razorpay
- **Dev environment**: Devbox (Nix)

## Project Structure

```
hostel_pro/
├── CLAUDE.md                         ← You are here
├── MIGRATION_PLAN.md                 ← 9-phase migration roadmap
├── TESTING_STRATEGY.md               ← 4-layer testing pyramid
├── devbox.json                       ← Dev environment config
├── .claude/
│   ├── agents/                       ← 6 specialized agents
│   │   ├── architect.md              ← Tech lead (Opus)
│   │   ├── backend-dev.md            ← Backend dev (Sonnet)
│   │   ├── frontend-dev.md           ← Frontend dev (Sonnet)
│   │   ├── devops.md                 ← DevOps/infra (Sonnet)
│   │   ├── qa-tester.md              ← QA testing (Sonnet)
│   │   └── visual-tester.md          ← Visual testing (Sonnet)
│   ├── skills/                       ← 4 invocable skills
│   │   ├── postgres/SKILL.md         ← /pg — main DB management
│   │   ├── testdb/SKILL.md           ← /testdb — test DB management
│   │   ├── playwright/SKILL.md       ← /visual-test — screenshots
│   │   └── verify-migration/SKILL.md ← /verify-migration — checklist
│   └── settings.local.json
├── src/                              ← Application code (to be created)
│   ├── app/
│   │   ├── api/                      ← ~40 API route handlers
│   │   └── (pages)/                  ← Frontend pages
│   ├── components/                   ← ~280 React components
│   ├── i18n/
│   │   ├── config.ts                ← Locale list (en, hi), default
│   │   └── request.ts               ← getRequestConfig (reads cookie)
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts              ← Drizzle client
│   │   │   └── schema/               ← 14 schema files
│   │   ├── auth/                     ← Better Auth setup
│   │   ├── services/                 ← ~20 service modules
│   │   ├── storage/                  ← Local FS + signed URLs
│   │   └── errors.ts                 ← Custom error classes
│   ├── types/                        ← TypeScript type definitions
│   ├── test/                         ← Test setup, fixtures, helpers
│   └── middleware.ts
├── e2e/                              ← Playwright E2E tests
├── drizzle/
│   └── custom/triggers.sql           ← DB triggers (applied manually)
├── messages/                         ← Translation files
│   ├── en/                           ← English (9 JSON files)
│   └── hi/                           ← Hindi (9 JSON files)
├── uploads/                          ← Local file storage
└── .visual-tests/                    ← Visual test artifacts
```

## Code Conventions

### Services
- Plain exported functions or classes — **NO decorators, NO DI, NO NestJS patterns**
- Import `db` from `@/lib/db`, schemas from `@/lib/db/schema`
- Use `process.env.*` directly — no ConfigService wrapper
- Throw typed errors: `NotFoundError`, `ForbiddenError`, `ValidationError` from `@/lib/errors`

### API Routes
- Thin handlers: validate input → call service → return response
- Always check auth: `requireAuth(req)` + `requireRole(session, [roles])`
- Validate all input with Zod schemas

### Database
- All tables have `id` (UUID), `created_at`, `updated_at`
- Use `pgEnum` for all status/role fields
- Define relations in `src/lib/db/schema/relations.ts`
- Triggers in `drizzle/custom/triggers.sql` — applied manually, not via Drizzle
- Index all foreign keys and frequently queried columns

### Frontend
- Server components by default — `'use client'` only when needed
- Use Next.js routing (`<Link>`, `useRouter`) — **NO react-router-dom**
- Tailwind CSS 4 with `@import "tailwindcss"` — no tailwind.config.js needed
- `next/image` for all images
- `data-testid` attributes on E2E-targetable elements
- **No hardcoded user-facing strings** — every visible string uses `next-intl` translation keys

### i18n (Internationalization)
- **Library**: `next-intl` — cookie-based locale, no URL prefix
- **Locales**: `en` (English, default), `hi` (Hindi / हिन्दी)
- **Server components**: `const t = await getTranslations('Namespace')`
- **Client components**: `const t = useTranslations('Namespace')`
- **Messages**: `messages/en/*.json` and `messages/hi/*.json` — one file per feature domain
- **Shared strings** (buttons, nav, errors): go in `common.json`
- **English is source of truth** — write `en/` first, then `hi/`
- **Do NOT translate**: DB field names, API keys, log messages, route paths, code comments

### Validation
- Zod for everything — **NOT class-validator**
- Define schemas next to the service/route that uses them

## Commands

```bash
# Dev environment
devbox shell                          # Enter Nix shell with Bun + PostgreSQL

# Development
bun run dev                           # Start Next.js dev server
bun run build                         # Production build
bun run start                         # Run production server

# Database
bunx drizzle-kit generate             # Generate migrations
bunx drizzle-kit push                 # Push schema to DB
bunx drizzle-kit studio               # Visual DB management

# Testing
bun run test:unit                     # Unit tests (Vitest, fast)
bun run test:integration              # Integration tests (Vitest + real DB)
bun run test:e2e                      # E2E tests (Playwright)
bun run test:all                      # All layers sequentially
bun run test:coverage                 # Unit tests with coverage report
```

## Database

### Main Database
- **Host**: `localhost:5432`
- **Database**: `hostel_pro`
- **User**: `db_user1`
- **Container**: `accounts-automation-aadb-euaozw.1.ipljay5ckkzaqt5eapiaruru6`
- Managed via `/pg` skill

### Test Database
- **Database**: `hostel_pro_test` (same server)
- Used for integration and API tests — **never mock the DB**
- Managed via `/testdb` skill

## Skills

| Skill | Invoke | Purpose |
|-------|--------|---------|
| PostgreSQL | `/pg` | Query, inspect, manage main database |
| Test DB | `/testdb` | Create, reset, seed, truncate test database |
| Visual Test | `/visual-test` | Playwright screenshots, responsive, cross-browser |
| Verify Migration | `/verify-migration` | Checklist verification for migrated code |

## Agents

| Agent | Model | Primary Focus |
|-------|-------|--------------|
| `architect` | Opus | Architecture decisions, schema design, code review, phase planning |
| `backend-dev` | Sonnet | Drizzle schemas, services, API routes, auth, storage |
| `frontend-dev` | Sonnet | React components, pages, Tailwind UI, data fetching |
| `devops` | Sonnet | Docker, PostgreSQL ops, CI/CD, Devbox, deployment |
| `qa-tester` | Sonnet | Vitest tests, migration verification, coverage |
| `visual-tester` | Sonnet | Playwright visual testing, baselines, regression |

## Testing Strategy

4-layer pyramid defined in `TESTING_STRATEGY.md`:

1. **Unit** (`*.unit.test.ts`, `*.test.tsx`) — Vitest, jsdom — services, schemas, components
2. **Integration** (`*.integration.test.ts`, `*.api.test.ts`) — Vitest + real PostgreSQL — service→DB, API routes
3. **E2E** (`*.e2e.test.ts`) — Playwright Test — 10 critical user journeys
4. **Visual** — Playwright CLI screenshots — per-page baselines at 3 breakpoints

**Key rule**: No phase merges without tests. Run `/verify-migration` before marking anything done.

## Migration

9 phases defined in `MIGRATION_PLAN.md`:

```
Phase 0 (Setup) → Phase 1 (Schema) → Phase 2 (Auth)
                        ↓                  ↓
                  Phase 3 (Services) ←─────┘
                        ↓
                  Phase 4 (Storage) → Phase 5 (API Routes)
                        ↓                  ↓
                  Phase 7 (Crypto)   Phase 6 (Frontend)
                        ↓                  ↓
                  Phase 8 (Testing) → Phase 9 (Docker)
```

### Old codebase reference
`~/projects/hostel_old/repo/` — NestJS backend + Next.js 16 frontend + Supabase

### Migration pattern
```
NestJS @Injectable() class  →  Plain exported functions
supabase.from().select()    →  db.select().from().where()
class-validator decorators  →  Zod schemas
Supabase Auth               →  Better Auth
Supabase Storage            →  Local FS + HMAC signed URLs
ConfigService.get()         →  process.env.*
@Cron() decorators          →  API endpoint + external cron
```

## Security

- Never expose secrets in code — always `process.env`
- HMAC-verify all signed URLs
- Validate file types/sizes before storage
- Rate-limit auth endpoints
- All routes must have auth + RBAC checks
- Sanitize all user input
