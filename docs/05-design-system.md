# Design System

## Direction

Light, airy, premium **liquid glass**. Soft warm-gray canvas carrying faint
red/green ambient light, with frosted translucent white panels floating over
it. Depth comes from the glass material (blur + translucency + inset sheen),
not flat fills. Minimal line icons, generous rounding. **Near-black ("ink")
is the emphasis/selection color**; red and green are reserved strictly as
data signal.

The light navigation-UI reference informed only the *palette direction*
(light gray + white, black high-contrast selection, minimal outline icons) —
the surfaces themselves are liquid glass, not solid cards. The glass must sit
over colored ambient light to actually read as glass.

> Note: an earlier exploration used a dark charcoal + liquid-glass theme.
> That direction is archived below for reference — the light system above is
> canonical.

## Color meaning (the core rule)

The chrome is entirely grayscale. Color appears **only on data**, and only
two hues, each with fixed meaning — never decorative.

- **Ink `#16171A`** — selection, emphasis, primary action ("Start workout"),
  active nav, selected cards, scroll-dial center band.
- **Red / Drive `#FB2C36`** — active minutes, intensity, "last time" load,
  current-set marker, PRs.
- **Green / Progress `#10B981`** — done, success, positive trend, goal-met,
  "Log set".

If a color isn't communicating "drive/intensity" or "progress/done," it's a
gray.

## Tokens (light — canonical)

| Role | Token | Value |
|---|---|---|
| Canvas | `mist` | `#EAEAEC` |
| Card surface | `card` | `#FFFFFF` |
| Hover / inset | `cloud` | `#F2F2F4` |
| Emphasis | `ink` | `#16171A` |
| Text primary | `text-primary` | `#1A1B1E` |
| Text secondary | `text-secondary` | `#6C6F76` |
| Text muted | `text-muted` | `#9CA0A6` |
| Text disabled | `text-disabled` | `#C4C6CB` |
| Hairline | `border` | `rgba(0,0,0,0.05–0.07)` |
| Accent · Drive | `red` | `#FB2C36` (text-on-white variant `#D81E28`) |
| Accent · Progress | `green` | `#10B981` (text-on-white variant `#0A8F63`) |

Accent tints: red `rgba(251,44,54,0.12–0.18)`, green
`rgba(16,185,129,0.12–0.18)`.

## Material (the liquid-glass recipe)

Surfaces are frosted glass, not solid cards. They need colored ambient light
behind them to read as glass.

```
background: rgba(255,255,255,0.50);          /* 0.45–0.55 depending on contrast need */
backdrop-filter: blur(28px) saturate(1.5);
border: 1px solid rgba(255,255,255,0.60);    /* light catches the top edge */
border-radius: 18px;                          /* 16–18 cards, 20–22 panels/nav */
box-shadow: 0 8px 24px rgba(30,32,40,0.09), inset 0 1px 1px rgba(255,255,255,0.85);
```

- **Ambient light**: soft blurred red/green blobs (opacity ~0.10–0.13,
  `blur(50px)`) placed behind the glass on each screen so the frost picks up
  color. Red biased toward action/intensity zones, green toward
  progress/summary zones.
- Canvas: `mist #E6E7EA`.
- Solid (non-glass) elements — ink primary button, red/green buttons,
  selected ink cards, the scroll-dial center band — stay opaque for contrast
  and affordance; only *surfaces/containers* are glass.
- Ink primary button shadow: `0 8px 20px rgba(20,20,25,0.24)`.
- Green button shadow: `0 8px 20px rgba(16,185,129,0.30)`.
- Bottom nav: glass bar floated 12px off the bottom edge, radius 20px.

Note: Figma supports this via a **layer/background blur** effect on a
semi-transparent white fill; the ambient blobs become blurred ellipses on a
layer beneath. Native RN implementation uses `expo-blur` (`BlurView`) or
`@react-native-community/blur` for the frosted surfaces.

## Typography

- Font: **Inter** (ship in-app), SF Pro / system fallback.
- Display 25 / 700 (screen titles, big numbers) · letter-spacing −0.02em
- Heading 17 / 600
- Body 14 / 400 · secondary copy in `text-secondary`
- Label 11 / 500 · uppercase · letter-spacing 0.08em · `text-muted`
- Tabular figures for timers and stats.

## Shape & spacing

- Radius: 13–15px controls, 16–18px cards, 20–22px panels/nav, 30px screen,
  38px device.
- Full borders only when rounding; cards use shadow, not border.

## Component patterns

- **Primary action** — solid ink (black) pill, white text, soft shadow.
- **Confirm/done action** — solid green (e.g. Log set).
- **Secondary** — white card surface, secondary text.
- **Segmented control** — white track (shadowed), selected segment = ink pill
  with white text (echoes the reference's black selection pill).
- **Selectable card (onboarding)** — selected = ink card, white text, colored
  icon (e.g. red flame on Fat loss); unselected = white cards.
- **Scroll-dial** — three white wheels (weight / reps / RPE); an **ink center
  band** marks the editing row, selected value white on ink, neighbors fade
  muted → disabled. Caption "scroll to dial · no keyboard."
- **Activity rings** — outer green (steps), inner red (active minutes), track
  in `#EEEEF0`.
- **Set-progress dots** — done = green, current = ink, upcoming = light gray.
- **Charts** — trend line green when positive; volume bars color only the 1–2
  highlighted muscles (red/green), rest neutral gray.

## Reviewed screens (v0 mockups)

Home · in-workout logging (scroll-dial) · onboarding goal-select · progress —
rendered in the light system for review; not yet built as code.

## Open design questions

- Dark mode: possible later as a secondary theme (the charcoal exploration
  below is a starting point), but light is the primary/shipping theme.
- Motion: dial haptics + spring snap on wheels, ring fill animation on home —
  specced when we build.

---

## Archived: dark "liquid glass" exploration

The initial direction, kept for reference / possible dark mode.

- Base `#0A0B0D`–`#0C0D0F` ink, elevated `graphite #16181C`.
- Glass surfaces: `linear-gradient(160deg, rgba(255,255,255,0.09),
  rgba(255,255,255,0.03))`, border `rgba(255,255,255,0.10)`, inset top
  highlight, `backdrop-filter: blur(20px)`.
- Accents: red `#FF3B47`, green `#2DD576` (brighter, tuned for dark bg).
- Emphasis carried by the red accent rather than black; scroll-dial center
  band was red.
