# Design Log

Chronological record of design decisions and their reasoning. Newest at top.
When the design changes, add an entry here — this is the "why" behind
[design-system.md](design-system.md) and the [prototype](prototype/).

---

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
