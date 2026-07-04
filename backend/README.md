# Backend

Cloudflare Workers, one directory per service. Each is its own Wrangler
project (own `package.json`, `wrangler.toml`). Today there's one:

- **`auth-worker/`** — email/password signup & login. **Turso-backed**
  (`users`, `sessions`) — switched from D1 before first deploy, see ADR-002
  in [`../docs/07-architecture.md`](../docs/07-architecture.md) and the
  learning guide
  [`../docs/learning/02-turso-libsql-migration.md`](../docs/learning/02-turso-libsql-migration.md).

## Running `auth-worker` locally

```
cd backend/auth-worker
npm install
```

Local dev needs no Turso account — run a local libsql server and point the
worker at it (`.dev.vars`, gitignored, already does):

```
turso dev --db-file authdev.db --port 8880       # separate terminal
TURSO_DATABASE_URL=http://127.0.0.1:8880 npx drizzle-kit migrate   # first run / schema changes
npm run dev            # wrangler dev, serves on http://localhost:8787
```

Smoke test:

```
curl -X POST http://localhost:8787/signup -H 'content-type: application/json' \
  -d '{"email":"you@example.com","password":"password123"}'
curl http://localhost:8787/me -H 'Authorization: Bearer <token from above>'
```

Inspect the DB with Drizzle Studio: `npx drizzle-kit studio` (connects to
whatever `backend/.env` points at — local URL or the hosted one).

## Deploying

Hosted DB credentials live in `backend/.env` (gitignored):
`TURSO_DATABASE_URL` (the `libsql://…` URL) + `TURSO_AUTH_TOKEN`
(`turso db tokens create <db>`). Then:

```
npx drizzle-kit migrate                    # applies schema to the hosted DB
npx wrangler login                         # once per machine
npx wrangler secret put TURSO_AUTH_TOKEN   # token for the deployed worker
npm run deploy
```

Full walkthrough: learning guides
[01](../docs/learning/01-deploy-auth-worker.md) (wrangler steps) and
[02 §6–7](../docs/learning/02-turso-libsql-migration.md) (DB steps).
