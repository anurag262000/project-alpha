# Learning: deploying a Cloudflare Worker (with D1)

A reference for how we ship `backend/auth-worker/` to Cloudflare. Written as a
teaching doc — read top to bottom once, then use the **cheat sheet** and
**troubleshooting** sections as a quick reference later.

Status when written (2026-07-03): the worker is built and tested **locally**.
It has **not** been deployed to Cloudflare yet — that needs a Cloudflare
account (a human step). This doc is the plan for doing that.

---

## 1. The mental model

Three pieces:

- **Worker** — our code, run on Cloudflare's edge. No server to rent or keep
  running. Not a container/VM — a lightweight V8 *isolate* (same engine as
  Chrome), so it cold-starts in milliseconds and is cheap.
- **Wrangler** — the CLI that builds, runs, and deploys Workers. Config lives
  in `wrangler.toml`. We run it via `npx wrangler …` (installed as a
  devDependency in `backend/auth-worker/`).
- **D1** — Cloudflare's serverless SQLite. The Worker reaches it through a
  *binding*, not a connection string.

### If you know AWS Lambda: same family, different shape

Both are "serverless functions" — no server to manage, auto-scaling,
pay-per-use. If you get Lambda, you get the gist of Workers. The one-line
distinction:

> **Lambda is a serverless *server*** — a full runtime (Node/Python/…) that
> boots in one region per request.
> **A Worker is a serverless *edge function*** — a tiny V8 isolate already
> running in 300+ locations, near the user.

| | AWS Lambda | Cloudflare Worker |
|---|---|---|
| Runtime | full Node.js / Python / etc. | V8 isolate — web-standard APIs, **not** full Node |
| Cold start | 100 ms – seconds | ~5 ms, effectively none |
| Location | one region you pick | everywhere, auto near user |
| Limits | up to 15 min, up to 10 GB RAM | short CPU bursts, 128 MB |
| HTTP | usually needs API Gateway | built in — the Worker *is* the endpoint |
| Billing | request + wall-clock × memory | request + **CPU time only** (I/O wait not billed) |
| Cloud resources | AWS SDK + IAM (S3, DynamoDB…) | bindings on `env` (D1, KV, R2…) |

Why it matters for **our** worker:
- The web-standard (non-Node) runtime is why we hash passwords with **Web
  Crypto PBKDF2**, not `bcrypt` — bcrypt needs Node native bindings a Worker
  lacks. (On Lambda, bcrypt would just work.)
- HTTP is built in, so **Hono** slots right in and there's no API Gateway.
- Our endpoints are I/O-bound (they wait on D1), and Workers bill **CPU time,
  not wall-clock** — so that waiting is effectively free.

Rough rule: Lambda wins for heavy/long/big-memory jobs and deep AWS
integration; Workers win for fast, global request/response APIs — which is
exactly what auth is.

### The one idea that avoids most confusion: local ≠ remote

| | Runs where | Database |
|---|---|---|
| `wrangler dev` | your laptop (simulated edge) | **local** SQLite file in `.wrangler/` |
| `wrangler dev --remote` | real edge | **real** D1 |
| `wrangler deploy` | real edge (published) | **real** D1 |

Local and remote are separate worlds with **separate data**. A migration you
apply locally does **not** exist remotely. You apply migrations to each side
independently (`--local` vs `--remote`). Forgetting this is the #1 first-timer
mistake.

---

## 2. What you need (prerequisites)

- **Node.js** — already have it.
- **A Cloudflare account** — free. Sign up at dash.cloudflare.com. **No credit
  card required** for the free tier.
- **Wrangler** — already in the project (`npx wrangler`).

That's the whole list. Workers + D1 both have real free tiers (see §8).

---

## 3. Bindings — how the Worker reaches D1

A Worker can't `import` a database or open a socket to one. Instead you declare
a **binding** in `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"                    # the name our code sees
database_name = "project-alpha-auth"
database_id = "…"                 # the specific remote database
migrations_dir = "drizzle"        # where our .sql migrations live
```

At runtime Cloudflare injects that database as `c.env.DB`, which is exactly how
`src/index.ts` uses it:

```ts
const db = drizzle(c.env.DB);     // c.env.DB is the binding
```

Same pattern for every Cloudflare resource — KV, R2, queues, secrets are all
bindings. **Nothing is imported; everything arrives on `env` at runtime.** This
is why the code has no database URL or password anywhere.

> `database_id` is **not a secret** — it's just an identifier. It's safe to
> commit to git. Access is controlled by your Cloudflare account login, not by
> knowing the id.

---

## 4. Deploy walkthrough (first time)

Run all of this from `backend/auth-worker/`.

### Step 0 — install deps
```
npm install
```

### Step 1 — authenticate Wrangler with your account
```
npx wrangler login
```
Opens a browser, you approve, and Wrangler stores credentials locally. From now
on it acts on your Cloudflare account. (CI/servers use an API token via the
`CLOUDFLARE_API_TOKEN` env var instead of the browser flow.)

### Step 2 — create the real D1 database
```
npx wrangler d1 create project-alpha-auth
```
This creates the database **on Cloudflare** and prints a `database_id`. Copy it
into `wrangler.toml`'s `database_id` field (replacing the `REPLACE_ME…`
placeholder). This links the binding to that specific remote database.

*(Local dev already worked without this because local dev uses a file, not the
real D1. This step is only about the remote/production database.)*

