// Env bindings available to every handler. TURSO_DATABASE_URL comes from
// wrangler.toml [vars]; TURSO_AUTH_TOKEN and RESEND_API_KEY are secrets
// (`wrangler secret put` in prod, `.dev.vars` locally).
export type Bindings = {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
  RESEND_API_KEY: string;
  // Verified sender address, e.g. "noreply@yourdomain.com". Falls back to
  // Resend's test sender in code when unset. Not secret → wrangler.toml [vars].
  RESEND_FROM: string;
};
