# Health Calculations & Coaching Inputs

Reference for every number the app derives from the profile, the formula
behind it, and how a coach would use it. These are established, citable
methods — not invented — so we never present the user with a made-up target.

Sources referenced by name: Mifflin-St Jeor (BMR), WHO (BMI categories),
PAR-Q+ (readiness screening), ISSN/ACSM position stands (protein & calorie
guidance).

---

## What a fitness coach actually needs (and why)

Before designing fields, here's the coach's mental checklist and what each
item unlocks. This is the "absolute necessary" set.

| Coach needs | Why | Field(s) it maps to |
|---|---|---|
| Age, sex, height, weight | Baseline for energy expenditure, BMI, and safe load expectations | `date_of_birth`, `sex`, `height_cm`, `weight_kg` |
| Goal | Determines calorie direction (deficit/surplus) and rep/volume bias | `goal` |
| Training experience | Sets starting volume (MEV vs MAV) and which splits are safe | `experience_level` |
| Lifestyle activity (NEAT) | Non-exercise energy — a nurse vs a desk worker differ by 400+ kcal/day | `activity_level` |
| Weekly availability + time of day | Split template must fit real days and session length; time-of-day affects reminders and (later) fasted-training notes | `training_days`, `session_length_min`, `preferred_time` |
| Equipment | Filters the exercise pool | `equipment_access` |
| Injuries | Exclude movements that would aggravate them | `injuries` |
| Health conditions & medications | Safety gating; some meds change how we prescribe intensity | `health_screening` |
| Diet preference & intake | Calorie/macro targets and adherence | `dietary_pattern`, `CalorieCheckin` |

---

## 1. BMI (Body Mass Index)

**Formula:** `BMI = weight_kg / (height_m)²`

**Categories (WHO):**

| BMI | Category |
|---|---|
| < 18.5 | Underweight |
| 18.5 – 24.9 | Normal |
| 25.0 – 29.9 | Overweight |
| ≥ 30.0 | Obese |

- Computed automatically whenever height or weight is entered/updated, and
  stored alongside each `BodyMeasurement` so the trend is chartable.
- **Caveat we surface in-app:** BMI ignores body composition — a muscular
  trainee can read "overweight" while lean. We show the number and category
  but never use BMI alone to drive the plan; it's context, not a target.

## 2. BMR (Basal Metabolic Rate) — Mifflin-St Jeor

The most accurate widely-used estimate without lab testing.

```
Men:   BMR = 10·kg + 6.25·cm − 5·age + 5
Women: BMR = 10·kg + 6.25·cm − 5·age − 161
```

## 3. TDEE (Total Daily Energy Expenditure)

`TDEE = BMR × activity_multiplier`

The activity multiplier reflects the user's **overall** lifestyle including
training. We pre-select a tier from their lifestyle NEAT answer + training
days, and let them adjust.

| Tier | Description | Multiplier |
|---|---|---|
| Sedentary | Desk job, little movement, no/low training | 1.20 |
| Lightly active | Light walking or 1–3 training days/wk | 1.375 |
| Moderately active | On-feet some of the day or 3–5 training days/wk | 1.55 |
| Very active | Physical job or 6–7 training days/wk | 1.725 |
| Extra active | Hard physical job + daily training | 1.90 |

**Auto-suggestion rule:** start from the lifestyle NEAT answer, then bump one
tier up if `training_days ≥ 5`. User can override — the picker shows the
suggested tier highlighted.

## 4. Calorie target (by goal)

Applied to TDEE, with safety floors.

| Goal | Target | Notes |
|---|---|---|
| Fat loss | TDEE − 20% | Never below BMR; hard floor 1500 kcal (men) / 1200 kcal (women) |
| Muscle gain | TDEE + 10% | Lean bulk; avoids excess fat gain |
| Recomp | TDEE − 5% | Slight deficit, high protein |
| General fitness | TDEE (maintenance) | — |

## 5. Macro targets

