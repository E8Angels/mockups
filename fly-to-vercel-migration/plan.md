---
title: Fly.io/Turso → Vercel/Supabase Migration
status: draft
owner: jordan
created: 2026-05-16
last_updated: 2026-05-16
---

# Migration Plan: Fly.io/Turso → Vercel/Supabase

> **Source of truth for the migration.** Every work session starts by reading this file.
> Updated after each completed task. Never rely on conversation context for migration state.

---

## How to Use This Document

1. At the start of every work session, read this file top-to-bottom.
2. Find the first unchecked (`- [ ]`) task. That's what you work on.
3. After implementing, run every `VERIFY` command for that task. All must pass.
4. Only then mark the task `- [x]` and update the `Completed` date.
5. At phase boundaries (marked **GATE CHECK**), a fresh session re-runs ALL verification commands for the entire phase before proceeding.
6. If a VERIFY command fails, the task is NOT done. Fix it before moving on.

### Status Key
- `- [ ]` — not started
- `- [~]` — in progress (note who/what is working on it)
- `- [x]` — done, all VERIFY commands pass
- `- [!]` — blocked (reason noted inline)

---

## Current State

| Component | Status | Notes |
|-----------|--------|-------|
| Hosting | Fly.io (single 2GB VM) | `fly.toml`, `Dockerfile` |
| Database | Turso (libSQL/SQLite) | 83+ tables, 1,411 `turso.execute` calls |
| Background worker | In-process (`supplemental-worker.js`) | 18+ cron jobs via `node-cron` |
| Real-time | Server-Sent Events | 17 SSE endpoints across 11 route files |
| File uploads | multer disk storage → Google Drive | 10 route files |
| PDF generation | Puppeteer (headless Chrome in Docker) | 3 route files + 2 lib files |
| Dealum scraping | Selenium ChromeDriver | `lib/dealum-connector.js` |
| Auth | Custom magic link + TOTP + express-session | `lib/auth.js` (59 SQL calls) |
| Tests | 134 Jest unit tests, 2 Playwright E2E specs | `__tests__/`, `e2e/` |

---

## Migration Metrics (exact counts, for tracking progress)

These are the numbers that must reach zero (or their target) by the end of the migration.

| Metric | Starting Count | Current Count | Target |
|--------|---------------|---------------|--------|
| `turso.execute` calls | 1,411 | 1,411 | 0 |
| `INSERT OR IGNORE` | 43 | 43 | 0 |
| `INSERT OR REPLACE` | 24 | 24 | 0 |
| `strftime` in SQL | 17 | 17 | 0 |
| `datetime('now')` in SQL | 28 | 28 | 0 |
| `unixepoch` references | 324 | 324 | 0 |
| `AUTOINCREMENT` in DDL | 90 | 90 | 0 |
| `COLLATE NOCASE` | 43 | 43 | 0 |
| `tursoDatetimeToUtcIso` calls | 117 | 117 | 0 |
| `? 1 : 0` boolean coercions | 171 | 171 | 0 |
| `RAISE(ABORT` triggers | 2 | 2 | 0 |
| `json_extract` | 1 | 1 | 0 |
| `@libsql/client` in package.json | 1 | 1 | 0 |
| `sqlite3` in package.json | 1 | 1 | 0 |
| Playwright E2E tests passing | 2 | 2 | 30+ |

---

## Phase 0: Test Suite (baseline on current Fly/Turso stack)

> **Goal:** Green test suite on the existing system. This is the regression contract.
> **Branch:** `main` (tests are committed to main before migration branch is created)
> **All tests run against:** local dev server on `localhost:8080` backed by existing Turso DB

### 0A. Test infrastructure setup

- [ ] **Expand Playwright config for full E2E suite**
  - Add test helper module `e2e/helpers/test-data.js` with data-seeding functions
  - Seeding functions must use an abstract interface (not raw `turso.execute`), so the internals can be swapped during migration without changing test bodies
  - Add `e2e/helpers/auth.js` — helper to create authenticated session via `E8_SMOKE_AUTH_SESSION` cookie
  - VERIFY: `npx playwright test --list` shows all test files
  - VERIFY: `grep -r "turso" e2e/` returns 0 results (tests must not reference turso directly)

### 0B. Auth flow tests

- [ ] **`e2e/auth.spec.js`** — Authentication lifecycle
  - Test: Load `/` unauthenticated → redirects to `/auth/login`
  - Test: Login with smoke session cookie → homepage loads
  - Test: Session persists across page reload
  - Test: Logout → redirects to login
  - Test: Access admin page without admin role → appropriate denial
  - VERIFY: `npx playwright test e2e/auth.spec.js` — all pass

### 0C. Homepage and navigation tests

