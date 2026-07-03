# Feature Log

One entry per feature: current requirement, how it mutated, and its bugs.
Status legend: `planned` · `prototyped` · `in-dev` · `shipped`.

---

## F1 — Onboarding & profile
**Status:** planned (spec complete)
**Spec:** [../docs/03-onboarding-flow.md](../docs/03-onboarding-flow.md) ·
[../docs/06-health-calculations.md](../docs/06-health-calculations.md)

**Current requirement:** Core-first onboarding that captures the "coach's
checklist": sex, DOB, height, weight (estimated/measured flag, live auto-BMI),
goal, experience, lifestyle activity (NEAT), weekly availability (specific
days + preferred time-of-day + session length), equipment, PAR-Q+ readiness
screen, and injuries. On completion it generates the split, computes
BMI/BMR/TDEE + calorie & macro targets, and seeds progress baselines.
Remaining data (detailed measurements, meds/conditions detail, dietary
preferences, target weight, calorie check-in) is gathered progressively from
Profile → "Complete your profile".

**Mutations:**
- 2026-07-02 — Established as ~8 steps; weight carries estimated/measured
  toggle so early data can be weighted appropriately.
- 2026-07-02 — Expanded to full coach-grade intake: added lifestyle activity
  level, preferred training time-of-day, PAR-Q+ readiness screen, auto-BMI,
  and derived nutrition targets. Adopted **core-first + progressive** strategy
  to limit sign-up drop-off. Injuries now **actively modify** the generated
  split (exclusion map in [06 §7](../docs/06-health-calculations.md#7-injury--movement-exclusion-map));
  medical/meds stored + safety disclaimer. Reason: onboarding is the base of
  the whole app — the plan and targets are only as good as this intake.

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

## F8 — Nutrition: targets + calorie check-in
**Status:** planned
**Spec:** [../docs/06-health-calculations.md](../docs/06-health-calculations.md)

**Current requirement:** Derive and display BMI, BMR, TDEE, and daily calorie
+ macro targets from the profile (formulas per doc 06), recomputed on
weight/activity/goal change. Provide a lightweight daily **calorie check-in**
(single calories-eaten number, optional protein) charted vs target with
adherence %.

**Mutations:**
- 2026-07-02 — Created. Reverses the earlier "nutrition out of scope" stance.
  Scope decision: **phase 1 = targets + calorie check-in**; a full itemized
  food log is a **future update** (goal state). `CalorieCheckin` is modeled so
  the future food log rolls up into the same daily row without a schema
  rewrite.

**Bugs:** none yet.

---

## F9 — Auth (signup / login)
**Status:** prototyped
**Spec:** [../docs/07-architecture.md#adr-001](../docs/07-architecture.md) ·
[../docs/flow-diagrams/auth.md](../docs/flow-diagrams/auth.md)

**Current requirement:** Email/password signup and login backed by a
Cloudflare Worker (`backend/auth-worker/`) over D1. Signup step sits at the end
of onboarding (after "Plan ready"); returning users log in from Welcome.
Opaque bearer-token session stored in `expo-secure-store`, restored on launch.

**Mutations:**
- 2026-07-03 — Created. Reverses the earlier local-only stance (00-overview
  "Backend: None"). Reason: real accounts are wanted now. Scope is **auth
  only** — creating an account + session. Syncing the local `UserProfile` to
  the backend is deliberately **out of scope** (still open question #1 in the
  architecture doc). DB is D1 as a first pick under test, not locked.

**Bugs:** none yet.

---

## Global bug log

| # | Date | Area | Description | Status | Fix |
|---|------|------|-------------|--------|-----|
| B1 | 2026-07-02 | prototype / dev-env | Preview server failed: sandbox blocks python `http.server`, and `npx serve` needs a network fetch. | fixed | Replaced with zero-dependency Node static server (`design/prototype/server.js`). |
