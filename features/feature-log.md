# Feature Log

One entry per feature: current requirement, how it mutated, and its bugs.
Status legend: `planned` · `prototyped` · `in-dev` · `shipped`.

---

## F1 — Onboarding & profile
**Status:** prototyped
**Spec:** [../docs/03-onboarding-flow.md](../docs/03-onboarding-flow.md)

**Current requirement:** Multi-step onboarding capturing sex, DOB, height,
weight (with estimated/measured accuracy flag), goal, experience level,
training days + session length, equipment access, and optional
injuries/limitations. Ends by generating a program. All feeds the profile the
algorithm and progress charts read from.

**Mutations:**
- 2026-07-02 — Established as 8-ish steps; weight carries an
  estimated-vs-measured toggle (user's explicit ask) so early data can be
  weighted appropriately.

**Bugs:** none yet.

---

## F2 — Exercise library
**Status:** prototyped
**Spec:** [../docs/01-data-model.md](../docs/01-data-model.md) (Exercise entity)

**Current requirement:** Browse/search 800+ exercises, filter by muscle group
and equipment. Seeded from an open dataset (free-exercise-db to start).

**Mutations:**
- 2026-07-02 — Decided to seed from an existing open, licensable dataset rather
  than hand-authoring; free-exercise-db first, wger as fallback if coverage is
  short.

**Bugs:** none yet.

---

## F3 — Program generator (split)
**Status:** planned
**Spec:** [../docs/02-split-generator-logic.md](../docs/02-split-generator-logic.md)

**Current requirement:** Rule-based (not ML) generator that maps goal +
days/week + experience + equipment + session length to a split template,
assigns exercises and weekly volume using training-science landmarks
(MEV/MAV), and progresses via double-progression with deload triggers and
adherence-aware adjustments.

**Mutations:**
- 2026-07-02 — Chose rule-based over ML: auditable, needs no training data,
  and avoids suggesting unrealistic goals (user's explicit concern).

**Bugs:** none yet.

---

## F4 — Home + activity tracking
**Status:** prototyped
**Spec:** [../docs/04-home-logging-ux.md](../docs/04-home-logging-ux.md)

**Current requirement:** Home shows today's ordered workout, streak, and an
activity ring (steps + active minutes). Steps/activity come from Android
Health Connect.

**Mutations:**
- 2026-07-02 — Source is Health Connect, not the deprecated Google Fit API.
  Dual ring: green = steps (passive), red = active minutes — surfaces the two
  data worlds the app bridges.

**Bugs:** none yet.

---

## F5 — Workout logging (scroll-dial)
**Status:** prototyped
**Spec:** [../docs/04-home-logging-ux.md](../docs/04-home-logging-ux.md)

**Current requirement:** Per-set logging via three scroll wheels (weight /
reps / RPE), no keyboard. Shows last-time reference, rest timer, set-progress
dots, exercise substitution, and a completion summary with PRs.

**Mutations:**
- 2026-07-02 — Scroll-dial confirmed as the core interaction; wheels default to
  last logged values so repeat sets need zero scrolling.

**Bugs:** none yet.

---

## F6 — Progress & analytics
**Status:** prototyped
**Spec:** [../docs/01-data-model.md](../docs/01-data-model.md) (derived metrics)

**Current requirement:** Bodyweight trend, estimated 1RM/PRs, adherence %, and
weekly volume per muscle group — all computed on read from logged data.

**Mutations:**
- 2026-07-02 — Metrics computed on read for MVP; materialize into a snapshot
  table only if query performance requires it.

**Bugs:** none yet.

---

## F7 — Design system & theming
**Status:** prototyped
**Spec:** [../design/design-system.md](../design/design-system.md) ·
[../design/prototype/](../design/prototype/)

**Current requirement:** Light liquid-glass visual system with a light/dark
toggle. Ink neutral emphasis (inverts in dark), red/green as data signal only.

**Mutations:**
- 2026-07-02 — Direction went dark charcoal → light → light liquid glass;
  then dark mode re-added as a second theme. See
  [../design/design-log.md](../design/design-log.md).

**Bugs:** none yet.

---

## Global bug log

| # | Date | Area | Description | Status | Fix |
|---|------|------|-------------|--------|-----|
| B1 | 2026-07-02 | prototype / dev-env | Preview server failed: sandbox blocks python `http.server`, and `npx serve` needs a network fetch. | fixed | Replaced with zero-dependency Node static server (`design/prototype/server.js`). |