- [ ] **`e2e/homepage.spec.js`** — Member homepage
  - Test: Homepage renders feed content (not empty/error)
  - Test: Navigation to each main section via top nav works
  - Test: Dynamic page title updates on navigation
  - VERIFY: `npx playwright test e2e/homepage.spec.js` — all pass

### 0D. Application pipeline tests

- [ ] **`e2e/application-pipeline.spec.js`** — Core deal flow
  - Test: Load application review page → table renders with data
  - Test: Click into an application → detail view loads
  - Test: Screening vote submission (if test data supports it)
  - Test: Stage transition reflects in UI
  - VERIFY: `npx playwright test e2e/application-pipeline.spec.js` — all pass

### 0E. Admin grid tests

- [ ] **`e2e/admin-grid.spec.js`** — Generic admin data grid
  - Test: Load admin page → grid renders with rows
  - Test: Sort by column → order changes
  - Test: Text filter → rows filter
  - Test: Pagination (if enough rows)
  - VERIFY: `npx playwright test e2e/admin-grid.spec.js` — all pass

### 0F. Annual fund tests

- [ ] **`e2e/annual-fund.spec.js`** — Financial data
  - Test: Load annual fund dashboard → data renders
  - Test: Fund candidate list loads
  - Test: Capital call table renders (if data exists)
  - Test: Mercury transaction sync page loads
  - VERIFY: `npx playwright test e2e/annual-fund.spec.js` — all pass

### 0G. Diligence tests

- [ ] **`e2e/diligence.spec.js`** — Diligence workflow
  - Test: Open diligence investigation → sections render
  - Test: Add a section note → note appears
  - Test: Section owner assignment UI works
  - VERIFY: `npx playwright test e2e/diligence.spec.js` — all pass

### 0H. Documents and file upload tests

- [ ] **`e2e/documents.spec.js`** — Document management
  - Test: Document list loads for an application
  - Test: Upload a small test PDF → appears in list
  - Test: Document library page loads
  - VERIFY: `npx playwright test e2e/documents.spec.js` — all pass

### 0I. People and contacts tests

- [ ] **`e2e/people.spec.js`** — People/contacts
  - Test: Member directory loads with entries
  - Test: Search for a person by name → results filter
  - Test: Person detail page loads
  - Test: Add a note to a person → note appears
  - VERIFY: `npx playwright test e2e/people.spec.js` — all pass

### 0J. Public pages tests

- [ ] **`e2e/public-pages.spec.js`** — Unauthenticated pages
  - Test: `/privacy` loads without auth
  - Test: `/tos` loads without auth
  - Test: `/forms/confirm-accreditation` loads without auth
  - Test: `/health` returns 200 with JSON
  - VERIFY: `npx playwright test e2e/public-pages.spec.js` — all pass

### 0K. SSE / real-time UI tests

- [ ] **`e2e/real-time.spec.js`** — Verify SSE-consuming UIs render
  - Test: Application notes panel loads and shows existing notes (consumes SSE internally)
  - Test: Stack rank results page renders (consumes SSE internally)
  - Note: We don't test the SSE protocol directly — we test that the UI components that depend on SSE render correctly
  - VERIFY: `npx playwright test e2e/real-time.spec.js` — all pass

### 0L. Existing tests still pass

- [ ] **Verify existing test suites are green**
  - VERIFY: `npm test` — all 134 Jest tests pass
  - VERIFY: `npx playwright test` — all E2E tests pass (old + new)

---

### **--- GATE CHECK: Phase 0 ---**

- [ ] **Full suite verification**
  - Run: `npx playwright test` — ALL tests pass
  - Run: `npm test` — ALL tests pass
  - Run: `grep -r "turso" e2e/` — returns 0 results (no turso coupling in tests)
  - Record total test count here: _____ Playwright tests, _____ Jest tests
  - Commit to `main` with message: "Add comprehensive E2E test suite for migration baseline"
  - **Only after this gate passes:** create branch `migration/vercel-supabase` off `main`

---

## Phase 1: Supabase Schema and Data Migration

> **Goal:** Supabase instance running with identical data. No code changes yet.
> **Branch:** `migration/vercel-supabase`

### 1A. Supabase project setup

- [ ] **Create Supabase project**
  - Create project in Supabase dashboard (region: us-west-1 / closest to SJC)
  - Enable `citext` extension (`CREATE EXTENSION IF NOT EXISTS citext;`)
  - Record connection strings in `.env` as `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`
  - VERIFY: Can connect via `psql $DATABASE_URL` and run `SELECT 1`

### 1B. Schema translation

