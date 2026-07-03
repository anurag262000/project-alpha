# Project Alpha

A mobile fitness app that bridges passive activity tracking (steps, Health
Connect) with planned, adaptive resistance-training programs and workout
logging — the gap between apps like Google Fit and single-purpose workout
loggers.

Personal-use first, structured to be Play-Store-ready later.
Stack: React Native (Expo), local-only (SQLite). No app code yet — this repo
currently holds the planning, design, and prototype phase.

## Repository map

```
project-alpha/
├── README.md            ← you are here — the index
├── docs/                planning & specs (the "what" and "why")
│   ├── 00-overview.md       vision, pillars, tech-stack decisions, roadmap
│   ├── 01-data-model.md     entities & relationships
│   ├── 02-split-generator-logic.md   rule-based program generation
│   ├── 03-onboarding-flow.md         onboarding screens, step by step
│   ├── 04-home-logging-ux.md         home screen + scroll-dial logging
│   └── 06-health-calculations.md     BMI/BMR/TDEE, macros, PAR-Q, injury map
├── design/              how it looks & feels
│   ├── design-system.md     canonical visual language (light glass, tokens)
│   ├── design-log.md        dated design decisions + reasoning
│   └── prototype/           runnable clickable HTML prototype (light + dark)
├── features/            what it does, over time
│   └── feature-log.md       per-feature requirements, mutations, and bugs
└── mobile/              the React Native (Expo) app — UI prototype so far
    ├── app/                 expo-router screens (onboarding built)
    └── src/                 theme, ui kit, calc (parked), schema (parked)
```

## Where to look for…

| I want to… | Go to |
|---|---|
| Understand the product vision & stack | [docs/00-overview.md](docs/00-overview.md) |
| See the data model | [docs/01-data-model.md](docs/01-data-model.md) |
| Understand how programs are generated | [docs/02-split-generator-logic.md](docs/02-split-generator-logic.md) |
| Read onboarding / logging UX specs | [docs/03-onboarding-flow.md](docs/03-onboarding-flow.md), [docs/04-home-logging-ux.md](docs/04-home-logging-ux.md) |
| Understand the health/nutrition math | [docs/06-health-calculations.md](docs/06-health-calculations.md) |
| Know the colors, tokens, components | [design/design-system.md](design/design-system.md) |
| Understand *why* the design looks this way | [design/design-log.md](design/design-log.md) |
| Click through the UI | [design/prototype/](design/prototype/) (see below) |
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
