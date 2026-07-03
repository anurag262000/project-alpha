# Data Model

## Design principle

Keep **planned** data (what the program says to do) and **actual** data
(what the user logged) in separate tables. This is what makes plan-vs-actual
charts, adherence %, and progression rules possible — collapsing them into one
table would lose the ability to compare intent against reality.

## Backend entities (D1 — `backend/auth-worker/`)

These live server-side in Cloudflare D1, **not** in the on-device SQLite DB.
They cover accounts only; the fitness data below stays local (profile sync is
not yet scoped). See [ADR-001](07-architecture.md#adr-001--backend-for-accounts-cloudflare-workers--d1-auth-first).

### User
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| email | text (unique) | stored lowercase |
| password_hash | text | PBKDF2-SHA256, hex |
| password_salt | text | per-user random salt, hex |
| created_at | timestamp | |

### Session
| Field | Type | Notes |
|---|---|---|
| token | text (pk) | random 32-byte hex, opaque bearer token |
| user_id | fk → User | |
| created_at | timestamp | |
| expires_at | int (unix secs) | 30-day TTL; delete row to revoke |

---

## Local entities (on-device SQLite)

### UserProfile
The single on-device user (one profile per install). Distinct from the backend
`User` above — not yet linked; profile sync is a future, separate decision.

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
| injuries | text[] (tags) | excludes movement patterns (see [06 §7](06-health-calculations.md#7-injury--movement-exclusion-map)) |
| activity_level | enum: sedentary / light / moderate / very / extra | lifestyle NEAT → TDEE multiplier |
| training_days | weekday[] | specific days chosen (not just a count); `days_per_week` derives from length |
| preferred_time | enum: morning / midday / evening / flexible | reminders + fasted-training context |
| preferred_time_specific | time, nullable | optional exact time |
| target_weight_kg | number, nullable | progressive; goal projection + target sanity-check |
| dietary_pattern | enum: omnivore / vegetarian / vegan / other, nullable | progressive; food guidance |
| allergies | text[] (tags), nullable | progressive |
| cal_checkin_enabled | boolean | whether daily calorie check-in is on |
| created_at / updated_at | timestamp | |

**Cached derived targets** (recomputed on weight/activity/goal change; stored
on the profile for cheap reads — formulas in [06-health-calculations.md](06-health-calculations.md)):

| Field | Type | Notes |
|---|---|---|
| bmr_kcal | number | Mifflin-St Jeor |
| tdee_kcal | number | BMR × activity multiplier |
| calorie_target_kcal | number | TDEE adjusted by goal, with safety floor |
| protein_g / fat_g / carb_g | number | macro split |
| targets_computed_at | timestamp | when the cache was last refreshed |

(BMI is derived per `BodyMeasurement` — see below — not cached on the profile,
so the whole BMI trend is chartable.)

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
| bmi | number (derived) | computed from weight + profile.height_cm at write time; stored so the BMI trend is chartable |
| source | enum: manual / synced | room for future scale integration |

### HealthScreening (1-to-1 with UserProfile)
PAR-Q+ style readiness screen plus stored medical context. Drives the safety
disclaimer and intensity-prescription notes — see
[06 §8](06-health-calculations.md#8-health-readiness-par-q-style--medical-disclaimer).

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| profile_id | fk | |
| parq_answers | bool[7] | the 7 readiness questions |
| any_flag | boolean (derived) | true if any parq answer is yes → recommend clearance |
| conditions | text[] (tags), nullable | e.g. hypertension, cardiac, diabetes, pregnancy |
| medications | text[] (tags), nullable | affects intensity prescription (e.g. beta-blockers → RPE not HR) |
| cleared_by_physician | boolean | user acknowledgement / clearance state |
| screened_at | timestamp | |

### CalorieCheckin (time series, 1-to-many from UserProfile)
Phase-1 nutrition: one daily number vs the calorie target. Designed so a
future full food log rolls up into the same row (see
[06 §6](06-health-calculations.md#6-calorie-check-in-nutrition-phase-1)).

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| profile_id | fk | |
| date | date | |
| calories_consumed | int | the daily total the user logs |
| protein_g | int, nullable | optional protein number |
| target_snapshot_kcal | int | the calorie target on that day (so adherence stays accurate as targets change) |
| source | enum: manual / food_log | `food_log` reserved for the future itemized log |

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
