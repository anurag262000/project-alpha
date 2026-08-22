# Design Log

Chronological record of design decisions and their reasoning. Newest at top.
When the design changes, add an entry here — this is the "why" behind
[design-system.md](design-system.md) and the [prototype](prototype/).

---

## 2026-08-22 — Post-onboarding handoff: four stages, two sheets

Designed as a clickable spec in
[prototype/plan-handoff.html](prototype/plan-handoff.html) (split · day ·
exercise · accept · Today).

- **Depth is sheets, not routes.** A day opens as an 87% bottom sheet over the
  plan; an exercise opens as a 92% sheet over that. The plan — and its "Use
  this plan" button — stays one swipe behind at every depth, so browsing three
  days and then accepting never touches a back-stack. This is what makes the
  "go look, come back, accept" loop work.
- **Accept is available from second one.** The detail sheets are optional
  depth, never sequential steps: nothing between onboarding and Today is a
  gate. Confirmation is a toast ("Plan saved · first session Monday, Upper A"),
  not a congratulations screen standing between intent and action.
- **The exercise sheet answers three questions in a fixed order** — what is
  this, how do I do it, why is it in *my* plan — so the screen is learnable.
  Six blocks: demo loop, one-line definition, your prescription (sets/reps/
  RPE/rest as tabular figures), four cues max, two mistakes, muscle map,
  generator reasoning. Under ~120 words of prose visible; the rest is numbers,
  chips and the map. Prescription sits *above* the generic how-to: the app
  talking about you outranks library content.
- **Red earns its second text use.** Form warnings ("elbows flared to 90°")
  are drive/intensity, so they get red; sets-by-muscle bars stay neutral grey
  with the lead muscle in ink, because volume is neither drive nor progress.
- **A null `mediaUrl` drops the demo tile entirely** rather than rendering a
  broken frame — the muscle map carries the block on its own. This sheet is
  the reason to finish the free-exercise-db import: `instructions` and
  `mediaUrl` stop being metadata here and become the content.
- **Today's first run re-introduces the plan** instead of pretending
  onboarding never happened: rings, then the plan name + week strip with today
  marked, then real exercise rows, then the energy card, then one primary
  action that is correct on a rest day too ([docs/05 §4](../docs/05-app-structure.md)).

## 2026-08-22 — One dial, one unit tab

- **Height is dialled, not typed.** It was the odd one out: a keyboard field
  sitting between a calendar and a wheel. It now opens the same sheet — a
  single column of centimetres, or feet and inches side by side. Nothing on
  the screen asks for the keyboard any more, which is the point of the step:
  four taps and a scroll, no typing.
- **The unit toggle has one home.** Compact `cm/ft` and `kg/lb` tabs sit
  inline on their field rows, so the unit is visible without opening
  anything, and switching it doesn't cost a sheet. That paid for deleting the
  weight sheet's full-width Kilograms/Pounds control and its KG/GRAMS column
  captions — the sheet is now wheels and Done. Tenths read `.0`–`.9` rather
  than as grams, which needed a caption to be legible at all.
- **The calendar stopped resizing.** Months span four to six week-rows, so
  paging changed the sheet's height under your thumb. The grid now always
  draws six rows; empty ones are blank. A picker that moves while you aim at
  it is worse than one with a little dead space.
