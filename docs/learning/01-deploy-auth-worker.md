# Learning 01 — Deploying the auth worker (step by step)

The **hands-on** guide: do this, then this. For the "what are these tools"
background, read [00-serverless-workers-and-wrangler.md](00-serverless-workers-and-wrangler.md)
first.

> **✅ 2026-07-06 — DEPLOYED.** The worker is now live at
> `https://project-alpha-auth-worker.projectalphaauth.workers.dev`
> (workers.dev subdomain: `projectalphaauth`). Hosted Turso DB migrated,
> all four endpoints smoke-tested in production (signup 201, duplicate 409,
> login + `/me` 200, bad password / no-token 401). The app's `mobile/.env`
> points `EXPO_PUBLIC_API_URL` at that URL. Redeploys are just
> `npx wrangler deploy`. See "What actually happened" at the bottom for the
> steps that differed from the plan below.

Status when written (2026-07-03): the worker is built and **tested locally**
(full signup → login → logout cycle passed). It has **not** been deployed to
Cloudflare yet — that's the human step below. Run everything from
`backend/auth-worker/`.

> **⚠️ 2026-07-04 update:** the database moved from D1 to **Turso** (ADR-002)
> before first deploy. Steps 2–3 below (D1 create + `wrangler d1 migrations`)
> are **superseded** — use the migration + deploy path in
> [02-turso-libsql-migration.md](02-turso-libsql-migration.md) §6–7 instead.
> Steps 0–1 (deps, `wrangler login`) and 4–6 (deploy, point the app, verify)
> still apply as written.

---

## Prerequisites

- **Node.js** — already installed.
- **A Cloudflare account** — free, at dash.cloudflare.com. **No credit card**
  for the free tier.
- **Wrangler** — already in the project (`npx wrangler`).

---

## The deploy path (first time) — in order

### Step 0 — install deps
```
cd backend/auth-worker
npm install
```

### Step 1 — authenticate Wrangler
```
npx wrangler login
```
Opens a browser; you approve; Wrangler stores credentials locally. One-time per
machine. (CI uses a `CLOUDFLARE_API_TOKEN` env var instead of the browser flow.)

### Step 2 — create the real D1 database
```
npx wrangler d1 create project-alpha-auth
```
Creates the database **on Cloudflare** and prints a `database_id`. Paste it into
`wrangler.toml` (replace the `REPLACE_ME…` placeholder). This links the `DB`
binding to that specific remote database.

> Local dev already worked without this because local dev uses a file, not the
> real D1. This step is only about the remote/production database.
> `database_id` is **not a secret** — safe to commit.

### Step 3 — apply migrations to the **remote** database
```
npm run db:migrate:remote
# = wrangler d1 migrations apply project-alpha-auth --remote
```
Runs our generated SQL (`drizzle/`) against production D1, creating the `users`
and `sessions` tables there. Skip this and the deployed worker 500s on every
request because the tables don't exist.

### Step 4 — deploy the worker
```
npm run deploy
# = wrangler deploy
```
Bundles `src/index.ts` and publishes it. First deploy asks you to register a
free `workers.dev` subdomain (pick one). It then prints the live URL, e.g.:
```
https://project-alpha-auth-worker.<you>.workers.dev
```

### Step 5 — point the mobile app at the deployed URL
The app reads `EXPO_PUBLIC_API_URL` (see `mobile/src/lib/api.ts`):
```
# mobile/.env
EXPO_PUBLIC_API_URL=https://project-alpha-auth-worker.<you>.workers.dev
```
Without it, the app falls back to `http://localhost:8787` (local dev). Restart
the Expo bundler after changing it — `EXPO_PUBLIC_*` inlines at build time.

### Step 6 — verify the live worker
```
curl -X POST https://…workers.dev/signup \
  -H 'content-type: application/json' \
  -d '{"email":"you@example.com","password":"password123"}'
```
Expect `201` + a token — same as the local smoke test.

**Redeploys later are just `npm run deploy`.** Steps 1–2 are one-time; step 3
only re-runs when you add a new migration.

---

## Changing the schema after launch

1. Edit `src/schema.ts`.
2. `npm run db:generate` — drizzle-kit writes a new `.sql` migration.
3. `npm run db:migrate:local` — apply to local dev DB, test it.
4. `npm run db:migrate:remote` — apply to production.
5. `npm run deploy` — ship code using the new schema.

Cloudflare tracks which migrations ran, so re-running `apply` only runs new ones.

---

## Secrets (for the future — we have none yet)

