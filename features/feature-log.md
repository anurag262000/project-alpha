# Feature Log

One entry per feature: current requirement, how it mutated, and its bugs.
Status legend: `planned` · `prototyped` · `in-dev` · `shipped`.

---

## F1 — Onboarding & profile
**Status:** in-dev
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
- 2026-07-04 — **Implemented in the RN app** (status → in-dev). All 7 steps
  now write to a shared draft store; Basics is a real form (DOB / height /
  weight with validation + live BMI) instead of hardcoded display values.
  Plan-ready screen shows genuinely computed targets. On account creation the
  draft persists to on-device SQLite as `profile` (with cached
  BMR/TDEE/calorie/macro targets), first `body_measurement` (accuracy flag +
  BMI), and `health_screening`. App entry gate: signed-out → welcome,
  signed-in without profile → onboarding, else → home. Split generation at
  completion is still a placeholder (F3 not built).
- 2026-08-21 — **Basics inputs reworked** (design-log 2026-08-21): DOB is a
  calendar picker instead of a typed ISO string, height accepts cm *or*
  feet+inches, and weight is a two-column scroll dial with kg/lb switching.
  Centimetres and kilograms remain the only stored units — the alternate units
  are entry modes, converted at the boundary, so BMI/BMR/TDEE and the split
  generator are untouched. Conversions and local-time ISO date helpers live in
  `mobile/src/lib/units.ts` (unit-tested); the pickers are in
  `mobile/src/components/pickers.tsx`.
- 2026-08-21 — **Basics reflowed to fit one screen, no scrolling.** Inputs are
  now one `FieldGroup` of hairline-separated rows; the weight dial and the
  calendar open as bottom sheets on tap instead of living in the page (the
  inline dial also blocked page scrolling, being a vertical scroller inside a
  vertical one). Unit toggles moved inline (cm/ft) or into the sheet (kg/lb).
  Sheets use the new opaque `card` surface — glass was unreadable over the
  ambient glow. See design-log 2026-08-21.
- 2026-08-21 — Row-list layout **reverted** to the labelled-field form (label
  above each input on its own surface) — the established form language wins
  over pure compactness. The fixes stay: dial and calendar open as sheets,
  cm/ft inline, opaque sheets, no scrolling.

**Bugs:** none yet.

---

## F2 — Exercise library
**Status:** built
**Spec:** [../docs/01-data-model.md](../docs/01-data-model.md) (Exercise entity)

**Current requirement:** Browse/search 800+ exercises, filter by muscle group
and equipment. Seeded from an open dataset (free-exercise-db to start).

**Mutations:**
- 2026-07-02 — Decided to seed from an existing open, licensable dataset rather
  than hand-authoring; free-exercise-db first, wger as fallback if coverage is
  short.
- 2026-07-04 — Interim: a hand-picked **28-exercise starter seed** (every
  primary muscle + movement pattern, `mobile/src/db/seed.ts`) ships in the
  local DB so logging works end-to-end now. The full open-dataset import
  remains the requirement; the seed is idempotent and will be replaced by it.