- [ ] **Create `scripts/supabase-schema.sql`**
  - Translate all 83+ tables from `createTables()` in `lib/cache-manager.js` (lines 1083–3690) to Postgres DDL
  - Translations required:
    - `INTEGER PRIMARY KEY AUTOINCREMENT` → `BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`
    - `BOOLEAN DEFAULT 0 CHECK (x IN (0,1))` → `BOOLEAN DEFAULT FALSE`
    - `BLOB` → `BYTEA`
    - `COLLATE NOCASE` → `citext` type
    - `unixepoch()` in defaults → `EXTRACT(EPOCH FROM NOW())::BIGINT`
    - `RAISE(ABORT, ...)` triggers → PL/pgSQL `RAISE EXCEPTION`
  - Include all indexes from existing schema
  - VERIFY: `psql $DATABASE_URL -f scripts/supabase-schema.sql` runs without errors
  - VERIFY: `psql $DATABASE_URL -c "\dt"` shows all 83+ tables
  - VERIFY: `psql $DATABASE_URL -c "\di"` shows all indexes

### 1C. Data migration script

- [ ] **Create `scripts/migrate-turso-to-supabase.js`**
  - Reads every table from Turso
  - Transforms: boolean `0`→`false`, `1`→`true` for all boolean columns
  - Transforms: datetime strings without timezone → append `Z` or handle as UTC
  - Writes to Supabase in batched inserts (500 rows per batch)
  - Logs row counts per table for verification
  - Supports `--dry-run` flag (count only, no writes)
  - Supports `--table=X` flag for single-table migration
  - VERIFY: Run with `--dry-run` — no errors, row counts logged for every table
  - VERIFY: Run against staging Supabase — completes without errors
  - VERIFY: For each table, `SELECT COUNT(*) FROM <table>` in Supabase matches Turso count

### 1D. Data integrity verification

- [ ] **Create `scripts/verify-migration.js`**
  - Connects to both Turso and Supabase
  - For every table: compares row counts
  - For 5 key tables (applications, companies, people, auth_sessions, deployments): compares 10 random rows field-by-field
  - Reports any mismatches
  - VERIFY: Script runs and reports 0 mismatches

---

### **--- GATE CHECK: Phase 1 ---**

- [ ] **Data verification**
  - Run: `node scripts/verify-migration.js` — 0 mismatches
  - Manual: Spot-check 3 records in Supabase dashboard vs Turso CLI
  - **Do not proceed until data is verified**

---

## Phase 2: Database Layer Swap (code changes)

> **Goal:** Application code uses Supabase/Postgres instead of Turso. All tests pass.
> **Branch:** `migration/vercel-supabase` (continuing)

### 2A. Postgres client setup

- [ ] **Create `lib/supabase-client.js`**
  - Uses `postgres` npm package (porsager/postgres) for SQL queries
  - Exports singleton `sql` tagged-template client
  - Connection via `DATABASE_URL` env var (Supabase connection pooler URL)
  - VERIFY: `node -e "const sql = require('./lib/supabase-client'); sql\`SELECT 1\`.then(console.log)"` returns `[{ ?column?: 1 }]`

- [ ] **Create `lib/pg-session-store.js`** (or install `connect-pg-simple`)
  - Implements express-session Store interface using Postgres
  - Drop-in replacement for `TursoSessionStore`
  - VERIFY: `grep -r "TursoSessionStore" lib/ routes/ index.js` returns 0 results
  - VERIFY: `grep -r "pg-session-store\|connect-pg-simple" lib/ index.js` returns 1+ results

### 2B. Cache manager SQL conversion

This is the largest task. 1,411 `turso.execute` calls across 17 files in `lib/cache-manager/` and `lib/cache-manager.js`.

The conversion is mechanical but must be done file-by-file with verification after each.

**For each file below:** convert all `this.turso.execute({sql: '...', args: [...]})` to `this.sql` tagged template queries. Apply all syntax transforms (INSERT OR IGNORE → ON CONFLICT DO NOTHING, etc.). Run grep counts after each file to verify progress.

- [ ] **`lib/cache-manager.js`** (868 calls — the monolith)
  - VERIFY: `grep -c "turso.execute" lib/cache-manager.js` returns 0
  - VERIFY: `grep -c "INSERT OR IGNORE" lib/cache-manager.js` returns 0
  - VERIFY: `grep -c "INSERT OR REPLACE" lib/cache-manager.js` returns 0
  - VERIFY: `grep -c "strftime" lib/cache-manager.js` returns 0
  - VERIFY: `grep -c "datetime('now')" lib/cache-manager.js` returns 0
  - VERIFY: `grep -c "unixepoch" lib/cache-manager.js` returns 0
  - VERIFY: `grep -c "AUTOINCREMENT" lib/cache-manager.js` returns 0
  - VERIFY: `grep -c "COLLATE NOCASE" lib/cache-manager.js` returns 0
  - VERIFY: `grep -c "tursoDatetimeToUtcIso" lib/cache-manager.js` returns 0
  - VERIFY: `npm test -- --testPathPattern="cache-manager"` passes