- **The two dial columns lean into each other.** Each column was centred in
  its own half, so `5′` and `9″` sat at opposite ends of the selection band
  and read as two separate numbers. The left column is now right-aligned and
  the right one left-aligned, 28dp apart — one value, centred, whichever unit
  is showing. (18dp first; at the selected row's 26pt the two halves collided.)

- **The two plain rows lost weight.** Sex and "Weight is" were taller than
  every labelled field around them; with a compact segmented and 46dp of
  minimum height they line up with the rest.

## 2026-08-21 — Brand mark lands; form keeps its labelled fields

- **Real logo in place of the placeholder.** `mobile/assets/main.svg` — a
  glass squircle carrying an "F" whose lower arm becomes an ascending pulse,
  with the drive-red signal dot — is now the app icon and the splash. It reads
  as the design system in miniature: near-black glass, one red accent, no
  decoration. Rendered to PNG with headless Chrome; the layers are generated
  from the one SVG (full icon for iOS, mark-only foreground plus full-bleed
  gradient background for Android's adaptive mask, mark-only for the splash),
  so the source of truth stays a single vector file.
- **Fixed a rendering bug in the mark.** Both bars of the "F" are perfectly
  horizontal, giving them a zero-height bounding box; `mark-grad` used the
  default `objectBoundingBox` units, which the SVG spec makes degenerate in
  that case, so renderers dropped both elements and the logo came out as an
  "L". The gradient is now `userSpaceOnUse` across the mark's box — which also
  gives one continuous sheen instead of restarting per path.
- **The labelled-field form stays.** The settings-style row list from the
  entry below was reverted at the client's call: uppercase label above each
  input on its own soft surface is the established form language here, and
  compactness alone wasn't worth trading it for. The behavioural fixes it came
  with all survive — the dial opens from its field, cm/ft sits inline, sheets
  are opaque, and the step still fits without scrolling (~710dp on a 960dp
  screen). `Row`/`FieldGroup` were deleted rather than left lying around.

## 2026-08-21 — About you: one screen, pickers in sheets

Revision of the same day's input work below, after seeing it on a device.

- **The step now fits without scrolling** (~614dp of content on a 960dp
  screen). The five inputs stopped being five floating surfaces separated by
  gaps and became one glass panel of hairline-separated rows (`FieldGroup` +
  `Row`) — label left, control right. Grouping is what bought the space back:
  four gaps, four borders and four stacked labels disappear, and a fixed row
  height makes the stack scan as one list instead of five objects.
- **The weight dial moved into a bottom sheet, opened by tapping the row.**
  Inline, it was permanently occupying ~330dp for a value that gets set once,
  and — being a vertical scroller inside a vertical page — it swallowed the
  drag, so the screen couldn't be scrolled past it. Out of the page, that
  conflict cannot happen at all. The row shows the value; the wheels appear
  only while editing.
- **Unit toggles no longer get their own line.** cm/ft sits inline in the
  height row; kg/lb moved into the weight sheet, where the choice is made in
  the same place as the value. A unit switch is a modifier on a field, not a
  field of its own, and it should not cost a row.
- **Sheets are the opaque `card` surface, not glass.** The calendar was
  translucent over the ambient glow and genuinely hard to read. This isn't a
  departure from the material: design-system.md already reserves glass for
  containers and makes anything needing contrast and affordance solid. Added a
  `card` token (`#FFFFFF` light, `#16181C` dark).
- Copy: "How sure is that weight?" → **"Weight is"** with Estimated/Measured,
  which reads as the sentence it completes and fits on one line.

## 2026-08-21 — Onboarding inputs + real ambient glow + app icon

- **Ambient blobs now actually diffuse.** The prototype's blobs are
  `filter: blur(55px)` at 12–18% opacity; React Native has no such filter, so
  the app was drawing hard-edged 12%-opacity circles — a visible disc, not a
  glow. Replaced with a `react-native-svg` radial gradient that fades to
  transparent (`Glow` in `mobile/src/components/ui.tsx`), which is the same
  optical result without an offscreen blur pass. Peak opacity is a theme token
  (`glowOpacity`: 0.30 light / 0.38 dark) — higher than the old flat value
  because a gradient's average opacity is far below its centre.
- **Date of birth is a calendar, not a typed `YYYY-MM-DD` string** (closing the
  polish item flagged on 2026-07-04). Custom glass month grid in a modal rather
  than the OS date dialog: the native picker can't be themed, and a DOB needs
  fast year jumps, which the month/year spinner pair gives. Future dates are
  disabled; the view opens 25 years back so nobody pages through 300 months.
- **Height accepts feet + inches**, switchable with the same `Segmented`
  control used elsewhere. Centimetres stay the single stored unit — imperial is
  a display/entry mode only, converted on the way in — so nothing downstream
  (BMI, BMR, the split generator) has to know a unit exists.
- **Weight is the first real scroll dial** — two snapping wheels (whole + a
  fraction column of grams in kg, tenths in lb) under the prototype's ink
  selection band, with kg/lb switching. Same reasoning as height: kilograms are
  what get stored. This is the dial component F5's logging spec has been
  waiting on; the stepper there can adopt it once it's proven here.
- **The app finally has an icon.** Ink square, the welcome screen's
  lightning-bolt mark, and the red/green ambient glow of the app itself, so the
  launcher matches the product. Placeholder-grade in the sense that it's
  generated geometry, not a drawn logo — replace when there's a real mark.
  Android needs the glow as its own `adaptiveIcon.backgroundImage` layer: it
  ignores `icon.png` and composites the foreground over the background, so with
  only a `backgroundColor` the mark lands on flat ink and the glow is lost. The
  background layer's glow centres are pulled inward, since the adaptive mask
  crops roughly the outer 18% of the canvas.

## 2026-07-04 — Functional logging + real-data screens (interim interactions)

- **Set logging is keyboard-entry for now, not the scroll-dial.** The dial
  (three inertial wheels, no keyboard) needs a custom gesture component to
  feel right; a half-good dial is worse than honest text fields. The dial
  remains the target interaction (F5 requirement unchanged) — the current
  three numeric fields (KG / Reps / RPE) + warm-up chip are a placeholder
  with the same information design.
- Exercise selection is a full-screen modal list (name + muscle + difficulty)
  — fine at 28 seed exercises, will need search/filter when the full library
  lands (F2).
- Screens now render **real data instead of mock copy**: plan-ready shows the
  actual computed targets, summary shows the session's real volume/duration/
  sets/PRs, profile shows the signed-in email, latest weight, height, and
  workout count. Mock-only rows that had no backing feature (Health Connect
  "Connected", Reminders, Export data) were removed from Profile rather than
  shipped as dead UI; they return when their features exist.
- Onboarding Basics became a real form (DOB / height / weight text fields with
  validation + live BMI card). Date input is a plain `YYYY-MM-DD` field for
  now — a proper date picker is a later polish item.

## 2026-07-02 — Full screen set + light/dark modes

- Expanded the prototype from 4 screens to the full set: all onboarding steps
  (welcome, basics, goal, experience, schedule, equipment, plan-ready) and app
  screens (home, program, library, logging, summary, progress, profile).
- Added a **dark mode** alongside light, driven by CSS variables.
  - Dark reuses the archived charcoal-glass palette (ink base, brighter red
    `#FF3B47` / green `#2DD576` tuned for dark).
  - **Key decision:** the neutral "ink" emphasis *inverts* in dark mode — the
    primary button, selected cards, and scroll-dial band become a light
    high-contrast surface instead of black, because black emphasis disappears
    on a dark canvas. Red/green stay saturated as signal in both modes.
- Rationale: user wants both modes shipped; the app should feel premium in a
  bright gym and comfortable in a dark one.

## 2026-07-02 — Material: light liquid glass (final)

- User clarified the light navigation-UI reference was inspiration for the
  **palette direction only** (light gray + white, black high-contrast
  selection), not for flat solid cards. The surfaces themselves should be
  **liquid glass**.
- Final material: frosted translucent white panels (white 45–55% + blur +
  inset top sheen) over a soft-gray canvas carrying faint red/green ambient
  light. The glass only reads as glass because there's colored light behind
  it to refract — over flat white it looked like plain cards, which was the
  trap the previous iteration fell into.

## 2026-07-02 — Pivot to light theme

- User moved away from the dark charcoal direction toward a lighter gray/white
  theme, referencing a light floating-panel navigation UI (white cards on soft
  gray, black selection pill, minimal outline icons).
- Adopted: mist-gray canvas `#E6E7EA`, ink black `#16171A` as the
  emphasis/selection color, red/green demoted to strictly data signal so the
  chrome stays grayscale.

## 2026-07-02 — Initial direction: dark charcoal + liquid glass

- First exploration per user's ask: premium, charcoal near-black base,
  translucent "liquid glass" surfaces, hints of bold red and green for
  highlights.
- Red `#FF3B47` = drive/intensity, green `#2DD576` = progress/done. Everything
  else monochrome. This later became the basis for dark mode.
- Archived in the dark-mode section of [design-system.md](design-system.md).

## Standing design principles

- **Two signal colors only.** Red = drive/intensity/active/PR. Green =
  progress/done/success. If a color isn't saying one of those, it's a gray.
- **Emphasis is neutral, high-contrast.** Ink black in light, inverted light
  in dark. Never use red/green as a generic "primary" color.
- **Depth from material, not decoration.** Frosted glass + soft ambient light,
  not heavy borders or drop shadows everywhere.
- **Numbers are the hero.** Big tabular figures; scroll-dial input, no keyboard
  during a workout.
