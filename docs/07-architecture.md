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
- Status: **proposed** (implementing + testing; DB choice not locked)
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
