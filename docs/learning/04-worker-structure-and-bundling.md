# Learning 04 — Worker structure & bundling (vs. AWS Lambda)

Written 2026-07-06, when we split `backend/auth-worker/src/` from one
`index.ts` into a modular tree. Answers a recurring question: "the dashboard
shows one 12k-line `index.js` — how do I know which function handles what, and
can I structure it like a Lambda-per-endpoint backend?"

---

## 1. The core difference from AWS Lambda

| | AWS Lambda | Cloudflare Worker |
|---|---|---|
| Unit of deploy | one function **per handler** | **one** function for the whole service |
| Routing | external (API Gateway maps path → function) | **in-code** router (Hono) maps path → handler, in-process |
| "Same URL, diff endpoints" | diff Lambdas behind one gateway | diff handlers inside one worker |
| Scaling unit | each function separately | the whole worker |

So on Workers there is **no gateway splitting traffic to separate function
deployments**. `wrangler deploy` uploads a *single bundled module*; the router
inside it dispatches each request. N endpoints = still 1 deployable.

## 2. Why the dashboard always shows one bundled `index.js`

`wrangler deploy` runs esbuild: it follows every `import` from `main`
(`src/index.ts`), inlines **your source files + all npm deps** (Hono,
drizzle-orm, `@libsql/client`), transpiles TS → JS, and emits one file. That
bundle is what Cloudflare runs and what the dashboard editor shows. **No source
layout changes this** — the deployed artifact is always one module.

> Corollary: **never edit code in the dashboard.** It's the build output; the
> next `wrangler deploy` overwrites it. The repo is the source of truth.

Two things *do* make the deployed code legible (both enabled here):
- **Section markers.** esbuild prefixes each inlined file with a comment —
  `// src/routes/auth.ts`, `// node_modules/hono/...`. So the bundle reads as
  labeled, grouped sections. Verify locally:
  `npx wrangler deploy --dry-run --outdir=dist && grep -n '^// src/' dist/index.js`.
- **Source maps.** `upload_source_maps = true` in `wrangler.toml` ships a
  `.map`, so runtime errors in the dashboard and `wrangler tail` point at
  `routes/auth.ts:30`, not a bundle line number.

## 3. The structure we adopted (one worker, many files)

Structure the **source** by responsibility; it still deploys as one worker.

```
src/
  index.ts        # entry: build Hono app, CORS, mount routers
  types.ts        # Bindings (shared env types)
  routes/
    auth.ts       # POST /signup, /login, /logout
    me.ts         # GET  /me
  lib/
    db.ts         # dbFor() — Turso/Drizzle client + DB type
    crypto.ts     # PBKDF2 hashing + token generation
    session.ts    # createSession, resolveUser, SESSION_TTL_SECONDS
    http.ts       # err() JSON helper
  schema.ts       # Drizzle tables (users, sessions)
```

`index.ts` is a thin wiring file: `app.route('/', authRoutes)`. Each router
module owns its endpoints and imports shared logic from `lib/`. **Add a new
resource** = new `routes/<name>.ts` + one `app.route()` line. This is the
idiomatic Cloudflare way to grow a worker.

## 4. When to split into *multiple* workers instead

Reach for a second worker only when a piece needs to **deploy or scale
independently** (e.g. a heavy sync job, a cron consumer). Then it's a new
directory under `backend/` with its own `wrangler.toml`, called from this one
via a **service binding** (worker-to-worker RPC). Our `backend/` already uses
one-folder-per-service, so that path is open. For auth's four endpoints, one
worker with the module tree above is the right call — don't split prematurely.

## 5. Debugging happens against the source, not the bundle

- **Local:** `npx wrangler dev` runs the source with source maps — stack traces
  and breakpoints land in `routes/auth.ts`, hot-reload on save.
- **Prod:** `npx wrangler tail` streams live logs/errors, mapped back to source.

The 12k-line bundle is never something you read or edit by hand.
