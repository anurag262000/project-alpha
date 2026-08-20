// Uniform JSON error body shared by every endpoint.
export function err(message: string, status: 400 | 401 | 404 | 409 = 400) {
  return Response.json({ error: message }, { status });
}
