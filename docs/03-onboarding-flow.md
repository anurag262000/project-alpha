# Onboarding Flow

## Ordering principle

Ask for identity/measurement data first (needed as a baseline before anything
else makes sense), then goal (because it reframes how later questions should
be interpreted), then the constraints that gate the algorithm
(availability/equipment), and exceptions (injuries) last since they're
filters applied on top of an otherwise-complete picture.

## Screens

### 1. Welcome
Brief framing of what the app does and that it will ask a few questions to
build a program — sets expectation that this isn't just a tracker.

### 2. Basic info
- Sex (for volume/heuristic defaults)
- Date of birth
- Height (scroll-dial input, cm/ft-in toggle)
- Weight (scroll-dial input, kg/lb toggle)
- **Estimated vs. Measured** toggle on weight — required field, but honesty
  about precision is captured explicitly, per the user's original ask, so
  the algorithm and progress charts can weight early data appropriately.

### 3. Optional detailed measurements (skippable)
Waist / chest / arm measurements. Explicitly optional — skipping doesn't
block program generation, just means fewer chart dimensions later.

### 4. Goal
Single-select: fat loss / muscle gain / recomp / general fitness. One
required answer — this is the single input with the most influence over
rep ranges and volume bias (see [02-split-generator-logic.md](02-split-generator-logic.md)).

### 5. Experience level
new / under 1 year / 1–3 years / 3+ years of consistent resistance training.
Self-reported; drives whether the generator biases toward MEV or MAV and
which split templates are eligible.

### 6. Availability
- Days per week (multi-select specific weekdays, not just a count — lets the
  generator pin `ProgramDay.weekday` directly)
- Session length (scroll-dial, minutes)

### 7. Equipment access
home_minimal / home_full / gym — single select. Directly filters the
`Exercise` pool in Step 3 of the generator.

### 8. Injuries / limitations (optional)
Checklist of common areas (shoulder, lower back, knee, wrist, hip, elbow)
plus free-text notes. Optional but flagged clearly as affecting exercise
selection — skipping just means no exclusions applied.

### 9. Review summary
Single screen recapping all entered values with edit-in-place links back to
each screen — no silent assumptions, user sees exactly what will be fed into
generation before it runs.

### 10. Program generation
Loading state while the split-generator runs, followed by a short explanation
screen: which template was chosen and why (e.g. "4 days/week, 1+ year
experience → Upper/Lower with strength/hypertrophy split"), before handing
off to the Home screen with Day 1 populated and ready to log.

## Input pattern note

All numeric entry (height, weight, session length) uses the scroll-dial
component from the start of onboarding, so the user learns the interaction
pattern before reaching in-workout logging, where the same component is used
for weight/reps/sets (see [04-home-logging-ux.md](04-home-logging-ux.md)).
Consistency here is deliberate — one interaction to learn, reused everywhere.

## Validation

- Required: sex, DOB, height, weight, goal, experience, ≥1 day/week,
  session length, equipment access.
- Optional: detailed measurements, injuries/limitations.
- No field blocks progress except the required set above — optional fields
  degrade gracefully (fewer chart dimensions or no exclusions), they never
  block generation.
