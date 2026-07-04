# Learning guides

Teaching notes we record while learning a tool or process, kept for future
reference. Separated by topic, numbered in the order to read them.

## Cloudflare (backend)

Read in order:

1. [00-serverless-workers-and-wrangler.md](00-serverless-workers-and-wrangler.md)
   — **concepts.** What serverless / Workers / Wrangler / D1 are, what Wrangler
   is used for and where else it's used, Workers vs AWS Lambda, bindings, and
   the local-vs-remote model. Start here. (The D1 section is historical —
   we moved to Turso, see guide 02.)
2. [01-deploy-auth-worker.md](01-deploy-auth-worker.md) — **hands-on.**
   Step-by-step deploy of the worker. **Note:** the D1 database steps (2–3)
   are superseded by guide 02; the wrangler login/deploy/verify steps stand.
3. [02-turso-libsql-migration.md](02-turso-libsql-migration.md) — **the DB we
   actually use.** What Turso/libsql is, why we switched off D1 (ADR-002),
   the URL+token connection model vs bindings, where each config value lives
   (`[vars]` / secret / `.dev.vars` / `.env`), local dev with `turso dev`,
   drizzle-kit migrations, and the updated deploy path.

## Mobile (on-device data)

4. [03-expo-sqlite-drizzle.md](03-expo-sqlite-drizzle.md) — **on-device
   SQLite in the Expo app.** drizzle + expo-sqlite wiring, bundling `.sql`
   migrations through Metro/Babel, self-migrating on launch, seeding, and
   three real gotchas (Hermes has no `crypto.randomUUID`; stale device DB vs
   regenerated migrations; always surface migration errors).

## Convention

When we pick up a new tool or process, add a guide here (concepts first, then
the how-to), numbered so the reading order is obvious.
