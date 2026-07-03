# Project Alpha — agent brief

Read this first. It's the shared context for any Claude session (Claude Code
*or* a connected claude.ai Project). Keep it short; details live in the docs
it points to.

## What this is

A mobile fitness app that bridges passive activity tracking (steps / Health
Connect) with planned, adaptive resistance-training programs and workout
logging — the gap between Google Fit and single-purpose workout loggers.
Personal-use first, structured to be Play-Store-ready later.

- **Stack:** React Native (Expo, expo-router, TypeScript). App data on-device
  (SQLite + Drizzle), state via Zustand. Backend: Cloudflare Workers + D1 for
  **accounts only** (`backend/auth-worker/`) — see ADR-001.
- **Status:** planning + design + UI prototype done. The RN app in `mobile/`
  is mostly **UI-only** (data/calc/DB not wired yet), except **auth**, which is
  wired to the Cloudflare worker (signup/login/session). Backend is built +
  tested locally, not yet deployed.

## Where things live (source of truth = this repo)

- `README.md` — repository map / index.
- `docs/` — specs: 00 overview, 01 data-model, 02 split-generator, 03
  onboarding, 04 home-logging, 06 health-calculations, 07 architecture.
- `design/` — design-system.md, design-log.md, and the HTML prototype.
- `features/feature-log.md` — per-feature requirements, mutations, and bugs.
- `docs/flow-diagrams/` — one Mermaid diagram per *finalized* feature.
- `docs/learning/` — teaching notes we record while learning a tool/process
  (e.g. Cloudflare Workers deploy), for future reference.
- `mobile/` — the Expo app (UI prototype).
- `backend/` — Cloudflare Workers, one directory per service (`auth-worker/`).

## Conventions (please follow)

- **Design decisions** → dated entry in `design/design-log.md` (newest first).
- **Feature/requirement changes** → append a dated *mutation* in
  `features/feature-log.md`; never overwrite. Bugs go in the same file.
- **Architecture decisions** → record as an ADR entry in
  `docs/07-architecture.md`.
- **Flow changes** → once a feature is finalized, keep a Mermaid diagram in
  `docs/flow-diagrams/` and update it whenever the flow changes.
- **Design language:** light liquid glass (canonical) + dark mode. Ink =
  neutral emphasis (inverts in dark); red = drive/intensity, green =
  progress/done — used only as data signal. Details in
  `design/design-system.md`.
- Commit messages end with the Co-Authored-By trailer already in use.

## Working rhythm across surfaces

Research/planning may happen in a connected claude.ai Project; implementation
happens in Claude Code. Whatever is decided anywhere must be captured back
into the repo (docs / feature-log / ADR) so every surface stays in sync.
