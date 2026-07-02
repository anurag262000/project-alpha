# Split-Generator Logic

## Approach: rule-based, not ML

The user's own instinct was right: don't try to learn a model from one
person's data, and don't suggest goals/plans the app can't ground in
something real. Instead, encode established resistance-training principles
(progressive overload, volume landmarks, double progression) as explicit
rules. This is auditable — every suggestion traces back to a rule you can
read — and it doesn't need training data at all, just the user's profile.

## Inputs (from UserProfile)

- `goal`: fat_loss / muscle_gain / recomp / general_fitness
- `experience_level`: new / under_1yr / 1_3yr / 3yr_plus
- `days_per_week`
- `session_length_min`
- `equipment_access`: home_minimal / home_full / gym
- `injuries` (tags, e.g. "shoulder", "lower_back")

## Step 1 — Split template selection

| days/week | experience | template |
|---|---|---|
| 2–3 | any | Full Body |
| 4 | new/under_1yr | Upper / Lower (repeated: U-L-rest-U-L) |
| 4 | 1yr+ | Upper / Lower with different emphasis per day (e.g. Upper Strength / Lower Strength / Upper Hypertrophy / Lower Hypertrophy) |
| 5 | any | Push / Pull / Legs / Upper / Lower, or PPL + 2 accessory |
| 6 | 1yr+ | Push / Pull / Legs ×2 |

Beginners are steered toward Full Body / basic Upper-Lower regardless of
requested days, because recovery capacity and movement competency are
usually the limiting factor early on, not exercise variety.

## Step 2 — Weekly volume per muscle group

Uses volume-landmark ranges (sets per muscle per week):

| landmark | meaning | who gets it |
|---|---|---|
| MEV (minimum effective volume) | lowest volume that still produces progress | new / under_1yr, or any goal in a fat-loss phase (recovery capacity is lower in a deficit) |
| MAV (maximum adaptive volume) | volume with the best growth-per-fatigue ratio | 1yr+ experience, muscle_gain/recomp goals |
| MRV (maximum recoverable volume) | ceiling before recovery breaks down | not targeted directly — used only as an upper bound check, never a target |

Example starting ranges (sets/muscle/week; refined over time from logged
adherence and reported fatigue, not guessed once and frozen):

- Chest/Back/Quads/Hamstrings: MEV ~8, MAV ~14–18
- Shoulders/Biceps/Triceps/Calves: MEV ~6, MAV ~12–16

`goal=fat_loss` and `experience=new` both bias toward MEV; `goal=muscle_gain`
with `experience=1yr_plus` biases toward MAV. `general_fitness` sits at the
midpoint.

## Step 3 — Exercise selection per day

For each `ProgramDay`, given its muscle emphasis (from the template):

1. Filter `Exercise` by `equipment_access` (only include exercises whose
   required equipment the user has) and exclude any whose
   `movement_pattern`/muscle overlaps a tagged `injury`.
2. Pick 1 compound (`movement_pattern` push/pull/hinge/squat) exercise per
   major muscle group on that day first — these get priority ordering since
   they're most fatiguing and most valuable early in the session.
3. Fill remaining volume with isolation exercises until the Step 2 weekly
   target is met, distributed across the muscle's sessions that week.
4. Order exercises within the day: compound → secondary compound →
   isolation, so fatigue accumulates after the highest-value work is done.

## Step 4 — Sets, reps, intensity

Rep ranges by goal (standard strength/hypertrophy/endurance banding):

| goal | rep range | rationale |
|---|---|---|
| muscle_gain | 6–12 | classic hypertrophy range |
| fat_loss | 10–15, shorter rest | keeps intensity of effort high while total session density supports the calorie-deficit context, without requiring dedicated conditioning work |
| recomp | 6–12 | same as hypertrophy — recomp is driven by nutrition, not rep range |
| general_fitness | 8–15 | balanced default |

`target_sets` for a `ProgramExercise` = that exercise's share of the weekly
muscle-group volume target (Step 2) divided by number of times that muscle
is trained per week.

## Step 5 — Progression rules (applied after each logged session)

**Double progression model**: for each `ProgramExercise`,

1. If the user hit `target_rep_max` for all `target_sets` last time it was
   performed → increase `weight_kg` next time (smallest sensible increment
   for the equipment type) and reset target reps to `target_rep_min`.
2. If reps were below `target_rep_max` → keep weight, aim to add reps.
3. If the user failed to hit `target_rep_min` on any set two sessions in a
   row → flag for a weight decrease or a deload.

**Deload trigger**: after a fixed number of weeks (e.g. 4–6, tunable) on a
program, or after two consecutive sessions with failed progression across
multiple exercises, suggest a deload week (reduced volume/intensity) before
resuming.

**Adherence-aware adjustment**: if `WorkoutSession` completion rate drops
below a threshold (e.g. <70% over 2 weeks), the generator should suggest
reducing `days_per_week` or `session_length_min` rather than silently letting
the program fail — the plan should adapt to real behavior, not assume the
user was wrong.

## Exercise library data source

Seed `Exercise` from an existing open dataset rather than hand-authoring:

- **free-exercise-db** (GitHub, Unlicense/public-domain) — has name, muscle
  groups, equipment, and images, easiest licensing.
- Alternative: **wger** exercise database (AGPL) — richer data but stricter
  license; only worth it if free-exercise-db's coverage proves insufficient.

Decision: start with free-exercise-db for the MVP seed; revisit if exercise
variety/quality is lacking once the library is in use.
