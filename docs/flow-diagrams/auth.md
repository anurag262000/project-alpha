# Auth flow (F9)

Signup lands at the end of onboarding; login is a separate entry from Welcome.
Session token lives in `expo-secure-store`, restored on launch by
`useAuth.hydrate()`.

## Screens & session

```mermaid
flowchart TD
  Launch([App launch]) --> Hydrate{token in<br/>SecureStore?}
  Hydrate -- yes, /me OK --> Home[/home/]
  Hydrate -- no / invalid --> Welcome[Welcome]

  Welcome -- Get started --> Onb[Onboarding steps<br/>basics…ready]
  Welcome -- I already have an account --> Login[Login]

  Onb --> Ready[Plan ready]
  Ready -- Start training --> Account[Create account]

  Account -- signUp OK --> Home
  Login -- signIn OK --> Home
```

## Signup / login request

```mermaid
sequenceDiagram
  participant App as Mobile (useAuth)
  participant W as auth-worker
  participant D1 as D1

  App->>W: POST /signup or /login {email, password}
  W->>D1: find / insert user (PBKDF2 verify or hash)
  W->>D1: insert sessions row (token, expires_at)
  W-->>App: { token, user }
  App->>App: SecureStore.setItem(token); status = signedIn

  Note over App,W: later, on launch
  App->>W: GET /me (Bearer token)
  W->>D1: token → session → user (check expiry)
  W-->>App: { user } or 401
```