### Step 3 — apply migrations to the **remote** database
```
npm run db:migrate:remote
# = wrangler d1 migrations apply project-alpha-auth --remote
```
This runs our generated SQL (in `drizzle/`) against the production D1, creating
the `users` and `sessions` tables there. Skipping this = a deployed worker that
500s on every query because the tables don't exist.

### Step 4 — deploy the worker
```
npm run deploy
# = wrangler deploy
```
Wrangler bundles `src/index.ts` and publishes it. On the **first** deploy it
asks you to register a free `workers.dev` subdomain (pick one, e.g.
`anurag`). It then prints the live URL, something like:
```
https://project-alpha-auth-worker.anurag.workers.dev
```

### Step 5 — point the mobile app at the deployed URL
The app reads `EXPO_PUBLIC_API_URL` (see `mobile/src/lib/api.ts`). Set it to the
deployed URL when running/building the app:
```
# mobile/.env
EXPO_PUBLIC_API_URL=https://project-alpha-auth-worker.anurag.workers.dev
```
Without it, the app falls back to `http://localhost:8787` (local dev).

### Step 6 — verify the live worker
```
curl -X POST https://…workers.dev/signup \
  -H 'content-type: application/json' \
  -d '{"email":"you@example.com","password":"password123"}'
```
Should return `201` with a token — same as our local smoke test.

**Redeploys later are just `npm run deploy`.** Steps 1–2 are one-time; step 3
only re-runs when you add a new migration.

---

## 5. Making schema changes after launch

1. Edit `src/schema.ts`.
2. `npm run db:generate` — drizzle-kit writes a new `.sql` migration file.
3. `npm run db:migrate:local` — apply to your local dev DB (test it).
4. `npm run db:migrate:remote` — apply to production.
5. `npm run deploy` — ship code that uses the new schema.

Migrations are additive files; Cloudflare tracks which have been applied, so
re-running `apply` only runs new ones.

---

## 6. Secrets (for the future — we have none yet)

Never put API keys or passwords in `wrangler.toml` (it's committed). Instead:
```
npx wrangler secret put SOME_API_KEY      # prompts, stores encrypted on CF
```
It arrives in code as `c.env.SOME_API_KEY`. For **local** dev, put the same
keys in `backend/auth-worker/.dev.vars` (already gitignored).

We don't use any secrets today — password hashing uses a per-user random salt,
no shared secret. If we later add, say, a "pepper" or email-provider key, this
is how.

---

## 7. Watching a live worker (observability)

```
npx wrangler tail        # live-stream logs/errors from the deployed worker
```
The Cloudflare dashboard also shows request counts, errors, and CPU time per
worker. `wrangler tail` is the fastest way to debug a 500 in production.

---

## 8. Free tier limits (as of writing — verify on the dashboard)

- **Workers (free):** ~100,000 requests/day.
- **D1 (free):** ~5 GB storage, ~5 M rows read/day, ~100 K rows written/day.

Plenty for personal use and testing. Cloudflare shows current usage in the
dashboard; treat these numbers as a ballpark, not a contract.

---

## 9. Environments (for the future)

You can run separate staging/production workers from one project with
`[env.production]` blocks in `wrangler.toml`, deployed with
`wrangler deploy --env production`. Not needed yet — one worker is fine — but
this is the mechanism when we want a staging DB separate from real users.

---

## 10. Command cheat sheet

```
# one-time
npx wrangler login                       # authenticate
npx wrangler d1 create project-alpha-auth # create remote DB → paste id into wrangler.toml

# schema / migrations
npm run db:generate                      # schema.ts → new .sql migration
npm run db:migrate:local                 # apply to local dev DB
npm run db:migrate:remote                # apply to production DB

# run / ship
npm run dev                              # local worker at http://localhost:8787
npm run deploy                           # publish to *.workers.dev
npx wrangler tail                        # live logs from the deployed worker
npx wrangler d1 execute project-alpha-auth --remote --command "SELECT * FROM users"
```

---

## 11. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `No migrations present at …/migrations` | Wrangler looks in `migrations/` but drizzle writes to `drizzle/` | `migrations_dir = "drizzle"` in `wrangler.toml` (already set) |
| Deployed worker 500s on every request | Tables never created remotely | `npm run db:migrate:remote` |
| `wrangler d1 create` fails / asks to log in | Not authenticated | `npx wrangler login` |
| App can't reach the API in production | `EXPO_PUBLIC_API_URL` not set | set it to the `workers.dev` URL and rebuild |
| Local dev works, prod doesn't (or vice-versa) | Migrated one side only | migrate the other side (`--local` **and** `--remote`) |
| Changed `EXPO_PUBLIC_*` but app ignores it | These inline at build time | restart the Expo bundler |

---

## 12. Where we are right now

- [x] Worker written, typechecks, **smoke-tested locally** (full signup →
      login → logout cycle passed).
- [x] Migration generated (`drizzle/0000_*.sql`) and applied to the **local**
      DB.
- [ ] `wrangler login` — needs your Cloudflare account.
- [ ] `wrangler d1 create` + paste `database_id`.
- [ ] `db:migrate:remote`.
- [ ] `wrangler deploy`.
- [ ] Set `EXPO_PUBLIC_API_URL` in the app.

The next hands-on step whenever you're ready: **§4, Step 1** (`npx wrangler
login`).
