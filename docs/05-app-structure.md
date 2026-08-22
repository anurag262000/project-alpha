# App Structure — Phase 2

Phase 1 got the loop working end to end: onboard → generated split → today's
workout → per-set logging → progression → progress. It works, and it has no
shape. This doc is the shape: which numbers the app is *about*, which screen
owns each one, and what gets built in what order.

Companion docs: [01-data-model](01-data-model.md) (entities),
[04-home-logging-ux](04-home-logging-ux.md) (the session itself),
[06-health-calculations](06-health-calculations.md) (how the numbers are derived).

---

## 1. What's actually wrong

Not opinions — things that are true in the code today.

| # | Problem | Evidence |
|---|---|---|
| S1 | A whole screen is unreachable. | `app/(app)/library.tsx` is not in `BottomNav`, and nothing in the app routes to `/library`. 117 lines of dead UI. |
| S2 | The app's headline numbers evaporate. | `computeTargets` (calories, TDEE, macros) is referenced only by `onboarding/activity.tsx` and `onboarding/ready.tsx`. After onboarding, no screen ever shows a calorie target again. |
| S3 | A table exists for a feature that doesn't. | `calorie_checkin` is in `schema.ts`, written by nothing and read by nothing (feature F8). |
| S4 | The handoff drops you cold. | `ready.tsx` → "Start training" → `/onboarding/account` (a signup form) → `completeOnboarding()` → `/home`. On day one Home can render "Rest day" and offer nothing. The plan you were just sold is never re-introduced. |
| S5 | Two screens answer the same question. | Weekly sets per muscle is rendered by both `program.tsx` ("Weekly volume · logged vs planned") and `progress.tsx` ("Volume this week · sets per muscle"). |
| S6 | Exercise lists are decoration, not information. | `home.tsx` renders the day's exercises as `names.join(' · ')` with `numberOfLines={1}`. You can never see what you're actually doing. |

S1/S5 are IA. S2/S3 are a missing spine. S4 is the handoff. S6 is what the
plan and Today screens both still do to an exercise list.

---

## 2. The metric spine

The fundamental values the app is built on. **Rule: every number has exactly
one owner screen, where it is explained and can be acted on. Everywhere else
it is a glance — a number and a unit, no explanation, tapping it goes to the
owner.** That rule is what stops six screens from turning into six dashboards.

### Energy loop

| Value | Derivation | Owner | Glances |
|---|---|---|---|
| Calorie target | `calorieTarget()` — TDEE ± goal delta | **Today** | Plan screen, Profile |
| TDEE | `computeBMR()` × activity multiplier | **Profile** | Today, Plan screen |
| Macros (P/F/C) | `macroTargets()` | **Today** | Plan screen, Profile |
| Calories consumed | `calorie_checkin` — **not built (F8)** | **Today** | Progress (7-day) |
| Steps · active minutes | Health Connect → `activity_snapshot` | **Today** (ring) | Progress (7-day) |

### Training loop

| Value | Derivation | Owner | Glances |
|---|---|---|---|
| Today's prescription (weight × reps) | `nextPrescription()` | **Session** | Today |
| Weekly sets per muscle vs MEV/MAV/MRV | `MuscleVolume` + `LANDMARKS` | **Plan** | Progress |
| Session volume (Σ reps × weight) | `logged_set` | **Summary** | Progress |
| Estimated 1RM per main lift | Epley over `logged_set` — **not built** | **Progress** | Session (ghost text) |
| Adherence (rolling 2 weeks) | `adherenceRate()` | **Progress** | Today (only when it drops below `ADHERENCE_THRESHOLD`) |
| Streak | `currentStreak()` | **Today** | — |

### Body

| Value | Derivation | Owner | Glances |
|---|---|---|---|
| Bodyweight + trend | `body_measurement` | **Progress** | Today, Profile |
| BMI + category | `computeBMI()` | **Profile** | — |

Three of these have no implementation: calories consumed (F8), estimated 1RM,
and the 7-day energy history that depends on F8. They are the phase-2 build
list, not extras.

---

## 3. Information architecture

Four tabs, renamed to what they answer, plus the two screens that are modes
rather than destinations.

