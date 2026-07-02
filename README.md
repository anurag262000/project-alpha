# Project Alpha

A mobile fitness app that bridges passive activity tracking (steps, Health
Connect) with planned, adaptive resistance-training programs and workout
logging — the gap between apps like Google Fit and single-purpose workout
loggers.

Personal-use first, structured to be Play-Store-ready later.

## Planning docs

- [docs/00-overview.md](docs/00-overview.md) — vision, pillars, tech stack, roadmap
- [docs/01-data-model.md](docs/01-data-model.md) — entities and relationships
- [docs/02-split-generator-logic.md](docs/02-split-generator-logic.md) — rule-based program generation
- [docs/03-onboarding-flow.md](docs/03-onboarding-flow.md) — onboarding screens
- [docs/04-home-logging-ux.md](docs/04-home-logging-ux.md) — home screen and workout logging UX
- [docs/05-design-system.md](docs/05-design-system.md) — visual language: charcoal + liquid glass, red/green signal colors, tokens, components

## Prototype

- [prototype/index.html](prototype/index.html) — self-contained clickable UI
  prototype covering the full screen set in the liquid-glass style, with a
  **light / dark** toggle. Onboarding (welcome, basics, goal, experience,
  schedule, equipment, plan-ready) and the app (home, program, library,
  logging, summary, progress, profile). Open the file directly in a browser,
  or run `node prototype/server.js` and visit http://localhost:4173.

No app code yet — this repo currently holds the planning/design phase.