- [ ] **`lib/cache-manager/people-identity.js`** (114 calls)
  - VERIFY: `grep -c "turso.execute" lib/cache-manager/people-identity.js` returns 0
  - VERIFY: `grep -c "tursoDatetimeToUtcIso" lib/cache-manager/people-identity.js` returns 0
  - VERIFY: `npm test -- --testPathPattern="people"` passes

- [ ] **`lib/cache-manager/diligence.js`** (108 calls)
  - VERIFY: `grep -c "turso.execute" lib/cache-manager/diligence.js` returns 0
  - VERIFY: `grep -c "tursoDatetimeToUtcIso" lib/cache-manager/diligence.js` returns 0
  - VERIFY: `npm test -- --testPathPattern="diligence"` passes

- [ ] **`lib/cache-manager/permissions.js`** (44 calls)
  - VERIFY: `grep -c "turso.execute" lib/cache-manager/permissions.js` returns 0
  - VERIFY: `npm test -- --testPathPattern="permission"` passes

- [ ] **`lib/cache-manager/companies-applications.js`** (40 calls)
  - VERIFY: `grep -c "turso.execute" lib/cache-manager/companies-applications.js` returns 0
  - VERIFY: `npm test -- --testPathPattern="companies"` passes

- [ ] **`lib/cache-manager/annual-fund.js`** (35 calls)
  - VERIFY: `grep -c "turso.execute" lib/cache-manager/annual-fund.js` returns 0
  - VERIFY: `npm test -- --testPathPattern="annual-fund"` passes

- [ ] **`lib/cache-manager/financials-portfolio.js`** (27 calls)
  - VERIFY: `grep -c "turso.execute" lib/cache-manager/financials-portfolio.js` returns 0
  - VERIFY: `npm test -- --testPathPattern="financials\|portfolio"` passes

- [ ] **`lib/cache-manager/meetings.js`** (23 calls)
  - VERIFY: `grep -c "turso.execute" lib/cache-manager/meetings.js` returns 0
  - VERIFY: `npm test -- --testPathPattern="meeting"` passes

- [ ] **`lib/cache-manager/admin-views.js`** (16 calls)
  - VERIFY: `grep -c "turso.execute" lib/cache-manager/admin-views.js` returns 0
  - VERIFY: `npm test -- --testPathPattern="admin-view"` passes

- [ ] **`lib/cache-manager/scheduling-jobs.js`** (16 calls)
  - VERIFY: `grep -c "turso.execute" lib/cache-manager/scheduling-jobs.js` returns 0
  - VERIFY: `npm test -- --testPathPattern="schedul"` passes

- [ ] **`lib/cache-manager/communications-messaging.js`** (14 calls)
  - VERIFY: `grep -c "turso.execute" lib/cache-manager/communications-messaging.js` returns 0
  - VERIFY: `npm test -- --testPathPattern="communication\|messag"` passes

- [ ] **`lib/cache-manager/document-library.js`** (11 calls)
  - VERIFY: `grep -c "turso.execute" lib/cache-manager/document-library.js` returns 0
  - VERIFY: `npm test -- --testPathPattern="document-library"` passes

- [ ] **`lib/cache-manager/documents-files.js`** (7 calls)
  - VERIFY: `grep -c "turso.execute" lib/cache-manager/documents-files.js` returns 0
  - VERIFY: `npm test -- --testPathPattern="document"` passes

- [ ] **`lib/cache-manager/news-approval.js`** (7 calls)
  - VERIFY: `grep -c "turso.execute" lib/cache-manager/news-approval.js` returns 0
  - VERIFY: `grep -c "tursoDatetimeToUtcIso" lib/cache-manager/news-approval.js` returns 0
  - VERIFY: `npm test -- --testPathPattern="news"` passes

- [ ] **`lib/cache-manager/member-photos.js`** (4 calls)
  - VERIFY: `grep -c "turso.execute" lib/cache-manager/member-photos.js` returns 0

- [ ] **`lib/cache-manager/homepage.js`** (1 call)
  - VERIFY: `grep -c "turso.execute" lib/cache-manager/homepage.js` returns 0

### 2C. Auth layer conversion

- [ ] **`lib/auth.js`** (59 calls)
  - Convert all `turso.execute` to postgres tagged templates
  - `INSERT OR IGNORE` → `ON CONFLICT DO NOTHING` (10 instances)
  - `INSERT OR REPLACE` → `ON CONFLICT (...) DO UPDATE SET ...` (1 instance)
  - `datetime('now')` → `NOW()` (3 instances)
  - VERIFY: `grep -c "turso.execute" lib/auth.js` returns 0
  - VERIFY: `grep -c "INSERT OR IGNORE" lib/auth.js` returns 0
  - VERIFY: `npm test -- --testPathPattern="auth"` passes

