# project-alpha — mobile app

React Native (Expo) app. **Current state: working prototype.** Auth, the full
onboarding flow (with real persistence + computed targets), and workout
logging run against real databases. Program generation (split generator) and
the home/progress screens are still mock UI.

## Run it

Requires Node 18+ and the Expo tooling. The auth flow needs the worker
running — see the full 3-terminal recipe in the
[root README](../README.md#running-the-app-development).

```bash
cd mobile
npm install
EXPO_PUBLIC_API_URL=http://localhost:8787 npx expo start
```

Then press `a` (Android emulator), `i` (iOS simulator), or scan the QR code
with Expo Go. On an emulator, forward the ports if needed:
`adb reverse tcp:8081 tcp:8081 && adb reverse tcp:8787 tcp:8787`.

The app opens on a session gate: signed out → onboarding welcome (login link
for returning users); signed in without a local profile → onboarding; else →
home.

- **Onboarding:** Welcome → Basics (real form, live BMI) → Activity → Goal →
  Experience → Schedule → Equipment → Health (PAR-Q + injuries) → Plan ready
  (computed calorie/macro targets) → **Create account** (persists profile +
  first measurement + screening to SQLite).
- **Logging:** Start session → pick exercise (seeded library) → log sets
  (kg/reps/RPE, warm-up flag, "last time" ghost text) → Finish → real summary
  (volume/duration/sets/PRs). History on the logging tab.

## On-device database

SQLite via `expo-sqlite` + Drizzle. Migrations are generated `.sql` files in
`drizzle/` (bundled by Metro/Babel) and **applied on app launch**; the
exercise library seeds itself if empty. After editing `src/db/schema.ts`:

```bash
npx drizzle-kit generate
```

Inspect the live device DB with **Drizzle Studio**: with `expo start`
running, press `shift+m` → *expo-drizzle-studio-plugin*. Gotchas (Hermes
UUID, stale-DB migration errors) are written up in
[../docs/learning/03-expo-sqlite-drizzle.md](../docs/learning/03-expo-sqlite-drizzle.md).

## What's wired vs not

- **Wired:** auth (worker client `src/lib/api.ts`, session store, gate),
  onboarding persistence (`src/db/profileRepo.ts`), health calculations
  (`src/lib/health.ts`, unit-tested — `npm test`), workout logging
  (`src/db/workoutRepo.ts`), exercise seed (28 starter movements).
- **Mock UI still:** home dashboard (steps/today's-workout), program,
  library, progress screens; split generator (F3) not built — sessions are
  ad-hoc.
- **Interim interactions:** set entry is keyboard fields (scroll-dial is the
  target UX, see design-log 2026-07-04); DOB is a plain `YYYY-MM-DD` field.

## Layout

```
mobile/
├── app/                      expo-router routes
│   ├── _layout.tsx           providers + migrations + seed + drizzle studio hook
│   ├── index.tsx             session/profile gate (redirects)
│   ├── login.tsx             returning-user login
│   ├── onboarding/           welcome…ready + account (signup + persist)
│   └── (app)/                home, program, library, logging, summary, progress, profile
├── drizzle/                  generated .sql migrations + journal
├── src/
│   ├── theme/                tokens (light/dark) + ThemeProvider
│   ├── components/           ui kit (Glass, buttons, TextField…) + onboarding pieces
│   ├── lib/api.ts            auth-worker client
│   ├── lib/health.ts         BMI/BMR/TDEE/macros (pure, tested)
│   ├── db/                   client, schema, seed, profileRepo, workoutRepo
│   └── store/                auth session + onboarding draft (Zustand)
└── package.json
```

Design reference: [../design/design-system.md](../design/design-system.md)
and the HTML prototype in [../design/prototype/](../design/prototype/).
