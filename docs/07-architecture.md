# Architecture

Landing doc for tech/architecture decisions. Research and options are explored
in the connected claude.ai Project; **decisions get recorded here as ADRs** so
Claude Code and every future session pick them up.

## Decided so far (from 00-overview)

- React Native (Expo, expo-router, TypeScript).
- Local-only persistence: SQLite via Drizzle ORM. No backend yet.
- State: Zustand. Charts: react-native-svg. Glass: expo-blur.
- Steps/activity source: Android Health Connect (not the deprecated Google
  Fit API).
- Rule-based split generator (not ML).

## Open questions to research

Each of these should end in an ADR below. (Good tasks for the research Project.)

1. **Onboarding → profile flow.** How the Zustand onboarding *draft* becomes a
   persisted `profile` row; where derived targets are computed and cached;
   first-run gating (show onboarding vs jump to home) via expo-router.
2. **Persistence & migrations.** Drizzle + expo-sqlite setup, migration
   strategy (drizzle-kit), and how schema changes ship to installed apps.
3. **Exercise dataset ingestion.** Bundle free-exercise-db at build time vs
   seed into SQLite on first launch; update strategy; licensing/attribution.
4. **Navigation structure.** expo-router layout: onboarding stack vs app tabs,
   the first-run gate, and where Logging/Summary sit (modal vs stack).
5. **Where the split generator runs.** Pure TS module invoked on
   onboarding-complete and on regenerate; determinism and testability.
6. **Calculation recompute triggers.** When BMI/BMR/TDEE/macros recompute
   (weight/goal/activity change) and how the cache on `profile` stays fresh.
7. **Health Connect integration.** Library choice (react-native-health-connect
   via config plugin + dev client), permission UX, sync cadence, and the
   Expo Go vs dev-client implication.
8. **Theming persistence.** Persist the light/dark choice (and "follow
   system") across launches.
9. **Backup / export.** Local export format for the user's data (JSON?),
   given no cloud sync yet.
10. **Testing strategy.** node:test for pure logic (already in use for
    health.ts); component/e2e approach if any.
11. **Play Store readiness.** Permissions, Data Safety form, privacy policy —
    heightened scrutiny for health data.

## ADR log

Architecture Decision Records — newest first. Copy the template per decision.

### Template
```
### ADR-NNN — <title>
- Date:
- Status: proposed | accepted | superseded
- Context: <the problem / forces>
- Decision: <what we chose>
- Consequences: <trade-offs, follow-ups>
- Alternatives considered: <options rejected and why>
```

_(No ADRs recorded yet — this is where the architecture research lands.)_
