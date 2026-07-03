# Project Alpha — agent brief

Read this first. It's the shared context for any Claude session (Claude Code
*or* a connected claude.ai Project). Keep it short; details live in the docs
it points to.

## What this is

A mobile fitness app that bridges passive activity tracking (steps / Health
Connect) with planned, adaptive resistance-training programs and workout
logging — the gap between Google Fit and single-purpose workout loggers.
Personal-use first, structured to be Play-Store-ready later.

- **Stack:** React Native (Expo, expo-router, TypeScript), local-only
  (SQLite + Drizzle). State: Zustand. No backend yet.
- **Status:** planning + design + a UI prototype are done. The RN app in
  `mobile/` is **UI-only** — data/calc/DB are intentionally not wired yet
  (architecture is being decided).

## Where things live (source of truth = this repo)

- `README.md` — repository map / index.
- `docs/` — specs: 00 overview, 01 data-model, 02 split-generator, 03
  onboarding, 04 home-logging, 06 health-calculations, 07 architecture.
- `design/` — design-system.md, design-log.md, and the HTML prototype.
- `features/feature-log.md` — per-feature requirements, mutations, and bugs.
- `mobile/` — the Expo app (UI prototype).

## Conventions (please follow)

- **Design decisions** → dated entry in `design/design-log.md` (newest first).
- **Feature/requirement changes** → append a dated *mutation* in
  `features/feature-log.md`; never overwrite. Bugs go in the same file.
- **Architecture decisions** → record as an ADR entry in
  `docs/07-architecture.md`.
- **Design language:** light liquid glass (canonical) + dark mode. Ink =
  neutral emphasis (inverts in dark); red = drive/intensity, green =
  progress/done — used only as data signal. Details in
  `design/design-system.md`.
- Commit messages end with the Co-Authored-By trailer already in use.

## Working rhythm across surfaces

Research/planning may happen in a connected claude.ai Project; implementation
happens in Claude Code. Whatever is decided anywhere must be captured back
into the repo (docs / feature-log / ADR) so every surface stays in sync.