Order: set protein first (muscle retention), then fat (hormones), carbs fill
the rest. Energy: protein & carbs 4 kcal/g, fat 9 kcal/g.

- **Protein** (g/kg current bodyweight): fat_loss 2.0 · muscle_gain 1.8 ·
  recomp 2.0 · general_fitness 1.6. (ISSN range 1.6–2.2 g/kg; higher end in a
  deficit to preserve lean mass.)
- **Fat:** 25% of total calories (floor ~0.6 g/kg for hormonal health).
- **Carbs:** remaining calories after protein and fat.

### Worked example
Male, 30 y, 178 cm, 82 kg, moderately active (1.55), goal = fat loss:

- BMI = 82 / 1.78² = **25.9** (overweight, borderline)
- BMR = 10·82 + 6.25·178 − 5·30 + 5 = **1787 kcal**
- TDEE = 1787 × 1.55 = **2771 kcal**
- Calorie target (−20%) = **2217 kcal**
- Protein = 2.0 × 82 = 164 g (656 kcal)
- Fat = 25% × 2217 = 554 kcal → 62 g
- Carbs = 2217 − 656 − 554 = 1007 kcal → 252 g

All recomputed automatically whenever weight, activity level, or goal changes.

## 6. Calorie check-in (nutrition, phase 1)

For now (per product decision) the diet feature is **targets + a daily
calorie check-in**, not a full food log.

- User logs a single number: `calories_consumed` for the day (optional protein
  number too).
- Charted against the calorie target; adherence % over a week.
- **Forward-compatible:** the `CalorieCheckin` record is the same row a future
  full food log would sum into, so adding a food database later doesn't
  require a schema rewrite — a food-log entry just becomes a child that rolls
  up into the day's total. (Full food log = future update; goal state.)

## 7. Injury → movement-exclusion map

Injuries actively modify the generated split (per product decision). Tagged
injuries exclude/limit movement patterns; the generator prefers the listed
alternatives from the exercise library.

| Injury tag | Limit / exclude | Prefer |
|---|---|---|
| Shoulder | Overhead press, upright row, dips, behind-neck | Neutral-grip / landmine press, cable work |
| Lower back | Conventional deadlift, good morning, bent barbell row | Chest-supported row, hip thrust, trap-bar, leg press |
| Knee | Deep squats/lunges, leg extension (if irritating) | Box squat, controlled-depth leg press, partial ROM |
| Wrist | Straight-bar press/curl | Neutral-grip DB, EZ-bar |
| Elbow | Heavy skullcrushers, straight-bar press | Neutral-grip, cable pushdown |
| Hip | Deep hip flexion, deep squat | Partial ROM, hip thrust |

Mechanism: each injury tag maps to `movement_pattern` / exercise tags that the
generator filters out in Step 3 of
[02-split-generator-logic.md](02-split-generator-logic.md).

## 8. Health readiness (PAR-Q+ style) & medical disclaimer

We use a short readiness screen modeled on **PAR-Q+** (the standard
pre-exercise screening trainers use). 7 yes/no questions, e.g.:

1. Has a doctor ever said you have a heart condition?
2. Do you feel pain in your chest during physical activity?
3. Do you lose balance from dizziness / lose consciousness?
4. Do you have a bone/joint problem that could worsen with activity?
5. Are you currently pregnant?
6. Are you on medication for blood pressure or a heart condition?
7. Any other reason you should not do physical activity?

- **Any "yes" →** show a "consult a physician before starting" recommendation
  and set `cleared_by_physician` handling; still let them proceed (they
  acknowledge), but flag it.
- **Medications note for the coach logic:** e.g. beta-blockers blunt heart
  rate, so we prescribe intensity by **RPE**, not heart-rate zones. Conditions
  and meds are stored as reference and surface a standing disclaimer.
- **Disclaimer (shown once + in settings):** the app provides general fitness
  guidance, not medical advice; users with conditions or on medication should
  consult a physician. Required anyway for Play Store health-data compliance.
