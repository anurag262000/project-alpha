# Onboarding Flow

Onboarding is the foundation of the whole app: it builds the profile that the
split generator, the calorie/macro targets, and every progress chart read
from. Get this right and everything downstream has good inputs; get it wrong
and no algorithm can compensate.

See [06-health-calculations.md](06-health-calculations.md) for the formulas
and coaching logic behind the numbers captured here.

## Strategy: core-first, then progressive

We collect a lot (stats, activity, diet, injuries, meds, weekly availability),
so we split it in two to minimize sign-up drop-off:

- **Core onboarding** — the minimum needed to (a) generate a first program and
  (b) compute calorie/macro targets safely. Required, done once up front.
- **Progressive enrichment** — everything else, offered afterward from
  Profile → "Complete your profile". Optional; each addition unlocks more
  (more chart dimensions, diet check-in, refined targets).

The user reaches a working plan fast, then deepens the profile at their pace.

---

## Core onboarding — screens

All numeric entry uses the scroll-dial component (learned here, reused in
workout logging). Units toggle (metric/imperial) available on measurement
screens; stored canonically in metric.

### 1. Welcome
What the app does; sets expectation that a few questions build a real program,
not just a tracker.

### 2. Basic info
- Sex (drives BMR formula and default heuristics)
- Date of birth (age)
- One screen, both required.

### 3. Measurements → live BMI
- Height, Weight (scroll-dial, unit toggle)
- Weight carries an **estimated / measured** flag (confidence for the
  algorithm and charts).
- **Auto BMI**: computed live from height + weight, shown with its category
  and the "muscle mass caveat" note. Stored on the first `BodyMeasurement`.

### 4. Goal
Fat loss / muscle gain / recomp / general fitness. Single most influential
input — sets calorie direction and rep/volume bias.

### 5. Experience level
New / under 1 yr / 1–3 yr / 3+ yr. Sets starting volume (MEV vs MAV) and
eligible split templates.

### 6. Lifestyle activity (NEAT)
How active is daily life *outside* training: sedentary desk / lightly active /
active / very active job. Feeds the TDEE multiplier
([06 §3](06-health-calculations.md#3-tdee-total-daily-energy-expenditure)).

### 7. Weekly availability
- **Training days**: pick specific weekdays (not just a count) so the
  generator can pin days.
- **Preferred time of day**: morning / midday / evening / flexible, with an
  optional specific time (used for reminders and, later, fasted-training
  notes).
- **Session length**: minutes (scroll-dial / slider).

### 8. Equipment access
Home minimal / home full / full gym. Filters the exercise pool.

### 9. Health & readiness
- **PAR-Q+ short screen** (7 yes/no). Any "yes" → recommend physician
  clearance before starting; user acknowledges and may proceed
  ([06 §8](06-health-calculations.md#8-health-readiness-par-q-style--medical-disclaimer)).
- **Injuries / limitations**: checklist (shoulder, lower back, knee, wrist,
  elbow, hip) + free text. These actively exclude movements from the generated
  split.
- Medical disclaimer shown here.

### 10. Review
Recap of all core inputs with edit-in-place links. No silent assumptions —
the user sees exactly what feeds generation.

### 11. Plan ready + your numbers
- Generated split summary (template + why it was chosen).
- **Your daily targets**: calorie target + protein/fat/carb macros, plus BMI
  and TDEE, explained in one line each.
- Prompt: "Complete your profile" → progressive enrichment (skippable).

---

## Progressive enrichment — later, from Profile

Offered after onboarding; none of it blocks a working plan.

| Item | Unlocks |
|---|---|
| Detailed measurements (waist / chest / arm, body-fat %) | More progress-chart dimensions; leaner protein targeting if body-fat known |
| Target weight + timeline | Progress-to-goal projection; sanity-checks the calorie target's aggressiveness |
| Medications & conditions detail | Fuller safety context; intensity-by-RPE note when relevant (e.g. beta-blockers) |
| Dietary pattern & allergies (omnivore / veg / vegan; allergens) | Tailored food guidance; foundation for the future food log |
| Enable calorie check-in | Daily calories-eaten logging charted vs target (phase-1 nutrition) |

---

## Required vs optional (validation)

- **Required (core):** sex, DOB, height, weight, goal, experience, lifestyle
  activity, ≥1 training day, session length, preferred time, equipment,
  PAR-Q answers. Injuries optional but prompted.
- **Optional (progressive):** everything in the enrichment table. Degrades
  gracefully — fewer chart dimensions or no exclusions, never a block.

## What onboarding produces

On completion the app has enough to immediately:

1. **Generate the split** — goal + experience + days + time + equipment +
   injuries → program (see [02-split-generator-logic.md](02-split-generator-logic.md)).
2. **Compute nutrition targets** — stats + activity + goal → BMI, BMR, TDEE,
   calorie + macro targets (see [06-health-calculations.md](06-health-calculations.md)).
3. **Seed progress baselines** — first `BodyMeasurement` (with BMI) as the
   zero point every future chart compares against.

## Data written

See [01-data-model.md](01-data-model.md) for the schema. Onboarding writes:
`UserProfile`, the first `BodyMeasurement`, `HealthScreening`, and the cached
derived targets on the profile. Progressive enrichment updates the same
`UserProfile` and adds `CalorieCheckin` rows once enabled.