Never put API keys/passwords in `wrangler.toml` (it's committed). Instead:
```
npx wrangler secret put SOME_API_KEY   # stored encrypted on Cloudflare
```
Arrives in code as `c.env.SOME_API_KEY`. For **local** dev, put the same keys in
`backend/auth-worker/.dev.vars` (gitignored). We use no secrets today —
password hashing uses a per-user random salt, no shared secret.

---

## Watching a live worker

```
npx wrangler tail   # live-stream logs/errors from the deployed worker
```
The Cloudflare dashboard also shows requests, errors, and CPU time. `tail` is
the fastest way to debug a production 500.

---

## Free tier limits (ballpark — verify on the dashboard)

- **Workers (free):** ~100,000 requests/day.
- **D1 (free):** ~5 GB storage, ~5 M rows read/day, ~100 K rows written/day.

---

## Command cheat sheet

```
# one-time
npx wrangler login                        # authenticate
npx wrangler d1 create project-alpha-auth # create remote DB → paste id into wrangler.toml

# schema / migrations
npm run db:generate                       # schema.ts → new .sql migration
npm run db:migrate:local                  # apply to local dev DB
npm run db:migrate:remote                 # apply to production DB

# run / ship
npm run dev                               # local worker at http://localhost:8787
npm run deploy                            # publish to *.workers.dev
npx wrangler tail                         # live logs from the deployed worker
npx wrangler d1 execute project-alpha-auth --remote --command "SELECT * FROM users"
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `No migrations present at …/migrations` | Wrangler looks in `migrations/`, drizzle writes to `drizzle/` | `migrations_dir = "drizzle"` in `wrangler.toml` (already set) |
| Deployed worker 500s on every request | Tables never created remotely | `npm run db:migrate:remote` |
| `wrangler d1 create` fails / asks to log in | Not authenticated | `npx wrangler login` |
| App can't reach the API in production | `EXPO_PUBLIC_API_URL` not set | set it to the `workers.dev` URL and rebuild |
| Local works, prod doesn't (or vice-versa) | Migrated one side only | migrate the other side (`--local` **and** `--remote`) |
| Changed `EXPO_PUBLIC_*` but app ignores it | Inlines at build time | restart the Expo bundler |

---

## What actually happened (2026-07-06 deploy)

The real path, and where it differed from the plan above (which still assumed
D1). Turso replaced steps 2–3 — see [02-turso-libsql-migration.md](02-turso-libsql-migration.md) §7.

1. **Migrate the hosted DB** (no wrangler login needed — drizzle-kit talks to
   Turso directly with the token in `backend/.env`):
   ```
   cd backend/auth-worker && npx drizzle-kit migrate
   ```
   `.env` must point `TURSO_DATABASE_URL` at the **hosted** `libsql://…turso.io`
   URL with `TURSO_AUTH_TOKEN` set (not the local `turso dev` server). The
   package.json script is `npm run db:migrate` — there is no `db:migrate:remote`
   script (that name in the cheat sheet below is stale D1 wording); local vs
   remote is decided by what `.env` points at, per doc 02 §6.
2. **`npx wrangler login`** — browser OAuth, one-time per machine.
3. **Set the production secret** (pipe it in so it never hits the terminal):
   ```
   grep '^TURSO_AUTH_TOKEN=' ../.env | cut -d= -f2- | npx wrangler secret put TURSO_AUTH_TOKEN
   ```
   First `secret put` also **creates the worker shell** on Cloudflare.
4. **`npx wrangler deploy`.** ⚠️ **New gotcha not in the plan:** a brand-new
   account has no `workers.dev` subdomain, so the *first* deploy must register
   one — and that prompt is interactive. A non-interactive `wrangler deploy`
   (e.g. run by the agent) uploads the code but then **errors** at the publish
   step. Fix: run `npx wrangler deploy` yourself in a terminal, answer **yes**
   to "register a workers.dev subdomain," and pick a name (we chose
   `projectalphaauth`). Subsequent deploys are non-interactive and fine.
5. **Smoke-test the live URL** with the curls in doc 02 §7 — all four endpoints
   passed.
6. **Point the app:** `mobile/.env` →
   `EXPO_PUBLIC_API_URL=https://project-alpha-auth-worker.projectalphaauth.workers.dev`
   (gitignored; restart the Expo bundler after changing it).

## Deploy checklist — DONE

- [x] Worker written, typechecks, **smoke-tested locally**.
- [x] Migration generated (`drizzle/0000_*.sql`) and applied to the local DB.
- [x] `npx drizzle-kit migrate` against the **hosted** Turso DB.
- [x] `npx wrangler login`.
- [x] `npx wrangler secret put TURSO_AUTH_TOKEN` (also created the worker).
- [x] `npx wrangler deploy` (+ registered `projectalphaauth` subdomain).
- [x] Production smoke test (signup/login/me/failures).
- [x] Set `EXPO_PUBLIC_API_URL` in `mobile/.env`.
- [ ] Manual on-device test: create an account from the app on the emulator.