- 2026-08-20 — Seed grown to **58 exercises** and its semantics fixed: the
  `equipment` array is now a **requirement set** (you need *all* of it), not a
  list of alternatives — the old rows were ambiguous ("Goblet Squat:
  dumbbell, kettlebell" read as requiring both, "Romanian Deadlift: barbell,
  dumbbell" likewise), which would have silently starved the generator. Kit
  variants are separate rows instead. Coverage now includes bodyweight/band/
  dumbbell options for every muscle so a `home_minimal` user gets a real
  program. The seed **reconciles by name on every launch** (inserts new rows,
  updates changed classification) instead of only running on an empty table,
  so existing installs pick up the fixes without losing logged history.
  Library screen is wired to the DB with working search + muscle filter.
  Full open-dataset import (free-exercise-db) remains the requirement.

**Bugs:** none yet.

---

## F3 — Program generator (split)
**Status:** built
**Spec:** [../docs/02-split-generator-logic.md](../docs/02-split-generator-logic.md)

**Current requirement:** Rule-based (not ML) generator that maps goal +
days/week + experience + equipment + session length to a split template,
assigns exercises and weekly volume using training-science landmarks
(MEV/MAV), and progresses via double-progression with deload triggers and
adherence-aware adjustments.

**Mutations:**
- 2026-07-02 — Chose rule-based over ML: auditable, needs no training data,
  and avoids suggesting unrealistic goals (user's explicit concern).

- 2026-08-20 — **Built, all five steps of docs/02.** `src/lib/splitGenerator.ts`
  (pure, dependency-free): step 1 template selection (Full Body / Upper-Lower /
  undulating U-L / PPL+UL / PPL×2, with beginners steered to simpler templates
  regardless of requested days), step 2 MEV→MAV volume landmarks biased by goal
  and experience with MRV as a ceiling check, step 3 exercise selection filtered
  by equipment and the docs/06 §7 injury map (compound-first ordering, rotation
  so repeated days differ), step 4 rep bands by goal with a session-length set
  cap. `src/lib/progression.ts` covers step 5 in full: double progression,
  deload triggers (weeks-on-program **or** two consecutive multi-lift stalls),
  and adherence-aware adjustment that suggests fewer days / shorter sessions
  below 70% completion. Persisted by `src/db/programRepo.ts` into
  `program` / `program_day` / `program_exercise`; generated automatically at
  `completeOnboarding()` and back-filled at launch for pre-existing profiles.
  The generator's `rationale[]` is surfaced on the onboarding "your plan" step,
  so every prescription is traceable to a rule. 40 unit tests, including a
  sweep over all 240 goal × experience × equipment × days combinations.
- 2026-08-20 — Two selection bugs found by running the generator on-device
  against the real seed, not by the unit tests (both now have regression
  coverage). (1) With scores tied, ordering fell back to `name.localeCompare`,
  so a **gym** user was prescribed "Band Chest Press" over "Barbell Bench
  Press" — fixed by scoring equipment on how loadable it is, since double
  progression needs a load increment a band cannot give. (2) Compound rotation
  keyed off the global day index, so in an upper/lower split both lower days
  hit the same rotation slot and the barbell RDL was never prescribed at all —
  now keyed off how many times that muscle has already been trained this week,
  so the first session gets the best option and later ones rotate.

**Bugs:** none yet.

---

## F4 — Home + activity tracking
**Status:** built
**Spec:** [../docs/04-home-logging-ux.md](../docs/04-home-logging-ux.md)

**Current requirement:** Home shows today's ordered workout, streak, and an
activity ring (steps + active minutes). Steps/activity come from Android
Health Connect.

**Mutations:**
- 2026-07-02 — Source is Health Connect, not the deprecated Google Fit API.
  Dual ring: green = steps (passive), red = active minutes — surfaces the two
  data worlds the app bridges.

- 2026-08-20 — **Home is real data.** Today's card reads the active program's
  `ProgramDay` for the current weekday (rest-day state with an ad-hoc option
  when there isn't one), streak is computed from completed sessions with rest
  days not breaking it, greeting derives from the account email (no name field
  on the profile yet). Deload / adherence advice from F3 surfaces as a banner.
- 2026-08-20 — **Health Connect wired** (ADR-004). `src/lib/healthConnect.ts`
  reads Steps + ExerciseSession duration; `src/db/activityRepo.ts` upserts one
  `activity_snapshot` row per day and backfills the trailing week. The ring is
  now driven by real steps/points against a 10k-step / 100-point goal.
  Pinned to `react-native-health-connect@4.0.0` and minSdk 26 — see ADR-004 for
  why the latest version cannot build on Expo 52. **Not yet verified on a
  physical device**; the grant flow needs real Health Connect data.

**Bugs:** none yet.

---

## F5 — Workout logging (scroll-dial)
**Status:** built
**Spec:** [../docs/04-home-logging-ux.md](../docs/04-home-logging-ux.md)

**Current requirement:** Per-set logging via three scroll wheels (weight /
reps / RPE), no keyboard. Shows last-time reference, rest timer, set-progress
dots, exercise substitution, and a completion summary with PRs.

**Mutations:**
- 2026-07-02 — Scroll-dial confirmed as the core interaction; wheels default to
  last logged values so repeat sets need zero scrolling.
- 2026-07-04 — **First functional version in the RN app.** Sessions and sets
  persist to on-device SQLite (`workout_session`, `logged_set`): start / log
  sets (kg, reps, optional RPE, warm-up flag) / finish, "last time" ghost
  text per exercise, recent-workouts history on the logging tab, and a real
  completion summary (volume, duration, set count, compute-on-read PRs).
  Interim interaction is **keyboard entry, not the scroll-dial** — the dial
  needs a custom wheel component and stays the target UX (see design-log
  2026-07-04). Sessions are ad-hoc (`program_day_id` null) until F3 exists.

- 2026-08-20 — **Now program-driven.** A session starts against today's
  `ProgramDay` (`program_day_id` set, no longer always ad-hoc) and shows the
  planned exercises in order, each with its target sets × rep range and the
  double-progression prescription for this session ("Hit 10 reps on all 3 sets
  — go to 62.5 kg"). Sets log against `program_exercise_id`, which is **kept on
  substitution** so plan-vs-actual and substitution frequency stay visible.
  Adds a rest timer (compound 120s / isolation 75s, ±15s / skip), off-plan
  exercise addition, and per-exercise set progress. Ending a session with
  nothing logged now writes `status = skipped`, not `completed`, so empty
  sessions no longer inflate adherence and streaks.
- 2026-08-20 — Interaction is a **+/- stepper**, not the three scroll wheels.
  It meets the spec's actual requirements (no keyboard, seeded from the last
  logged value, repeat sets are confirm-only) at a fraction of the code. The
  wheels remain the target UX; revisit if the tap count annoys.

**Bugs:** none yet.

---

## F6 — Progress & analytics
**Status:** built
**Spec:** [../docs/01-data-model.md](../docs/01-data-model.md) (derived metrics)

**Current requirement:** Bodyweight trend, estimated 1RM/PRs, adherence %, and
weekly volume per muscle group — all computed on read from logged data.

**Mutations:**
- 2026-07-02 — Metrics computed on read for MVP; materialize into a snapshot
  table only if query performance requires it.

- 2026-08-20 — **Wired to real data.** Bodyweight trend from
  `body_measurement` (with a weigh-in sheet that also recomputes the cached
  calorie/macro targets, per docs/01), BMI + category per measurement, weekly
  sets per muscle **logged against planned** (the payoff of keeping plan and
  actual in separate tables), 2-week adherence % with the F3 advice line,
  7-day step bars from `activity_snapshot`, and session history with total
  volume moved. All computed on read as specced — no snapshot table.
  Estimated-1RM charting is still outstanding; PRs remain per-session only.

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
- 2026-08-21 — Ambient glow re-implemented as an SVG radial gradient (RN has
  no `filter: blur()`), adding a `glowOpacity` token; first app launcher icon
  (`mobile/assets/`) derived from the welcome mark + ambient palette. Shared
  `Dial` / `DateField` / `HeightField` pickers added to the system.
- 2026-08-21 — **Real brand mark adopted** (`mobile/assets/main.svg`): app icon
  + splash, with `expo-splash-screen` added. All raster layers are generated
  from the one SVG, so the vector stays the source of truth. Added the opaque
  `card` token for sheets.

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
Cloudflare Worker (`backend/auth-worker/`) over Turso (libsql). Signup step
sits at the end of onboarding (after "Plan ready"); returning users log in
from Welcome. **Email verification is a hard gate** (ADR-003): signup and
unverified login issue no session until a 6-digit code emailed via Resend is
confirmed. Opaque bearer-token session stored in `expo-secure-store`,
restored on launch.

**Mutations:**
- 2026-07-03 — Created. Reverses the earlier local-only stance (00-overview
  "Backend: None"). Reason: real accounts are wanted now. Scope is **auth
  only** — creating an account + session. Syncing the local `UserProfile` to
  the backend is deliberately **out of scope** (still open question #1 in the
  architecture doc). DB is D1 as a first pick under test, not locked.
- 2026-07-04 — DB switched **D1 → Turso** before first deploy, per ADR-002
  (same SQLite dialect; monthly-reset free caps fit the batch pattern; small
  lock-in hedge at zero cost). Worker now reads `TURSO_DATABASE_URL` (var) +
  `TURSO_AUTH_TOKEN` (secret); drizzle-kit migrates against Turso directly.
  Sign-out row added to the Profile screen; login on a fresh install with no
  local profile routes into onboarding instead of an empty home.
- 2026-07-04 — **Deployed** to Cloudflare
  (`project-alpha-auth-worker.projectalphaauth.workers.dev`); hosted Turso DB
  migrated; app `EXPO_PUBLIC_API_URL` points at it. Worker source later split
  into `routes/` + `lib/` modules with source maps.
- 2026-07-06 — **Added email OTP verification as a hard gate** (ADR-003).
  Backend: new `email_codes` table + `users.email_verified`; endpoints
  `POST /verify/request` and `/verify/confirm`; `/signup` now returns
  `{ verificationRequired }` (no token) and emails a 6-digit code via **Resend**
  (`lib/email.ts` + `lib/verification.ts`, `lib/otp.ts`); `/login` on an
  unverified account returns `403 { verificationRequired }` and re-sends.
  Code policy: 10-min TTL, ≤5 attempts, 60-s resend cooldown, stored hashed.
  App: new `app/verify.tsx` (code entry + resend countdown); `signUp` no longer
  signs in — it routes to the verify screen, which finalizes onboarding
  (signup) or routes by profile (login) after `verifyEmail()`. `useAuth` gains
  `verifyEmail`/`resendVerification`; `api.ts` gains
  `VerificationRequiredError`. Sender is env-configurable (`RESEND_FROM`);
  production delivery to arbitrary emails pending a verified Resend domain.

**Bugs:** none yet.

---

## Global bug log

| # | Date | Area | Description | Status | Fix |
|---|------|------|-------------|--------|-----|
| B1 | 2026-07-02 | prototype / dev-env | Preview server failed: sandbox blocks python `http.server`, and `npx serve` needs a network fetch. | fixed | Replaced with zero-dependency Node static server (`design/prototype/server.js`). |
| B2 | 2026-08-21 | android build | `expo prebuild --clean` broke the Android build: `:expo-modules-core:compileDebugKotlin` failed with "Compose Compiler 1.5.15 requires Kotlin 1.9.25 … using 1.9.24". The regenerated template pins `kotlinVersion = 1.9.25` (→ Compose 1.5.15) but `@react-native/gradle-plugin` supplies the real compiler, and RN ≤ 0.76.6 pins Kotlin 1.9.24 (0.76.7+ pins 1.9.25). The stale `android/` had been generated by an older template, so the drift only surfaced on a clean prebuild. | fixed | `npx expo install --fix` → react-native 0.76.9, expo-sqlite ~15.1.4, react-native-screens ~4.4.0, @expo/vector-icons ~14.0.4. Keep dependencies on Expo's expected versions; `expo install --check` catches this before a prebuild does. |
| B3 | 2026-08-21 | icons / assets | **No icon rendered anywhere in the app.** `expo-asset`'s `downloadAsync` rejected with "Module 'expo.modules.interfaces.filesystem.AppDirectories' not found", so the `@expo/vector-icons` font never loaded — and `createIconSet` renders an empty `<Text />` while `fontIsLoaded` is false, which fails silently instead of showing tofu. Cause: **`expo-file-system` was never installed**, and `expo-asset` does not declare it as a dependency, so nothing flagged it. Glyph names were all valid — the loader was the problem. | fixed | `npx expo install expo-file-system` + a native rebuild (new native module). Any remote-asset load — icon fonts, custom fonts, `expo-asset` images — depends on it. |
