# Project Alpha — Fitness & Training App

## The gap this fills

Google Fit (and phone/wearable OEM apps) track *passive* activity — steps, heart
rate, calories burned. Fitness bands surface their own siloed metrics. Neither
plans or tracks *structured resistance training* — what split you're on, what
you lifted today, whether you're progressing. Apps that do log workouts
(Strong, Hevy) don't plan the split for you or connect it to your passive
activity data. This app is the bridge: one place that plans a program from
your actual constraints, tracks what you did, and shows both passive and
active data against your goal.

## Core pillars

1. **Passive tracking** — steps/activity via Android Health Connect (the
   successor to the Google Fit API).
2. **Active tracking** — sets/reps/weight actually logged, which no passive
   tracker captures.
3. **Planning** — a split generated from goal, days/week, session length, and
   equipment access, not chosen from a generic template list.
4. **Feedback loop** — profile + logs → charts that show whether the plan is
   working, and progression rules that adjust the next session.

## Tech stack decisions

| Decision | Choice | Why | Alternatives considered |
|---|---|---|---|
| Framework | React Native (Expo) | User's preferred stack; Expo's config-plugin system still allows native modules (e.g. Health Connect) without going bare, and gives fast iteration + EAS builds for Play Store. | Flutter (better default charting/animation, but user prefers RN), native Kotlin (best Health Connect access, single-platform only, more code) |
| Local data | SQLite via Drizzle ORM | Typed schema + migrations, good fit for relational workout data (profile → program → sessions → sets), fully on-device. | WatermelonDB (better for reactive sync, overkill with no backend), raw expo-sqlite (no type safety) |
| Backend | Cloudflare Workers + D1 (auth only) | Real accounts now wanted; one worker per service, starting with `auth-worker`. Reverses the earlier local-only stance — see [ADR-001](07-architecture.md#adr-001--backend-for-accounts-cloudflare-workers--d1-auth-first). DB choice still being tested. | Local-only (superseded); Firebase/Supabase (extra vendor) |
| Steps/activity source | Android Health Connect | Google Fit's tracking APIs are being folded into Health Connect; building on the old API is a dead end. | Direct Google Fit REST API (deprecated path) |
| Navigation | React Navigation | Standard, well-supported in Expo. | — |
| State | Zustand | Minimal boilerplate for a single-user local app. | Redux Toolkit (more ceremony than needed here) |
| Charts | react-native-gifted-charts | Covers line/bar charts needed for weight trend, volume, adherence. | Victory Native |
| Exercise library seed | Open dataset (see [01-data-model.md](01-data-model.md)) | Don't hand-author hundreds of exercises; seed from an existing open, licensable dataset and curate. | Hand-curated from scratch (slow, error-prone) |

## Staged roadmap

- **Stage 1 — Onboarding & Profile**: capture the inputs the algorithm needs.
- **Stage 2 — Exercise Library**: seeded, filterable by muscle group/equipment.
- **Stage 3 — Program Generator**: rule-based split + exercise + volume
  assignment (see [02-split-generator-logic.md](02-split-generator-logic.md)).
- **Stage 4 — Home Screen & Logging**: today's workout, scroll-dial input
  (see [04-home-logging-ux.md](04-home-logging-ux.md)).
- **Stage 5 — Progress & Analytics**: steps/points, weight trend, volume per
  muscle group, PR tracking, adherence.
- **Stage 6 — Integrations & Play Store readiness**: Health Connect wiring,
  privacy policy, Play Data Safety form.

Accounts (email/password signup + login) are handled by a Cloudflare Workers
backend — see [07-architecture.md ADR-001](07-architecture.md#adr-001--backend-for-accounts-cloudflare-workers--d1-auth-first)
and feature F8/F9 in [feature-log](../features/feature-log.md). Syncing
on-device fitness data to that backend is a separate, still-open question.

## Section docs

- [01-data-model.md](01-data-model.md) — entities and relationships
- [02-split-generator-logic.md](02-split-generator-logic.md) — the rule-based
  algorithm and its rationale
- [03-onboarding-flow.md](03-onboarding-flow.md) — screen-by-screen onboarding
- [04-home-logging-ux.md](04-home-logging-ux.md) — home screen and scroll-dial
  logging interaction
- [06-health-calculations.md](06-health-calculations.md) — BMI/BMR/TDEE, macro
  targets, PAR-Q screening, injury→exclusion map

## Open questions (not yet decided)

- Nutrition/calorie tracking — **now in scope** (decided 2026-07-02).
  Phase 1 = derived calorie/macro targets + a daily calorie check-in; a full
  itemized food log is a future update. See
  [06-health-calculations.md](06-health-calculations.md) and feature F8.
- Multi-device sync of fitness data — deferred. Accounts now exist (Cloudflare
  backend, auth only), but syncing the on-device profile/logs up to the server
  is not yet designed.
- iOS support — Expo keeps this open later, but Health Connect is Android-only,
  so steps tracking would need an Apple Health equivalent if pursued.
