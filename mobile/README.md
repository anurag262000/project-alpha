# project-alpha — mobile app

React Native (Expo) app. **Current state: UI prototype with auth wired.** The
onboarding screens are reviewable UI; data persistence, calculation wiring, and
the split generator are intentionally *not* connected yet. The exception is
**auth** — signup/login are wired to the Cloudflare `auth-worker` (see
[../backend/README.md](../backend/README.md)).

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
use the light/dark toggle (top-right) to switch themes.

- **Onboarding:** Welcome → Basics → Activity → Goal → Experience → Schedule →
  Equipment → Health → Plan ready → **Create account**. Returning users log in
  from Welcome → "I already have an account".
- **App:** Home, Program, Library, Logging (scroll-dial), Summary, Progress,
  Profile — with a floating glass bottom nav and contextual links (Home
  "Start workout" → Logging → Summary).

## What's wired vs not

- **Wired (functional):** **auth** — `src/lib/api.ts` (worker client),
  `src/store/auth.ts` (Zustand, session in `expo-secure-store`, hydrate on
  launch), and the account/login screens. Points at `EXPO_PUBLIC_API_URL` (or
  `localhost:8787` in dev).
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
│   ├── _layout.tsx           providers + Stack + auth hydrate-on-launch
│   ├── index.tsx             prototype launcher
│   ├── login.tsx             returning-user login
│   ├── onboarding/           welcome…ready + account (signup)
│   └── (app)/                home, program, library, logging, summary, progress, profile
├── src/
│   ├── theme/                tokens (light/dark) + ThemeProvider
│   ├── components/           ui kit (Glass, buttons, TextField…) + onboarding pieces
│   ├── lib/api.ts            auth-worker client (wired)
│   ├── lib/health.ts         calculations (parked, tested)
│   ├── db/schema.ts          Drizzle schema (parked)
│   ├── store/auth.ts         auth session store (wired)
│   └── store/onboarding.ts   draft state (parked)
└── package.json
```

Design reference: [../design/design-system.md](../design/design-system.md)
and the HTML prototype in [../design/prototype/](../design/prototype/).
