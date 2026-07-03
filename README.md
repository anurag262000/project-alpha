# Project Alpha

A mobile fitness app that bridges passive activity tracking (steps, Health
Connect) with planned, adaptive resistance-training programs and workout
logging — the gap between apps like Google Fit and single-purpose workout
loggers.

Personal-use first, structured to be Play-Store-ready later.
Stack: React Native (Expo); app data on-device (SQLite + Drizzle); a Cloudflare
Workers backend for **accounts only** (`backend/auth-worker/`). The `mobile/`
app is a UI prototype with **auth** wired to the backend; the rest of the data
layer is not wired yet.

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
│   └── auth-worker/         email/password auth (Hono + Drizzle + D1)
└── mobile/              the React Native (Expo) app
    ├── app/                 expo-router screens (onboarding + auth built)
    └── src/                 theme, ui kit, api client, auth store, schema
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
| Run the RN app (UI prototype) | [mobile/README.md](mobile/README.md) |

## Running the prototype

The finalized UI lives as a self-contained, offline HTML prototype covering
the full screen set (onboarding + app) with a light/dark toggle.

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
