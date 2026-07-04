# Architecture

Landing doc for tech/architecture decisions. Research and options are explored
in the connected claude.ai Project; **decisions get recorded here as ADRs** so
Claude Code and every future session pick them up.

## Decided so far

- React Native (Expo, expo-router, TypeScript).
- **On-device** app data: SQLite via Drizzle ORM (profile, programs, logs).
- **Backend** (accounts only): Cloudflare Workers + D1, one worker per service.
  First service is `auth-worker` (`backend/auth-worker/`). See
  [ADR-001](#adr-001--backend-for-accounts-cloudflare-workers--d1-auth-first).
  DB choice (D1) is a first pick under test, not locked.
- State: Zustand. Charts: react-native-svg. Glass: expo-blur.
- Steps/activity source: Android Health Connect (not the deprecated Google
  Fit API).
- Rule-based split generator (not ML).

> Scope note: the backend exists for **accounts** only. All fitness data
> (profile, programs, sessions, sets, measurements) still lives on-device.
> Whether/how to sync that data to the backend is an open question (#1 below),
> not a decided thing.

## Open questions to research

Each of these should end in an ADR below. (Good tasks for the research Project.)

1. **Onboarding → profile flow.** How the Zustand onboarding *draft* becomes a
   persisted `profile` row; where derived targets are computed and cached;
   first-run gating (show onboarding vs jump to home) via expo-router.
2. **Persistence & migrations.** Drizzle + expo-sqlite setup, migration
   strategy (drizzle-kit), and how schema changes ship to installed apps.
3. **Exercise dataset ingestion.** Bundle free-exercise-db at build time vs
   seed into SQLite on first launch; update strategy; licensing/attribution.
4. **Navigation structure.** expo-router layout: onboarding stack vs app tabs,
   the first-run gate, and where Logging/Summary sit (modal vs stack).
5. **Where the split generator runs.** Pure TS module invoked on
   onboarding-complete and on regenerate; determinism and testability.
6. **Calculation recompute triggers.** When BMI/BMR/TDEE/macros recompute
   (weight/goal/activity change) and how the cache on `profile` stays fresh.
7. **Health Connect integration.** Library choice (react-native-health-connect
   via config plugin + dev client), permission UX, sync cadence, and the
   Expo Go vs dev-client implication.
8. **Theming persistence.** Persist the light/dark choice (and "follow
   system") across launches.
9. **Backup / export.** Local export format for the user's data (JSON?),
   given no cloud sync yet.
10. **Testing strategy.** node:test for pure logic (already in use for
    health.ts); component/e2e approach if any.
11. **Play Store readiness.** Permissions, Data Safety form, privacy policy —
    heightened scrutiny for health data.

## ADR log

Architecture Decision Records — newest first. Copy the template per decision.

### Template
```
### ADR-NNN — <title>
- Date:
- Status: proposed | accepted | superseded
- Context: <the problem / forces>
- Decision: <what we chose>
- Consequences: <trade-offs, follow-ups>
- Alternatives considered: <options rejected and why>
```

### ADR-001 — Backend for accounts: Cloudflare Workers + D1 (auth first)
- Date: 2026-07-03
- Status: **accepted, DB choice superseded** — compute/session/password/flow
  decisions stand; the D1 pick is superseded by ADR-002 (Turso), switched
  2026-07-04 before first deploy.
- Context: The app was local-only (see 00-overview "Backend: None"). We now
  want real user accounts (email/password signup + login). This needs a
  server and a place to store credentials, which local-only can't provide.
- Decision:
  - **Compute:** Cloudflare Workers, **one worker per service**. First and
    only one today: `auth-worker` (`backend/auth-worker/`). More services get
    added as sibling workers under `backend/`.
  - **Database:** Cloudflare **D1** (SQLite) — native Worker binding, no extra
    vendor, free tier, and the same Drizzle+SQLite model the mobile app
    already uses. **This is a first pick we're testing, not final** — if it
    doesn't hold up we swap it and supersede this ADR.
  - **Sessions:** opaque random bearer token stored in a `sessions` table,
    kept in `expo-secure-store` on device. Revocable by deleting the row
    (vs a stateless JWT). 30-day expiry.
  - **Passwords:** PBKDF2-SHA256 via the Workers Web Crypto API (bcrypt/argon2
    need native bindings Workers doesn't have), per-user salt, 100k iterations.
  - **Flow placement:** account step sits **after** core onboarding
    ("Plan ready") so the whole intake works offline first; returning users
    log in from the Welcome screen.
- Consequences: introduces a backend and network dependency for auth; app can
  no longer be purely offline for first-run account creation. Syncing the
  local `UserProfile` to the backend is **out of scope here** — still open
  question #1 below.
- Alternatives considered: stateless JWT (rejected — can't revoke before
  expiry without a blocklist); Supabase/Firebase (rejected — extra vendor, the
  user chose Cloudflare Workers); Turso/other SQLite hosts (deferred — D1 is
  the zero-extra-vendor option to test first).
### ADR-002 — Backend data model & DB for whole-app sync (auth + daily activity + workout aggregates)
- Date: 2026-07-04
- Status: **accepted** (2026-07-04 — user confirmed Turso over D1; auth-worker
  migrated the same day, before first deploy. The sync/rollup tables described
  below are not built yet — they land with the daily-sync feature.)
- Context:
  ADR-001 scoped the Cloudflare backend to accounts only, with all fitness data
  on-device (SQLite/Drizzle) and sync marked as deferred/open. That's now
  changing: daily activity (steps, calories, logged workout sets) needs to
  reach a shared backend too, for durability and future multi-device
  continuity — not because on-device app features (today's workout, "last
  time" ghost text, live progression logic) need it; those keep running
  against the on-device DB exactly as documented.
  Modeled against realistic growth (1 to 100,000 users), storing every raw
  LoggedSet row indefinitely would hit D1's hard 10GB-per-database ceiling in
  ~1 month at 100k users and cost $85-140/mo in storage+writes alone. Bundling
  the daily sync into one write/user/day plus pruning raw data after a short
  grace window removes both problems, at the cost of making three specific
  workout metrics (PRs, last-performance, weekly volume/adherence) into
  maintained running aggregates instead of pure compute-on-read values —
  a deliberate, scoped exception to the compute-on-read principle, which
  otherwise still stands unchanged for BMR/TDEE/calorie/macro targets.
- Decision:
  - **Sync mechanism:** on-device cron buffers the day's ActivitySnapshot
    (steps, active_minutes) and all of that day's LoggedSet rows locally.
    At local midnight, bundle them into one JSON payload and upload as a
    single write to a new `DailyActivityUpload` table (one row per user per
    day). Trigger uses per-device local time (not a synchronized server
    time) so uploads land spread across 24 hours; add a small random jitter
    on top regardless, since D1/Turso both still serialize writes per
    database and a synchronized burst would queue.
  - **Server-side rollup:** a scheduled Worker (Cron Trigger) processes each
    day's `DailyActivityUpload` rows and updates three small, persistent
    aggregate tables, each keyed per user (per-exercise or per-week, never
    per-set):
    - `ExercisePR` (per user + exercise): running best weight/reps — updated
      by simple comparison against each new set, never recomputed from full
      history.
    - `LastPerformance` (per user + exercise): most recent weight/reps/RPE
      and consecutive-failure count — feeds "last time" ghost text and the
      double-progression rules in `02-split-generator-logic.md`.
    - `WeeklyVolume` / `WeeklyAdherence` (per user + week): the weekly
      muscle-group volume and adherence % — inherently time-windowed, so
      nothing is lost when the underlying raw rows are pruned afterward.
  - **Pruning:** `DailyActivityUpload` rows older than **14 days** are
    deleted after rollup. 14 days is a corrections grace period — a user can
    fix a data-entry mistake from the last two weeks and have it reflected in
    the aggregates; older corrections aren't recoverable. This number is a
    parameter, not a principle — adjust if 14 days is wrong in practice.
  - **Database:** Turso, not D1. Same SQLite dialect as D1 (near-zero
    migration effort from the current Drizzle setup), and at this volume
    profile (bounded to single-digit GB, low millions of rows/month) both
    are free — Turso's monthly-reset caps (500M reads/mo, 10M writes/mo) are
    a better fit for a once-daily-batch pattern than D1's tighter daily
    reset, and it's a small hedge against Cloudflare-only lock-in at zero
    added cost. Since `auth-worker` isn't deployed to production yet, this
    is the cheapest point this switch will ever be. If preferred, staying
    on D1 costs nothing extra either — the model shows both hold up fine to
    well past 100,000 users under this design.
- Consequences:
  - Storage stays bounded (~4.5GB raw buffer + <3GB aggregates at 100,000
    users) instead of growing forever — no sharding needed at any realistic
    scale.
  - Write cost stays near-zero (1 write/user/day) instead of the $78+/mo at
    100,000 users a fully-normalized daily batch would cost.
  - `ExercisePR`, `LastPerformance`, `WeeklyVolume`, `WeeklyAdherence` become
    genuinely cached/maintained fields — an explicit, scoped exception to
    compute-on-read, limited to these four workout aggregates only. BMR,
    TDEE, calorie target, and macros are NOT part of this exception and stay
    compute-on-read as originally decided (see the drift already flagged in
    `01-data-model.md`, which needs separate correcting).
  - Corrections to a workout older than 14 days can never retroactively fix
    a PR/volume/adherence number again — accepted trade-off, not a bug.
  - Needs new entities in `01-data-model.md`: `DailyActivityUpload`,
    `ExercisePR`, `LastPerformance`, `WeeklyVolume`, `WeeklyAdherence` —
    plus resolving the height/cached-target drift already on file.
  - `00-overview.md`'s "multi-device sync deferred" open question is now
    partially answered (activity/workout data syncs; full `UserProfile` sync
    is still separate and still open).
- Alternatives considered:
  - Keep every `LoggedSet` row forever, normalized, on the backend —
    rejected: hits D1's hard per-database ceiling in ~1 month at 100k users,
    and costs real money on every provider once storage stops being trivial.
  - Batch upload once/day but keep sets as individual normalized rows
    (still queryable server-side) — rejected for now: costs $78+/mo at
    100,000 users purely in write billing on D1, for query capability
    nothing in the current app actually needs server-side (on-device DB
    already serves every live feature). Revisit if a web dashboard or
    cross-user analytics feature is ever built.
  - Neon or Supabase (Postgres) — the earlier storage-growth numbers made a
    real case for these; pruning removes that case. Native write concurrency
    and no per-database ceiling remain genuine Postgres advantages, but
    aren't decisive at a bounded, single-digit-GB footprint. Worth
    reconsidering only if retention policy changes back toward "keep
    everything forever."
  - Immediate pruning (no grace window) — rejected in favor of 14 days;
    storage cost difference is negligible, correctness value is not.