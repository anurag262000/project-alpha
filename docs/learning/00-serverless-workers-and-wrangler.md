# Learning 00 — Serverless, Cloudflare Workers, Wrangler & D1 (concepts)

The **concepts** guide: what these tools are, what they're for, and where else
they're used. Read this once before the hands-on deploy steps in
[01-deploy-auth-worker.md](01-deploy-auth-worker.md).

No commands here — this is the "what and why." The "how" is doc 01.

---

## 1. Serverless, in one paragraph

"Serverless" doesn't mean no servers — it means *you* don't manage them. You
upload a function; the platform runs it on demand, scales it up and down
automatically, and bills you only when it runs. No VM to patch, no capacity to
plan. Your job shrinks to "here is my code and its config."

---

## 2. Cloudflare Workers — what it is

A **Worker** is your code running on Cloudflare's global network. When a request
comes in, Cloudflare runs your Worker at the location nearest the user.

- It's not a container or VM. It's a **V8 isolate** — the same lightweight
  sandbox Chrome uses to run a browser tab. That's why it starts in ~5 ms
  instead of the seconds a VM can take.
- It runs a **web-standard runtime**: `fetch`, `Request`, `Response`,
  `crypto.subtle` (Web Crypto), `URL`, etc. — *not* the full Node.js API. (This
  is exactly why our `auth-worker` hashes passwords with Web Crypto PBKDF2
  instead of the Node-only `bcrypt`.)
- It's **global by default** — one deploy runs in 300+ cities, close to users,
  with no region to choose.

**What a Worker is good for:** fast request/response work — APIs, auth,
redirects, request transformation, serving/edge-caching content, webhooks. Our
auth service is a textbook fit.

**What it's *not* for:** long or heavy jobs (big video encodes, multi-minute
batch work, huge in-memory datasets). Those want a traditional server or
something like AWS Lambda / a container.

---

## 3. Wrangler — what it is, what it's for, where else it's used

**Wrangler is Cloudflare's official command-line tool (CLI) for its developer
platform.** If Workers is the runtime, Wrangler is how you build, run, ship, and
manage everything around it. Think of it the way you think of the `aws` CLI for
AWS, the `firebase` CLI for Firebase, or the `vercel` CLI for Vercel — one tool
that is your entry point to the whole platform.

We installed it as a devDependency, so we run it as `npx wrangler …`. Config
lives in `wrangler.toml`.

**What you use Wrangler for:**

| Task | Command (example) |
|---|---|
| Log in / authenticate | `wrangler login` |
| Run a Worker locally | `wrangler dev` |
| Deploy a Worker | `wrangler deploy` |
| Create/manage a D1 database | `wrangler d1 create …`, `wrangler d1 execute …` |
| Apply DB migrations | `wrangler d1 migrations apply …` |
| Manage secrets (API keys) | `wrangler secret put …` |
| Stream live production logs | `wrangler tail` |
| Scaffold a new project | `wrangler init` |

**Where else Wrangler is used** — it's not specific to our auth worker or even
to Workers. It's the single CLI for Cloudflare's whole developer platform:

- **Workers** — any serverless function (what we're using it for).
- **Pages** — deploy static sites / full-stack frontends.
- **D1** — serverless SQL (SQLite) databases.
- **KV** — a global key-value store (sessions, config, feature flags).
- **R2** — S3-compatible object storage (images, files, backups).
- **Durable Objects** — stateful coordination (chat rooms, live collaboration).
- **Queues** — background/async message processing.
- **Cron Triggers** — scheduled jobs.
- **Workers AI / Vectorize** — run models / vector search at the edge.
- **CI/CD** — the same `wrangler deploy` runs in GitHub Actions to ship on push.

So learning Wrangler now pays off well beyond this one service — it's the tool
for anything we build on Cloudflare later.

---

## 4. D1 — what it is

**D1 is Cloudflare's serverless SQLite database.** It's SQLite (the same engine
the mobile app uses on-device), hosted by Cloudflare and reachable from a
Worker.

- You don't manage a server or a connection pool.
- A Worker reaches it through a **binding** (see §6), not a connection string.
- Free tier is generous (see doc 01) — good for personal use and testing.

We chose D1 as a **first pick to test**, not a final decision (see ADR-001 in
[../07-architecture.md](../07-architecture.md)). If it doesn't hold up, we swap
it and update the ADR.

> **2026-07-04:** that swap happened — we moved to **Turso** (ADR-002) before
> first deploy. The concepts above still matter (D1 is the canonical example
> of a *binding*), but the database this project actually uses is Turso; see
> [02-turso-libsql-migration.md](02-turso-libsql-migration.md).

---

## 5. Workers vs AWS Lambda (if you know Lambda)

Same family — both are "serverless functions." The shape differs:

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

**Rule of thumb:** Lambda wins for heavy/long/big-memory jobs and deep AWS
integration; Workers win for fast, global request/response APIs — which is
exactly what auth is.

---

## 6. Bindings — how a Worker reaches resources

A Worker never imports a database or opens a socket to one. Instead you declare
a **binding** in `wrangler.toml`, and Cloudflare injects the resource onto
`env` at runtime:

```toml
[[d1_databases]]
binding = "DB"                # the name the code sees
database_name = "project-alpha-auth"
```

```ts
const db = drizzle(c.env.DB); // c.env.DB is the injected binding
```

Every Cloudflare resource works this way — D1, KV, R2, secrets are all bindings.
**Nothing is imported; everything arrives on `env`.** That's *why* our code has
no database URL or password anywhere.

---

## 7. The one idea that avoids most confusion: local ≠ remote

| | Runs where | Database |
|---|---|---|
| `wrangler dev` | your laptop (simulated edge) | **local** SQLite file in `.wrangler/` |
| `wrangler dev --remote` | real edge | **real** D1 |
| `wrangler deploy` | real edge (published) | **real** D1 |

Local and remote are **separate worlds with separate data**. A migration
applied locally does not exist remotely — you apply migrations to each side
independently (`--local` vs `--remote`). Forgetting this is the #1 first-timer
mistake. Doc 01 keeps them straight step by step.

---

## Next

→ [01-deploy-auth-worker.md](01-deploy-auth-worker.md) — the hands-on, do-this-
then-that deploy guide.