### 2D. Session store conversion

- [ ] **`lib/turso-session-store.js`** → replaced by `lib/pg-session-store.js`
  - VERIFY: `grep -c "turso.execute" lib/turso-session-store.js` — file deleted or returns 0
  - VERIFY: `grep -r "turso-session-store" lib/ index.js` returns 0

### 2E. Straggler route files (7 direct turso.execute calls)

- [ ] **Convert direct DB calls in route files**
  - `routes/admin.js` (3 calls)
  - `routes/diligence.js` (1 call)
  - `routes/application-forms.js` (1 call)
  - `routes/admin-application-forms.js` (1 call)
  - `routes/meetings.js` (1 call)
  - NOTE: Per AGENTS.md rules, these should be moved to cache-manager methods, but for migration purposes, convert them first, refactor second.
  - VERIFY: `grep -r "turso.execute" routes/` returns 0

### 2F. Boolean normalization (application code)

- [ ] **Convert `? 1 : 0` patterns** (171 instances across 32 files)
  - For boolean DB columns: change to `? true : false` or `Boolean(x)`
  - CAUTION: Not all `? 1 : 0` are boolean DB writes — some are UI logic (counting, array indexing). Each must be evaluated in context.
  - VERIFY: `grep -rc "? 1 : 0" lib/ routes/ src/` — total decreases to only non-DB-boolean uses
  - Document remaining count and why each is not a boolean: _____

- [ ] **Convert `=== 1` / `=== 0` boolean reads**
  - CAUTION: Same as above — not all are boolean column checks. Many are legitimate numeric comparisons.
  - Focus on: files that read from DB result rows and check boolean columns
  - Run the E2E suite after each batch of changes
  - VERIFY: `npx playwright test` — all pass after boolean changes

### 2G. Remove turso datetime helpers

- [ ] **Delete all `tursoDatetimeToUtcIso` function definitions and calls** (117 instances across 5 files)
  - Postgres returns proper ISO timestamps — these are no longer needed
  - VERIFY: `grep -r "tursoDatetimeToUtcIso" lib/` returns 0

### 2H. Remove turso instrumentation

- [ ] **Remove `lib/turso-instrumentation.js`** and all references
  - This includes the `json_extract` call (1 instance)
  - VERIFY: `grep -r "turso-instrumentation" lib/ routes/ index.js` returns 0
  - VERIFY: `grep -r "json_extract" lib/ routes/` returns 0

### 2I. Update index.js entry point

- [ ] **Replace turso client initialization in `index.js`**
  - Remove `@libsql/client` import and client creation
  - Import `sql` from `lib/supabase-client.js`
  - Pass to CacheManager and auth
  - Replace `TursoSessionStore` with `PgSessionStore`
  - VERIFY: `grep -r "@libsql/client" lib/ routes/ index.js` returns 0
  - VERIFY: `grep -r "createClient" index.js` returns 0 (the turso createClient, not supabase)

---

### **--- GATE CHECK: Phase 2 ---**

- [ ] **Zero turso references in application code**
  - Run: `grep -r "turso.execute" lib/ routes/ index.js` — returns 0
  - Run: `grep -r "turso" lib/ routes/ index.js --include="*.js" | grep -v "node_modules" | grep -v "\.md" | grep -v "scripts/"` — returns 0 (excluding migration scripts and docs)
  - Run: `grep -r "INSERT OR IGNORE" lib/ routes/` — returns 0
  - Run: `grep -r "INSERT OR REPLACE" lib/ routes/` — returns 0
  - Run: `grep -r "strftime" lib/ routes/` — returns 0
  - Run: `grep -r "datetime('now')" lib/ routes/` — returns 0
  - Run: `grep -r "AUTOINCREMENT" lib/` — returns 0
  - Run: `grep -r "tursoDatetimeToUtcIso" lib/` — returns 0
- [ ] **All tests pass**
  - Run: `npm test` — all Jest tests pass
  - Run: `npx playwright test` — all E2E tests pass
  - Record: _____ Jest passing, _____ Playwright passing
- [ ] **App runs locally against Supabase**
  - Start dev server with Supabase env vars
  - Manually verify: login works, homepage loads, application review loads, admin grid loads

---

## Phase 3: Vercel Serverless Conversion

> **Goal:** App runs on Vercel. Express wrapped as serverless function.
> **Branch:** `migration/vercel-supabase` (continuing)

### 3A. Vercel project setup

