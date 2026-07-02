# Data Model

## Design principle

Keep **planned** data (what the program says to do) and **actual** data
(what the user logged) in separate tables. This is what makes plan-vs-actual
charts, adherence %, and progression rules possible — collapsing them into one
table would lose the ability to compare intent against reality.

## Entities

### UserProfile
The single local user (no multi-account needed for local-only MVP).

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| sex | enum | used in default volume/TDEE-style heuristics later |
| date_of_birth | date | |
| height_cm | number | |
| goal | enum: fat_loss / muscle_gain / recomp / general_fitness | drives split-generator |
| experience_level | enum: new / under_1yr / 1_3yr / 3yr_plus | drives volume landmarks |
| days_per_week | int | |
| session_length_min | int | |
| equipment_access | enum: home_minimal / home_full / gym | filters exercise selection |
| injuries | text[] (tags) | excludes movement patterns |
| created_at / updated_at | timestamp | |

### BodyMeasurement (time series, 1-to-many from UserProfile)
Captures the "estimated vs accurate" distinction the user wants — a rough
starting weight shouldn't be treated with the same confidence as a later
accurate one.

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| profile_id | fk | |
| date | date | |
| weight_kg | number | |
| body_fat_pct | number, nullable | |
| waist_cm / chest_cm / arm_cm | number, nullable | optional detailed measurements |
| accuracy | enum: estimated / measured | flags confidence for the algorithm and charts |
| source | enum: manual / synced | room for future scale integration |

### Exercise (seeded, read-mostly)

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| name | text | |
| primary_muscle | enum | e.g. chest, back, quads, hamstrings, glutes, shoulders, biceps, triceps, core, calves |
| secondary_muscles | enum[] | |
| movement_pattern | enum: push / pull / hinge / squat / carry / isolation | used for exercise-order heuristics |
| equipment | enum[] | barbell, dumbbell, machine, bodyweight, band, kettlebell, bench |
| difficulty | enum: beginner / intermediate / advanced | |
| instructions | text | |
| media_url | text, nullable | gif/image reference |
| source_attribution | text | dataset + license this row came from |

### Program (a generated or user-customized split)

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| profile_id | fk | |
| name | text | e.g. "Upper/Lower — Fat Loss" |
| goal | enum | snapshot of profile.goal at generation time |
| days_per_week | int | |
| status | enum: active / archived | only one active at a time |
| origin | enum: generated / custom | did the algorithm produce it or did the user hand-build it |
| generated_at | timestamp | |

### ProgramDay (1-to-many from Program)

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| program_id | fk | |
| weekday | enum, nullable | if the user pins days to specific weekdays; nullable if it's just "day N of rotation" |
| order_index | int | sequence within the rotation |
| label | text | e.g. "Upper A", "Lower B" |

### ProgramExercise (1-to-many from ProgramDay) — the *plan*

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| program_day_id | fk | |
| exercise_id | fk | |
| order_index | int | display/execution order |
| target_sets | int | |
| target_rep_min / target_rep_max | int | |
| target_rpe | number, nullable | optional intensity target |
| notes | text, nullable | |

### WorkoutSession (1-to-many from UserProfile) — an *instance*

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| profile_id | fk | |
| program_day_id | fk, nullable | nullable to allow ad-hoc/off-plan sessions |
| date | date | |
| started_at / completed_at | timestamp, nullable | |
| status | enum: in_progress / completed / skipped | |

### LoggedSet (1-to-many from WorkoutSession) — the *actual*

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| session_id | fk | |
| exercise_id | fk | may differ from the planned exercise (substitution) |
| program_exercise_id | fk, nullable | link back to the plan row it fulfills, null if ad-hoc addition |
| set_index | int | |
| reps | int | |
| weight_kg | number | |
| rpe | number, nullable | |
| is_warmup | boolean | excluded from volume/PR calculations |
| completed_at | timestamp | |

### ActivitySnapshot (1-to-many from UserProfile) — passive data

Kept separate from LoggedSet because it's synced from Health Connect, not
manually entered, and has a different cadence (daily, not per-set).

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| profile_id | fk | |
| date | date | |
| steps | int | |
| active_minutes | int | |
| points | int | app's own gamified point score, derived from steps/active minutes |
| source | enum: health_connect | room for future sources |

## Derived/computed (not stored, or materialized later if needed)

- Weekly volume per muscle group = sum of `reps × sets` (non-warmup) across
  `LoggedSet` joined to `Exercise.primary_muscle`, grouped by week.
- Adherence % = completed `ProgramExercise` rows vs planned, per week.
- PRs = max `weight_kg` for a given `reps` (or estimated 1RM) per exercise,
  computed from `LoggedSet` history.

These are computed on read for the MVP; only worth materializing into a
`ProgressSnapshot` table if query performance becomes a problem.
