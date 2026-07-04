# Learning 03 — On-device SQLite in the Expo app (drizzle + expo-sqlite)

Written 2026-07-04, when the mobile app's local database went from "planned"
to real (profile, measurements, screening, exercise library, workout
sessions, logged sets). What we learned wiring it, including three gotchas
that cost real debugging time.

---

## 1. The pieces and who does what

| Piece | Role |
|---|---|
| `expo-sqlite` | the actual SQLite database on the phone (one file per install: `project-alpha.db`) |
| `drizzle-orm/expo-sqlite` | typed query layer over it (`src/db/client.ts`) |
| `drizzle-kit generate` | dev-time: diffs `schema.ts` → numbered `.sql` migration files in `mobile/drizzle/` |
| `useMigrations` (drizzle) | run-time: applies pending `.sql` files **on app launch**, in `app/_layout.tsx` |

The flow: edit `schema.ts` → `npx drizzle-kit generate` → commit the new
`.sql` + updated `drizzle/migrations.js` → next app launch migrates itself.
There is no "migrate command" against a phone — the app *is* the migrator.

## 2. Bundling `.sql` files through Metro (the non-obvious wiring)

Metro doesn't know what a `.sql` file is, but `drizzle/migrations.js`
imports them. Two pieces make that work:

```js
// metro.config.js — let Metro resolve .sql as source
config.resolver.sourceExts.push('sql');

// babel.config.js — inline each .sql file's text as a string
plugins: [['inline-import', { extensions: ['.sql'] }], 'react-native-reanimated/plugin'],
```

(`babel-plugin-inline-import` is a devDependency. Reanimated's plugin must
stay **last** in the list.)

## 3. Gotcha #1 — Hermes has no `crypto.randomUUID`

`crypto.randomUUID()` exists in Node and browsers, **not** in the Hermes
runtime — every insert would crash with
`ReferenceError: Property 'crypto' doesn't exist`. Fix: `expo-crypto`'s
`randomUUID`. But a *top-level* `import 'expo-crypto'` in `schema.ts` then
breaks `drizzle-kit generate`, which imports the schema in plain Node where
the native module doesn't exist. The resolution is a lazy require inside the
default function — Node never calls it, Hermes does:

```ts
const newId = (): string => {
  const { randomUUID } = require('expo-crypto') as typeof import('expo-crypto');
  return randomUUID();
};
const uuid = () => text('id').primaryKey().$defaultFn(newId);
```

Same schema file now serves two runtimes.

## 4. Gotcha #2 — stale on-device DB vs regenerated migrations

If you regenerate migration history (new `0000_*.sql` with a different name)
while a device still has a DB created by the *old* history, `useMigrations`
tries to run the new `0000` on launch and dies with
`CREATE TABLE ... already exists`. Drizzle tracks applied migrations by
hash/journal, so a rewritten history looks brand new to an old database.

- **Dev fix:** wipe the app's data — in Expo Go that's
  `adb shell pm clear host.exp.exponent`.
- **Rule for later:** once anything real is on devices, migration history is
  append-only. Never regenerate `0000`; always add `0001, 0002, …`.

## 5. Gotcha #3 — surface migration failure, don't render past it

`useMigrations` returns `{ success, error }`. Render nothing until
`success`, and show `error.message` if it failed — that's exactly how gotcha
#2 was caught in seconds on the emulator instead of as a mystery crash five
screens later. The migration error screen in `_layout.tsx` is deliberate,
not placeholder.

## 6. Seeding reference data

The exercise library ships as code (`src/db/seed.ts`) and inserts on launch
**only if the table is empty** (`SELECT count(*)`), right after migrations
succeed. Idempotent-by-check is enough at 28 rows; when the full dataset
(F2) lands it should become a versioned seed (bump a `seed_version` in a
meta table) rather than "if empty".

## 7. Migration/schema planning notes (what we actually decided)

- **One initial migration.** All 11 tables (profile, body_measurement,
  health_screening, calorie_checkin, exercise, program, program_day,
  program_exercise, workout_session, logged_set, activity_snapshot) went
  into a single generated `0000` — there's no reason to stage migrations
  before first install.
- **Enums are `text` + a TS union** (`.$type<'fat_loss' | ...>()`), arrays
  are `text` with `{ mode: 'json' }`. SQLite has neither enums nor arrays;
  the type-safety lives in the app layer, which is fine local-only.
- **Plan vs actual stay separate tables** (`program_exercise` vs
  `logged_set`) per the data-model doc — this is what makes "last time"
  ghost text, adherence %, and PR detection cheap queries instead of
  archaeology.
- **The spec doc is still the source of truth** (`docs/01-data-model.md`);
  `schema.ts` implements it. When they drift, fix one deliberately and note
  it in the feature log.

## 8. Cheat sheet

```bash
cd mobile
npx drizzle-kit generate        # after editing src/db/schema.ts
npm run typecheck && npm test   # health.ts calc tests run in plain node
adb shell pm clear host.exp.exponent   # nuke on-device DB (dev only!)
```
