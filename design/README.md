# Design

Everything about how project-alpha looks and feels — the design conversations,
the finalized design system, and the runnable prototype.

## Contents

- [design-system.md](design-system.md) — the canonical visual language:
  light liquid-glass theme, ink emphasis, red/green signal colors, tokens,
  type scale, component patterns, and dark-mode notes.
- [design-log.md](design-log.md) — chronological record of design decisions
  and the reasoning behind them (theme direction changes, material choices,
  what was tried and rejected). Read this to understand *why* the design is
  the way it is.
- [prototype/](prototype/) — self-contained clickable HTML prototype of the
  full screen set, with a light/dark toggle. This is the finalized visual
  reference for building the app.

## Running the prototype

From the repo root:

```
node design/prototype/server.js
```

Then open http://localhost:4173. Or just open
`design/prototype/index.html` directly in a browser (works offline).

The prototype covers, with working navigation:

- **Onboarding** — welcome, basics, goal, experience, schedule, equipment,
  plan-ready.
- **App** — home, program, library, logging (scroll-dial), summary,
  progress, profile.

Toggle light/dark with the button top-right, or in-app via Profile →
Appearance.

## How we use this folder

- When a design decision is made or changed, add a dated entry to
  `design-log.md` (newest at top) with the reasoning.
- When the finalized look changes, update `design-system.md` and the
  prototype together, and note it in the log.
