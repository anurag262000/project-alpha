# Learning 02 — Turso (libsql): why we left D1, and how the worker talks to it

Written 2026-07-04, the day we migrated `backend/auth-worker` from D1 to
Turso (before ever deploying — the cheapest possible moment to switch).
Concepts first, then the hands-on. Supersedes the D1-specific parts of
[01-deploy-auth-worker.md](01-deploy-auth-worker.md) (steps 2–3 there).

---

## 1. What Turso and libsql are

- **libsql** is an open-source fork of SQLite, extended so it can run as a
  *server* — speaking HTTP/WebSocket — instead of only as an embedded file.
- **Turso** is the hosted service built on libsql: they run the server, you
  get a URL (`libsql://<db>-<org>.<region>.turso.io`) and an auth token.
- Same SQL dialect as SQLite/D1 → our Drizzle schema and generated
  migrations didn't change *at all* in the move. Only the client did.

## 2. Why we switched (ADR-002, short version)

Both D1 and Turso are free at our modeled scale; this was not a cost rescue.
The reasons, in order of weight:

1. **Free-cap shape.** Turso's caps reset **monthly** (500M row reads, 10M
   writes/mo) vs D1's **daily** caps. Our future sync design is one
   bundled write per user per day — a once-daily batch pattern fits a
   monthly budget better than a tight daily one.
2. **Lock-in hedge at zero cost.** D1 only exists inside Cloudflare.
   libsql speaks an open protocol and can even be self-hosted (`sqld`), so
   the exit door stays open.
3. **Timing.** The worker wasn't deployed yet — no data to move, no user to
   break. The switch cost ~40 lines of diff.

What we gave up: D1's zero-config native binding (see §4) and
`wrangler d1 migrations` (drizzle-kit replaces it, see §6).

## 3. How the connection model differs from D1

This is the key mental-model change:

| | D1 | Turso |
|---|---|---|
| Connection | **Binding** — platform injects `env.DB`, no credentials in your code | **Ordinary HTTPS client** — you construct it with a URL + token |
| Credentials | none (the binding *is* the auth) | `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` |
| Local dev | `wrangler dev` auto-provides a local SQLite | you run your own local server (`turso dev`) |
| Drizzle driver | `drizzle-orm/d1` | `drizzle-orm/libsql` + `@libsql/client` |

In the worker (`src/index.ts`):

```ts
import { createClient } from '@libsql/client/web';
import { drizzle } from 'drizzle-orm/libsql';

const dbFor = (env: Bindings) =>
  drizzle(createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN }));
```

**Gotcha:** import from `@libsql/client/web`, not `@libsql/client`. The
default entry point wants Node APIs (TCP sockets) that don't exist in the
Workers runtime; the `/web` build is pure `fetch`.

## 4. Where each config value lives (the four places)

This tripped us up, so write it down once:

| File | What goes in it | Committed? |
|---|---|---|
| `wrangler.toml` `[vars]` | `TURSO_DATABASE_URL` — the URL is not a secret | yes |
| **worker secret** (`wrangler secret put TURSO_AUTH_TOKEN`) | the token, for the **deployed** worker | no (lives in Cloudflare) |
| `backend/auth-worker/.dev.vars` | both vars for **`wrangler dev`** — ours points at the *local* `turso dev` server | no (gitignored) |
| `backend/.env` | both vars for **drizzle-kit** (migrations run from your laptop, not inside the worker) | no (gitignored) |

Rule of thumb: `.dev.vars` feeds `wrangler dev`, `.env` feeds `drizzle-kit`,
`[vars]`+secret feed production. Three consumers, three files.

The token itself is an **EdDSA-signed JWT**. Dashboard/CLI tokens have no
`exp` claim — they don't expire, so treat the `.env` file like a password.
Mint with `turso db tokens create <db>` (or the dashboard).

## 5. Local development without touching production

`turso dev` runs a local libsql server backed by a plain SQLite file — no
account, no token, no network:

```bash
turso dev --db-file authdev.db --port 8880
# .dev.vars → TURSO_DATABASE_URL=http://127.0.0.1:8880, empty token
npx wrangler dev --port 8787            # worker now hits the local DB
```

This is how the whole auth flow was verified end-to-end (signup / login /
me / logout via curl, then the real app on the emulator) before the hosted
DB had ever been written to. D1 gave this for free with `--local`; with
Turso you run one extra process.

## 6. Migrations: drizzle-kit replaces `wrangler d1 migrations`

`drizzle.config.ts` uses `dialect: 'turso'` and reads `../.env`. Two
commands, same as before in spirit:

```bash
npx drizzle-kit generate   # diff schema.ts → new .sql file in drizzle/
npx drizzle-kit migrate    # apply pending migrations to whatever URL .env points at
```

One config nuance: drizzle-kit *requires* `authToken` for the turso dialect
but the local server doesn't need one — so the config only includes the key
when the env var is non-empty (`...(token ? { authToken: token } : {})`).

Point `.env` at local → migrates local. Point it at the hosted URL + token →
migrates production. **Same command, so read your `.env` before running it.**

## 7. Deploy path (replaces steps 2–4 of doc 01)

```bash
cd backend/auth-worker
npx drizzle-kit migrate                    # with hosted URL+token in backend/.env
npx wrangler secret put TURSO_AUTH_TOKEN   # paste token for the deployed worker
npx wrangler deploy
curl -s -X POST https://<worker-url>/signup \
  -H 'content-type: application/json' \
  -d '{"email":"you@example.com","password":"password123"}'   # smoke test
```

Then point the app at it: `EXPO_PUBLIC_API_URL=https://<worker-url>` (step 5
of doc 01 is unchanged).

## 8. Cheat sheet

```bash
turso auth login                       # once per machine
turso db create <name>                 # create hosted DB
turso db show <name> --url             # get libsql:// URL
turso db tokens create <name>          # mint auth token
turso db shell <name>                  # SQL shell into hosted DB
turso dev --db-file x.db --port 8880   # local server, no auth
```
