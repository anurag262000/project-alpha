# project-alpha — mobile app

React Native (Expo) app. **Current state: UI prototype.** The onboarding
screens are built as reviewable UI; data persistence, the calculation wiring,
and the split generator are intentionally *not* connected yet — we'll agree the
architecture before wiring them.

## Run it

Requires Node 18+ and the Expo tooling.

```bash
cd mobile
npm install
npx expo start
```

Then press `a` (Android emulator), `i` (iOS simulator), or scan the QR code
with the Expo Go app on your phone.

The app opens on a **prototype launcher** — tap any screen to review it, and
use the light/dark toggle (top-right) to switch themes. Or walk the flow:
Welcome → Basics → Activity → Goal → Experience → Schedule → Equipment →
Health → Plan ready.

## What's wired vs not

- **Wired (UI):** theming (light/dark from `src/theme`), navigation
  (expo-router), all onboarding screens, selectable options / chips / day
  picker as local component state.
- **Parked (not connected):** `src/lib/health.ts` (BMI/BMR/TDEE/macros — pure
  functions, unit-tested), `src/db/schema.ts` (Drizzle SQLite), and
  `src/store/onboarding.ts`. These exist but the screens use static display
  values for now. Run the calc tests with `npm test`.

## Layout

```
mobile/
├── app/                      expo-router routes
│   ├── _layout.tsx           providers + Stack
│   ├── index.tsx             prototype launcher
│   └── onboarding/           the 9 onboarding screens
├── src/
│   ├── theme/                tokens (light/dark) + ThemeProvider
│   ├── components/           ui kit (Glass, buttons…) + onboarding pieces
│   ├── lib/health.ts         calculations (parked, tested)
│   ├── db/schema.ts          Drizzle schema (parked)
│   └── store/onboarding.ts   draft state (parked)
└── package.json
```

Design reference: [../design/design-system.md](../design/design-system.md)
and the HTML prototype in [../design/prototype/](../design/prototype/).
