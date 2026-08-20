import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Bindings } from './types';
import { authRoutes } from './routes/auth';
import { meRoutes } from './routes/me';
import { verifyRoutes } from './routes/verify';

// Entry point. This worker is a single deployment; routing to each handler
// happens here in-process (not via an external gateway). Add a new resource by
// creating a routes/<name>.ts module and mounting it below.
const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

app.route('/', authRoutes); //   /signup, /login, /logout
app.route('/', meRoutes); //     /me
app.route('/', verifyRoutes); // /verify/request, /verify/confirm

export default app;