| Tab | The question it answers | Owns |
|---|---|---|
| **Today** | "What do I do right now?" | Steps ring, streak, today's session card, energy check-in, calorie + macro targets |
| **Plan** | "What am I on, and why?" | The split, the week, per-day exercise lists, volume vs landmarks, swap/substitute, **exercise library as a sub-route** |
| **Progress** | "Is it working?" | Bodyweight trend, e1RM per lift, volume history, adherence, steps history, session history |
| **Profile** | "Who am I to the app?" | Identity, derived values (BMR/TDEE/BMI), units, appearance, account |

Changes this forces:

- **Library stops being a phantom tab.** It becomes `/plan/library`, reachable
  from Plan (browse) and from the session (substitute) — the two places you
  actually want to look an exercise up. Fixes S1.
- **Volume vs landmarks moves to Plan only.** Plan owns "what the week is
  supposed to be"; Progress owns "what happened over time". Fixes S5.
- **Session and Summary are modes, not tabs** — full-screen, no bottom nav,
  entered from Today and exited back to it. They already behave this way;
  the doc makes it deliberate.
- **Today gets the energy card** it should have had since onboarding computed
  it. Fixes S2/S3 by giving F8 a home.

Nutrition does not get a fifth tab. It is one card on Today until an itemized
food log exists, which is explicitly out of scope
([00-overview](00-overview.md) open questions).

---

## 4. The handoff

Today: **ready → signup form → `/home` (possibly "Rest day")**. The moment of
highest intent is spent on a password field, and the plan is never mentioned
again.

Phase 2: **plan → account → Today, arriving primed.** The plan screen and the
sheets it opens are specced in
[design/prototype/plan-handoff.html](../design/prototype/plan-handoff.html).

1. The plan screen sells the plan — days open as sheets, exercises open on top
   of those — and its button says what happens next.
2. Account stays where it is — it is the price of a synced account and it is
   one screen — but it must not be the last thing you see.
3. `completeOnboarding()` lands on **Today in a first-run state**: the plan
   name, the week strip with today marked, and a single primary action that is
   correct on both cases:
   - training day → *Start {day label}*
   - rest day → *Your first session is {weekday} · Preview it* (opens Plan on
     that day) — never a dead end.
4. The first-run state clears once a session has been logged.

---

## 5. Screen briefs

Only what changes. Anything not listed stays as built.

### Today (`(app)/home.tsx`) — extend

- Energy card: target vs consumed, macro chips, check-in entry (F8).
- Exercise list on the session card gets real rows (name + `sets × reps`),
  not a truncated `·`-joined string.
- First-run state per §4.

### Plan (`(app)/program.tsx`) — extend

- Per-day exercise lists use the same day card as the plan screen, opening the
  same day sheet — one component, both screens.
- Keeps volume vs MEV/MAV/MRV; gains the entry point to the library.
- Swap/substitute an exercise at the plan level (currently only possible
  mid-session).

### Progress (`(app)/progress.tsx`) — extend

- Add e1RM per main lift (Epley over `logged_set`).
- Drop the weekly volume block (moved to Plan); keep volume *history*.

### Library (`(app)/library.tsx`) — reroute

- Moves to `/plan/library`, entered from Plan and from the session's
  substitute flow. No code change beyond the route and a back target.

---

## 6. Build order

Each step lands something usable on its own.

| # | Step | Why first |
|---|---|---|
| 1 | Build the plan → day → exercise sheets (`plan-handoff.html`) | It's the screen that triggered this, and its day card + day sheet are the components Today and Plan both need. |
| 2 | Route Library under Plan | Deletes a dead screen from the app's surface for the cost of one route. |
| 3 | Shared `DayCard` used by the plan screen / Today / Plan | Stops the truncated-string implementations from drifting further. |
| 4 | Energy card on Today + F8 check-in | Closes the biggest hole in the spine: the numbers onboarding promised. |
| 5 | First-run handoff state (§4) | Small, and only sensible once Today has its final shape. |
| 6 | e1RM on Progress | Last because it needs logged history to show anything. |
| 7 | Move volume-vs-landmarks off Progress | Cleanup once Plan owns it. |

---

## 7. Open questions

- **Does the account wall stay before the app?** Deferring signup until after
  the first logged session would raise activation, but the profile is written
  by `completeOnboarding()` at that point today. Would need the local profile
  to exist before the account does.
- **F8 check-in granularity** — one number a day, or per-meal? Spine assumes
  one number until a food log exists.
- **Which lifts count as "main"** for e1RM tracking — compound-pattern
  exercises by `movement_pattern`, or user-pinned?