- [ ] **Create `vercel.json`**
  - Single serverless function wrapping the Express app
  - Static asset serving for `public/build/`
  - Rewrites: `/(.*) → /api/index`
  - Function config: `maxDuration: 60`, `memory: 1024`
  - VERIFY: File exists and is valid JSON

- [ ] **Create `api/index.js`** — Vercel serverless entry point
  - Imports and exports the Express app from `index.js`
  - VERIFY: File exists

### 3B. Vite build for Vercel

- [ ] **Update `vite.config.mjs`**
  - Remove `atomicSwapPlugin` (Vercel builds are atomic)
  - Output to `public/build/` directly (no swap dance)
  - VERIFY: `npx vite build` completes without errors
  - VERIFY: `ls public/build/index.html` exists

### 3C. File uploads — disk to memory

- [ ] **Convert all multer instances from disk to memory storage**
  - Files to change (10 route files):
    - `routes/documents.js`
    - `routes/application-forms.js`
    - `routes/annual-fund.js`
    - `routes/screening-review.js`
    - `routes/document-library.js`
    - `routes/admin.js` (some already memoryStorage — verify all are)
    - `routes/index.js`
    - `routes/pitch-deck-analyzer.js`
    - `routes/annual-fund-onboarding.js`
    - `routes/follow-on-application.js`
    - `routes/investment-interest.js`
  - Verify each upload handler passes `req.file.buffer` (not `req.file.path`) downstream
  - VERIFY: `grep -r "diskStorage\|dest:" routes/ | grep -v node_modules` returns 0
  - VERIFY: `grep -r "uploads/" routes/ lib/ | grep -v node_modules | grep -v ".md"` — only cleanup/ignore references remain
  - VERIFY: `npx playwright test e2e/documents.spec.js` — upload test passes

### 3D. Filesystem writes → memory/DB

- [ ] **Eliminate all `fs.writeFile` / `fs.writeFileSync` in route handlers**
  - `routes/zoom.js` — webhook logs → write to Supabase table or skip
  - `routes/pitch-deck-analyzer.js` — temp PDF → use buffer
  - `routes/zapier-email-ingest.js` — attachment files → use buffers
  - `routes/screening-review.js` — temp PDF → use buffer
  - `routes/diligence.js` — uploaded files → use buffer
  - VERIFY: `grep -rn "fs.writeFile\|fs.writeFileSync\|fs.mkdirSync" routes/` — returns 0 (or only creates within `/tmp` which Vercel allows)

### 3E. In-memory state → Supabase

- [ ] **Migrate `_pollStore` (magic link poll tokens)** from in-memory Map to Supabase table
  - Create `auth_poll_tokens` table with TTL
  - Update `lib/auth.js` poll token methods
  - VERIFY: `grep -r "_pollStore" lib/auth.js` returns 0 (or it now delegates to DB)
  - VERIFY: Login flow still works in E2E

- [ ] **Migrate Slack conversation store** from in-memory to Supabase table
  - `routes/slack.js` — find the in-memory store, replace with DB-backed
  - VERIFY: Slack route handler references DB, not local object

### 3F. Remove Fly.io-specific code

- [ ] **Remove process manager and Fly.io config**
  - Delete or archive: `scripts/start-all.js`, `fly.toml`, `Dockerfile`, `deploy.sh`, `prepare-deploy.sh`
  - Update `package.json` `start` script for Vercel (not needed — Vercel uses `vercel.json`)
  - VERIFY: `ls fly.toml` — file does not exist (or moved to `archive/`)
  - VERIFY: `ls Dockerfile` — file does not exist (or moved to `archive/`)

---

### **--- GATE CHECK: Phase 3 ---**

- [ ] **Vercel preview deployment works**
  - Deploy to Vercel preview
  - VERIFY: `/health` returns 200
  - VERIFY: Login flow works on preview URL
  - VERIFY: Homepage loads with data
  - VERIFY: File upload works (documents test)
  - Run: `npx playwright test` against preview URL — all pass
- [ ] **No filesystem dependencies remain**
  - Run: `grep -rn "diskStorage\|dest:" routes/` — returns 0
  - Run: `grep -rn "fs.writeFile\|fs.writeFileSync" routes/` — returns 0 (except `/tmp`)

---

## Phase 4: Worker Separation (Fly.io sidecar)

> **Goal:** Background worker runs independently on Fly.io, connecting to same Supabase.
> **This is a separate deployable, not part of the Vercel app.**

### 4A. Worker Dockerfile

- [ ] **Create `worker/Dockerfile`** — minimal image for the background worker
  - Node 24 + Chrome (for Puppeteer PDF gen and Selenium/Dealum)
  - Does NOT include Vite build or frontend assets
  - Runs `node scripts/supplemental-worker.js`
  - VERIFY: `docker build -f worker/Dockerfile -t e8-worker .` succeeds

