# Design System

## Direction

Premium, low-fatigue, gym-friendly. Charcoal near-black base with translucent
"liquid glass" elevated surfaces, and two — and only two — saturated accent
colors used strictly as signal.

## Color meaning (the core rule)

Everything is monochrome charcoal **except** red and green, which always carry
meaning. Never use them decoratively.

- **Red (Drive) `#FF3B47`** — active / push / intensity / current-set / PRs /
  primary "Start workout" action.
- **Green (Progress) `#2DD576`** — done / success / progress / goal-met /
  positive trend / "Log set".

If a color isn't communicating "in progress / drive" or "done / progress,"
it should be a gray.

## Tokens

| Role | Token | Value |
|---|---|---|
| Base canvas | `ink` | `#0A0B0D` – `#0C0D0F` |
| Elevated solid | `graphite` | `#16181C` |
| Glass surface | `glass` | `linear-gradient(160deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03))` |
| Glass border | `glass-border` | `rgba(255,255,255,0.10)` with inset top highlight `rgba(255,255,255,0.12)` |
| Hairline | `border` | `rgba(255,255,255,0.06–0.08)` |
| Text primary | `text-primary` | `#F4F5F7` |
| Text secondary | `text-secondary` | `#C7CCD2` |
| Text muted | `text-muted` | `#8A9098` |
| Text disabled | `text-disabled` | `#4E545C` |
| Accent · Drive | `red` | `#FF3B47` |
| Accent · Progress | `green` | `#2DD576` |

Accent tints for fills/backgrounds: red `rgba(255,59,71,0.10–0.18)`,
green `rgba(45,213,118,0.12–0.18)`.

## Liquid glass recipe

```
background: linear-gradient(160deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03));
border: 1px solid rgba(255,255,255,0.10);
box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 10px 30px rgba(0,0,0,0.45);
border-radius: 18px;
backdrop-filter: blur(20px) saturate(1.2);   /* where there's real content behind */
```

Ambient depth: subtle radial glows behind key screens — red glow top on the
active logging screen, green bottom-left elsewhere — kept under ~10% opacity.

## Typography

- Font: **Inter** (ship it in-app), with SF Pro / system fallback.
- Display 26 / 700 (big numbers, screen titles) · letter-spacing −0.02em
- Heading 17 / 600
- Body 14 / 400 · secondary copy in `text-secondary`
- Label 11 / 500 · uppercase · letter-spacing 0.08em · `text-muted`
- Numbers use tabular figures (`font-variant-numeric: tabular-nums`) for
  timers and stats so they don't jitter.

Note: the app brand intentionally uses 600/700 weights for display numbers —
heavier than a neutral UI, because "bold" is part of the requested feel.

## Shape & spacing

- Radius: 12–14px controls, 16–18px cards, 28px screen corners, 36px device.
- Full borders only when rounding (no rounded single-side accents).
- Bottom nav is a blurred glass bar; active tab icon in `text-primary`,
  inactive in muted gray.

## Component patterns

- **Primary action** — solid red, dark ink text, soft red glow shadow.
- **Confirm/done action** — solid green (e.g. Log set), same treatment.
- **Secondary** — glass or graphite surface, secondary text.
- **Segmented control** — graphite track, selected segment gets a
  `white 8%` fill.
- **Scroll-dial** — three glass wheels (weight / reps / RPE); a red center
  band marks the editing row, selected value full-white and large, neighbors
  fade to muted then disabled. Caption reminds "scroll to dial · no keyboard."
- **Activity rings** — outer green (steps), inner red (active minutes).
- **Charts** — line/trend in green when positive; volume bars keep only the
  1–2 highlighted muscles colored (red/green), the rest neutral gray.

## Reviewed screens (v0 mockups)

Home · in-workout logging (scroll-dial) · onboarding goal-select · progress.
Rendered for review in-session; not yet built as code.

## Open design questions

- Light mode: not planned for v1 (dark-only fits the premium/gym context) —
  revisit only if users ask.
- Motion: dial haptics + spring easing on wheel snap, ring fill animation on
  home — to be specced when we build, not mocked yet.
