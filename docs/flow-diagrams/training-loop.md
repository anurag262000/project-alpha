# Training loop — generate → train → progress

Covers features F3 (program generator), F4 (home + activity) and F5 (workout
logging). Spec: [02-split-generator-logic.md](../02-split-generator-logic.md),
[04-home-logging-ux.md](../04-home-logging-ux.md).

The closed loop is the point: what you log this session sets the targets for
the next one, and the aggregate of what you log adjusts the program itself.

```mermaid
flowchart TD
    A[Onboarding complete] --> B[completeOnboarding<br/>profile + measurement + screening]
    B --> C[generateAndSaveProgram]

    subgraph GEN [Split generator — docs/02, pure logic]
        C --> C1[Step 1 · template<br/>days/week + experience]
        C1 --> C2[Step 2 · weekly volume<br/>MEV→MAV by goal + experience<br/>MRV as ceiling]
        C2 --> C3[Step 3 · exercise selection<br/>filter equipment + injuries<br/>compound first, then isolation]
        C3 --> C4[Step 4 · sets & reps<br/>rep band by goal<br/>capped by session length]
    end

    C4 --> D[(program<br/>program_day<br/>program_exercise)]

    D --> E{Today a training day?}
    E -->|no| F[Home · rest-day card<br/>ad-hoc workout offered]
    E -->|yes| G[Home · today's workout<br/>each lift + its prescription]

    G --> H[Start session<br/>program_day_id set]
    F -->|ad-hoc| H2[Start session<br/>program_day_id null]

    H --> I[Log set<br/>program_exercise_id kept<br/>even when substituted]
    H2 --> I
    I --> J[Rest timer<br/>compound 120s / isolation 75s]
    J -->|next set| I
    I --> K[Finish]
    K --> L{Anything logged?}
    L -->|no| M[status = skipped]
    L -->|yes| N[status = completed]
    N --> O[Summary · volume, duration, PRs]

    O --> P[(logged_set)]
    M --> P

    subgraph PROG [Progression — docs/02 step 5]
        P --> Q{Last session<br/>vs target}
        Q -->|hit rep max on all sets| R[+1 increment<br/>reset to rep min]
        Q -->|short of rep max| S[hold load, add reps]
        Q -->|missed rep min ×2| T[−10% load]
        P --> U{Deload due?<br/>weeks on program<br/>or 2× multi-lift stall}
        P --> V{Adherence < 70%<br/>over 2 weeks?}
        V -->|yes| W[Suggest fewer days<br/>or shorter sessions]
    end

    R --> G
    S --> G
    T --> G
    U -->|yes| X[Deload banner on Home]
    W --> X

    subgraph ACT [Passive activity — ADR-004]
        Y[Health Connect<br/>Steps + ExerciseSession] --> Z[(activity_snapshot)]
        Z --> AA[Activity ring + 7-day step trend]
    end
```

## Notes

- **Planned and actual never merge.** `program_exercise` is the plan,
  `logged_set` is the actual; `program_exercise_id` links them and survives an
  exercise substitution, which is what makes plan-vs-actual, adherence, and
  substitution frequency computable later.
- **A session with no sets is `skipped`, not `completed`** — otherwise opening
  and abandoning the logger would inflate both streak and adherence.
- **Everything in the generator and progression boxes is pure** and unit
  tested (`splitGenerator.test.ts`, `progression.test.ts`); only the shaded
  DB nodes touch SQLite.
- **A failed Health Connect read keeps the previous snapshot** rather than
  writing zeroes, so a revoked permission does not erase a good day.
