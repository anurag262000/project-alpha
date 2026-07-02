# Home Screen & Logging UX

## Home screen layout

- **Header**: date, current streak, activity/points ring (steps + points
  matrix from `ActivitySnapshot`, Google-Fit-ring style).
- **Today's Workout card**: pulled from the active `Program`'s `ProgramDay`
  for today, showing exercises in `order_index` order, each with its
  `target_sets × target_rep_min–target_rep_max`. Tapping the card opens the
  session.
- If no session is scheduled today (rest day / no active program), the card
  shows a rest-day state with an option to start an ad-hoc workout instead.

## Exercise execution screen

- Exercise name + media at top.
- **Set rows**, one per planned set: previous performance for this exercise
  shown as ghost text (e.g. "last time: 60kg × 8") so the user has a
  reference point without leaving the screen.
- Tapping a set row opens the **scroll-dial input** — the core interaction
  the user specified as keyboard-less and numeric.

### Scroll-dial input

Three independent scrollable wheels, matching the onboarding numeric input
pattern:

| Wheel | Range | Step |
|---|---|---|
| Weight | 0–300 kg (or lb) | configurable: 0.5 / 1 / 2.5, defaults to equipment-appropriate increment (e.g. 2.5kg for barbell, 1kg for dumbbell pairs) |
| Reps | 0–30 | 1 |
| RPE (optional, toggle to show/hide) | 6–10 | 0.5 |

Wheels default to the last logged value for that exercise/set position, so a
straight-sets session requires zero scrolling on repeat sets — the user just
confirms. Confirming a set advances to the next set row automatically.

## Rest timer

- Auto-starts when a set is marked complete.
- Default duration varies by exercise type (longer for compounds, shorter
  for isolation) — configurable per exercise in a future settings pass, fixed
  defaults for MVP.
- Skippable / adjustable mid-countdown (+15s / -15s / skip).

## Set completion & flexibility

- Checkmark or swipe marks a set done, writing a `LoggedSet` row linked to
  the `ProgramExercise`.
- User can add an extra set beyond the plan (`program_exercise_id` still
  set, just more `LoggedSet` rows than `target_sets`).
- User can substitute the exercise mid-session (e.g. equipment taken at the
  gym) — logs against a different `exercise_id` while keeping
  `program_exercise_id` pointing at the original plan slot, so plan-vs-actual
  and substitution frequency are both visible later.

## Workout completion

On finishing the last exercise (or manually ending early):

- Summary screen: total volume moved (`Σ reps × weight`), duration
  (`completed_at - started_at`), sets completed vs. planned.
- Writes `WorkoutSession.completed_at` and sets `status = completed`
  (or `skipped` if ended without logging anything).
- Feeds directly into the adherence and progress calculations described in
  [01-data-model.md](01-data-model.md#derived-computed-not-stored-or-materialized-later-if-needed).