### 4B. Worker fly.toml

- [ ] **Create `worker/fly.toml`** — separate Fly.io app for the worker
  - No HTTP service (internal only, or with health check endpoint)
  - Smaller VM (256MB-512MB)
  - Worker connects to Supabase via `DATABASE_URL`
  - VERIFY: Worker starts and connects to Supabase

### 4C. Worker DB layer

- [ ] **Update `scripts/supplemental-worker.js`** to use postgres client
  - Same `lib/supabase-client.js` connection
  - All turso references removed
  - VERIFY: `grep -r "turso" scripts/supplemental-worker.js` returns 0
  - VERIFY: Worker processes a test document successfully

### 4D. PDF microservice (bundled in worker)

- [ ] **Verify Puppeteer PDF generation works from worker**
  - `lib/statement-generator.js`, `lib/ai-analyzer.js` use Puppeteer for PDF
  - These run in the worker context (has Chrome)
  - Web app calls worker via internal HTTP for PDF generation
  - VERIFY: Generate a test PDF via worker endpoint

---

### **--- GATE CHECK: Phase 4 ---**

- [ ] **Worker runs independently**
  - Worker starts on Fly.io, connects to Supabase, processes jobs
  - Cron jobs execute on schedule
  - PDF generation works
  - Dealum scrape still works (Selenium + Chrome available)

---

## Phase 5: SSE Migration

> **Goal:** Real-time features work on Vercel's serverless model.

### 5A. Categorize SSE endpoints

- [ ] **Audit all 17 SSE endpoints and categorize**

  **Keep as SSE (AI streaming, short-lived, <60s):**
  - Screening review draft streams
  - Diligence AI summary streams
  - Document processing progress
  - Annual fund candidate streams
  - Any endpoint that streams LLM output

  **Migrate to Supabase Realtime (long-lived sync):**
  - Application notes events
  - People notes events
  - Partners notes events
  - Stack rank results
  - Diligence section note events
  - Meeting/RSVP updates

  Document each endpoint's category and migration approach here: _____

### 5B. Supabase Realtime integration

- [ ] **Add Supabase JS client to frontend** (`src/lib/supabase-realtime.js`)
  - Subscribe to Postgres changes for relevant tables
  - Replace SSE `EventSource` connections with Supabase subscriptions for long-lived sync endpoints
  - VERIFY: Notes sync works in browser (add note → appears in other tab)
  - VERIFY: `npx playwright test e2e/real-time.spec.js` — all pass

### 5C. Streaming responses for AI endpoints

- [ ] **Verify Vercel streaming works for AI SSE endpoints**
  - Vercel supports `Transfer-Encoding: chunked` responses
  - Test each AI streaming endpoint on Vercel preview
  - VERIFY: AI draft generation streams tokens to browser on Vercel preview

---

### **--- GATE CHECK: Phase 5 ---**

- [ ] **Real-time features work on Vercel**
  - Notes sync, vote updates work via Supabase Realtime
  - AI streaming works within Vercel timeout
  - Run: `npx playwright test e2e/real-time.spec.js` — all pass

---

## Phase 6: Legacy Cleanup and Final Verification

> **Goal:** All old code removed. Clean codebase. All tests green.

### 6A. Remove dead dependencies

- [ ] **Remove from `package.json`:**
  - `@libsql/client`
  - `sqlite3`
  - `selenium-webdriver` (moved to worker package.json)
  - VERIFY: `npm install` succeeds without these
  - VERIFY: `npm test` still passes

### 6B. Delete dead files

- [ ] **Delete turso-specific files:**
  - `lib/turso-session-store.js`
  - `lib/turso-instrumentation.js`
  - Any `rowToObject` helper that was turso-specific (if replaced)
  - VERIFY: `grep -r "turso-session-store\|turso-instrumentation" lib/ routes/ index.js` returns 0

### 6C. Update documentation

- [ ] **Update `AGENTS.md`**
  - Replace all Turso references with Supabase/Postgres
  - Update DB schema rules (no more `AUTOINCREMENT`, `INSERT OR IGNORE`, etc.)
  - Update migration script instructions
  - Update `createTables()` documentation
  - VERIFY: `grep -i "turso" AGENTS.md` — only appears in historical context, not as instructions

- [ ] **Update `env.template`**
  - Remove `TURSO_URL`, `TURSO_AUTH_TOKEN`, and all `TURSO_*` vars
  - Add `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`
  - VERIFY: No turso env vars remain in template

