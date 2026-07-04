# Project Alpha

A mobile fitness app that bridges passive activity tracking (steps, Health
Connect) with planned, adaptive resistance-training programs and workout
logging — the gap between apps like Google Fit and single-purpose workout
loggers.

Personal-use first, structured to be Play-Store-ready later.
Stack: React Native (Expo); app data on-device (SQLite + Drizzle); a Cloudflare
Workers backend for **accounts only** (`backend/auth-worker/`, DB on **Turso**
— see ADR-002). The `mobile/` app is a working prototype: auth, onboarding →
profile persistence, and workout logging run against real databases; program
generation and home/progress screens are still mock UI.

## Repository map

```
project-alpha/
├── README.md            ← you are here — the index
├── CLAUDE.md            shared agent brief (auto-loaded by Claude Code)
├── docs/                planning, specs & learning notes (the "what" and "why")
│   ├── 00-overview.md       vision, pillars, tech-stack decisions, roadmap
│   ├── 01-data-model.md     entities & relationships (on-device + backend)
│   ├── 02-split-generator-logic.md   rule-based program generation
│   ├── 03-onboarding-flow.md         onboarding screens, step by step
│   ├── 04-home-logging-ux.md         home screen + scroll-dial logging
│   ├── 06-health-calculations.md     BMI/BMR/TDEE, macros, PAR-Q, injury map
│   ├── 07-architecture.md            tech decisions + ADR log
│   ├── research-brief.md             charter for the claude.ai research Project
│   ├── flow-diagrams/                one Mermaid diagram per finalized feature
│   └── learning/                     teaching notes (e.g. Cloudflare/Wrangler)
├── design/              how it looks & feels (canonical — base for all UI)
│   ├── design-system.md     canonical visual language (light glass, tokens)
│   ├── design-log.md        dated design decisions + reasoning
│   └── prototype/           runnable clickable HTML prototype (light + dark)
├── features/            what it does, over time
│   └── feature-log.md       per-feature requirements, mutations, and bugs
├── backend/             Cloudflare Workers — one dir per service
│   └── auth-worker/         email/password auth (Hono + Drizzle + Turso)
└── mobile/              the React Native (Expo) app
    ├── app/                 expo-router screens (onboarding, auth, logging wired)
    ├── drizzle/             generated .sql migrations (applied on app launch)
    └── src/                 theme, ui kit, api client, stores, db (schema/repos/seed)
```

## Where to look for… (grouped by topic)

**Product & concept**
| I want to… | Go to |
|---|---|
| Understand the product vision & stack | [docs/00-overview.md](docs/00-overview.md) |
| See the data model (on-device + backend) | [docs/01-data-model.md](docs/01-data-model.md) |

**Onboarding & fitness logic**
| I want to… | Go to |
|---|---|
| Read the onboarding flow, step by step | [docs/03-onboarding-flow.md](docs/03-onboarding-flow.md) |
| Understand the health/nutrition math | [docs/06-health-calculations.md](docs/06-health-calculations.md) |
| Understand how programs are generated | [docs/02-split-generator-logic.md](docs/02-split-generator-logic.md) |
| Read home / scroll-dial logging UX | [docs/04-home-logging-ux.md](docs/04-home-logging-ux.md) |

**Architecture & backend**
| I want to… | Go to |
|---|---|
| See/record architecture decisions (ADRs) | [docs/07-architecture.md](docs/07-architecture.md) |
| Learn Cloudflare/Wrangler, then deploy | [docs/learning/](docs/learning/) |
| See feature flows (e.g. auth) | [docs/flow-diagrams/](docs/flow-diagrams/) |
| Run/deploy the auth worker | [backend/README.md](backend/README.md) |

**Design & UI**
| I want to… | Go to |
|---|---|
| Know the colors, tokens, components | [design/design-system.md](design/design-system.md) |
| Understand *why* the design looks this way | [design/design-log.md](design/design-log.md) |
| Click through the UI | [design/prototype/](design/prototype/) (see below) |

**Features & app**
| I want to… | Go to |
|---|---|
| Track features, requirement changes, bugs | [features/feature-log.md](features/feature-log.md) |
| Run the app, backend & DB studio | [Running the app](#running-the-app-development) below |
| Mobile-specific details | [mobile/README.md](mobile/README.md) |

## Running the app (development)

Three processes: a local database, the auth worker, and the Expo app. Run
each in its own terminal, in this order. (Concepts and troubleshooting live
in [docs/learning/](docs/learning/) — guides 02 and 03.)

### 1. Backend — local DB + worker

```bash
# Terminal A — local libsql server (no account/token needed; data in authdev.db)
turso dev --db-file authdev.db --port 8880

# Terminal B — apply schema (first run / after schema changes), then the worker
cd backend/auth-worker
TURSO_DATABASE_URL=http://127.0.0.1:8880 npx drizzle-kit migrate
npx wrangler dev --port 8787
```

`backend/auth-worker/.dev.vars` (gitignored) points `wrangler dev` at the
local DB. Quick smoke test:
`curl -s -X POST http://localhost:8787/signup -H 'content-type: application/json' -d '{"email":"a@b.co","password":"password123"}'`

To run against the **hosted** Turso DB / deploy to Cloudflare instead, see
[docs/learning/02-turso-libsql-migration.md](docs/learning/02-turso-libsql-migration.md) §6–7
(credentials go in `backend/.env`, gitignored).

### 2. Mobile app

```bash
# Terminal C
cd mobile
EXPO_PUBLIC_API_URL=http://localhost:8787 npx expo start
```

Then press `a` for the Android emulator (Expo Go), or scan the QR on a
device. If the emulator can't reach Metro or the worker, forward the ports:

```bash
adb reverse tcp:8081 tcp:8081   # Metro (use your --port if you changed it)
adb reverse tcp:8787 tcp:8787   # auth worker
```

The on-device SQLite DB migrates itself on launch (drizzle `useMigrations`)
and seeds the exercise library if empty. If launch fails with
`table ... already exists`, the device has a DB from an older migration
history — wipe Expo Go's data: `adb shell pm clear host.exp.exponent`.

### 3. Inspecting the databases (Drizzle Studio)

**Backend DB** — from `backend/auth-worker/`:

```bash
npx drizzle-kit studio    # opens https://local.drizzle.studio
```

It connects to whatever `backend/.env` points at — set
`TURSO_DATABASE_URL=http://127.0.0.1:8880` (empty token) for the local dev
DB, or the hosted `libsql://…` URL + token for production. **Check before
you browse.**

**Mobile on-device DB** — the app embeds
[`expo-drizzle-studio-plugin`](https://github.com/drizzle-team/expo-drizzle-studio-plugin):
with the app running via `npx expo start`, press **`shift+m`** in the Expo
terminal and pick *expo-drizzle-studio-plugin* — Drizzle Studio opens in the
browser against the live database on the device/emulator. Dev-only; no-op in
production builds.

## Running the HTML prototype

The finalized UI also lives as a self-contained, offline HTML prototype
covering the full screen set (onboarding + app) with a light/dark toggle.

```
node design/prototype/server.js
```

Then open http://localhost:4173 — or just open
[design/prototype/index.html](design/prototype/index.html) directly in a
browser.

## Conventions

- **Design decisions** are logged (dated, newest first) in
  [design/design-log.md](design/design-log.md).
- **Feature requirements** never get overwritten — changes are appended as
  dated *mutations* in [features/feature-log.md](features/feature-log.md), with
  bugs tracked in the same file.
