# Backend

Cloudflare Workers, one directory per service. Each is its own Wrangler
project (own `package.json`, `wrangler.toml`). Today there's one:

- **`auth-worker/`** — email/password signup & login. D1-backed (`users`,
  `sessions`). See the ADR in [`../docs/07-architecture.md`](../docs/07-architecture.md)
  — the DB choice (D1) is a first pick being tested, not locked in.

## Running `auth-worker` locally

```
cd backend/auth-worker
npm install
```

One-time setup (needs a Cloudflare account — not done yet):

```
npx wrangler login
npx wrangler d1 create project-alpha-auth
# paste the returned database_id into wrangler.toml
npm run db:generate
npm run db:migrate:local
```

Then:

```
npm run dev            # wrangler dev, serves on http://localhost:8787
```

Smoke test:

```
curl -X POST http://localhost:8787/signup -H 'content-type: application/json' \
  -d '{"email":"you@example.com","password":"password123"}'
curl http://localhost:8787/me -H 'Authorization: Bearer <token from above>'
```

Deploy with `npm run deploy` (also needs `wrangler login` and a remote
migration via `npm run db:migrate:remote` first).