- [ ] **Update `package.json`**
  - Update `keywords` — remove `turso`, add `supabase`, `vercel`
  - Update scripts as needed
  - VERIFY: `npm run build` works
  - VERIFY: `npm test` works

### 6D. Update `docs/database-schema.md`

- [ ] **Regenerate schema documentation from Supabase**
  - VERIFY: Schema docs match actual Supabase tables

---

### **--- GATE CHECK: Phase 6 (FINAL) ---**

- [ ] **Global turso/sqlite grep**
  - Run: `grep -ri "turso\|libsql\|sqlite" lib/ routes/ src/ index.js --include="*.js" --include="*.jsx" --include="*.mjs" | grep -v node_modules | grep -v MIGRATION.md | grep -v ".md"` — returns 0
- [ ] **All tests pass on Vercel preview + Supabase**
  - Run: `npm test` — all _____ Jest tests pass
  - Run: `npx playwright test` (against Vercel preview) — all _____ Playwright tests pass
- [ ] **Manual smoke test on Vercel preview**
  - [ ] Login works
  - [ ] Homepage loads with data
  - [ ] Application review loads, click into detail
  - [ ] Admin grid sorts and filters
  - [ ] File upload works
  - [ ] Notes real-time sync works (two tabs)
  - [ ] Annual fund dashboard loads
  - [ ] Public pages load without auth
- [ ] **No dead code remains**
  - Run: `grep -r "TODO\|HACK\|FIXME\|STUB" lib/ routes/ src/ --include="*.js" --include="*.jsx"` — review any results, none related to migration
- [ ] **Dependencies are clean**
  - Run: `npm ls --depth=0` — no missing or extraneous deps
  - `@libsql/client` and `sqlite3` not present

---

## Production Cutover Checklist

> **Only after ALL gate checks pass.**

- [ ] Set Supabase environment variables in Vercel dashboard
- [ ] Set worker environment variables in Fly.io (DATABASE_URL pointing to Supabase)
- [ ] Run `scripts/migrate-turso-to-supabase.js` against production Turso → production Supabase
- [ ] Run `scripts/verify-migration.js` against production — 0 mismatches
- [ ] Deploy worker to Fly.io — verify cron jobs start
- [ ] Deploy web app to Vercel production
- [ ] Verify production: login, homepage, application review, admin grid, file upload
- [ ] Update DNS if needed
- [ ] Monitor error logs for 24 hours
- [ ] Decommission old Fly.io web app (keep worker running)
- [ ] After 1 week with no issues: decommission Turso

---

## Appendix A: Files Touched by Migration

| Directory | Files | Primary Changes |
|-----------|-------|-----------------|
| `lib/cache-manager.js` | 1 | 868 turso.execute → postgres, schema DDL, boolean normalization |
| `lib/cache-manager/*.js` | 15 | 543 turso.execute → postgres across all domain modules |
| `lib/auth.js` | 1 | 59 turso.execute → postgres, INSERT OR IGNORE → ON CONFLICT |
| `lib/turso-session-store.js` | 1 | Deleted, replaced by pg-session-store |
| `lib/turso-instrumentation.js` | 1 | Deleted |
| `lib/supabase-client.js` | 1 | New file |
| `lib/pg-session-store.js` | 1 | New file |
| `index.js` | 1 | Client initialization, session store swap |
| `routes/*.js` | ~12 | multer disk→memory, 7 straggler turso calls, fs.write removal |
| `src/islands/*.jsx` | ~15-20 | Boolean read normalization (`=== 1` → `=== true`) |
| `src/lib/*.js` | ~5 | Any boolean or datetime helpers |
| `e2e/*.spec.js` | ~12 | New E2E test files |
| `scripts/` | ~4 | New migration/verification scripts |
| Config files | ~5 | `vercel.json`, `vite.config.mjs`, `package.json`, `env.template`, `AGENTS.md` |

## Appendix B: Environment Variable Changes

| Remove | Add |
|--------|-----|
| `USE_TURSO` | `SUPABASE_URL` |
| `TURSO_URL` | `SUPABASE_ANON_KEY` |
| `TURSO_AUTH_TOKEN` | `SUPABASE_SERVICE_ROLE_KEY` |
| `TURSO_CONNECTION_TIMEOUT_MS` | `DATABASE_URL` |
| `TURSO_METRICS_ENABLED` | |
| `TURSO_METRICS_FLUSH_SECONDS` | |
| `TURSO_METRICS_TOP_N` | |
| `TURSO_METRICS_SAMPLE_SLOW_MS` | |
| `TURSO_METRICS_TABLE_ID` | |
| `PROD_TURSO_URL` | `PROD_DATABASE_URL` |
| `PROD_TURSO_AUTH_TOKEN` | `PROD_SUPABASE_SERVICE_ROLE_KEY` |
