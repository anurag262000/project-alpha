# Features

The single place we track **what** project-alpha does, how each requirement
**changes over time**, and **bugs** we find.

- [feature-log.md](feature-log.md) — one entry per feature, each with its
  current requirement, a mutation history (how the requirement evolved and
  why), and its open/resolved bugs. There's also a global bug log at the
  bottom.

## How to use it

- **New feature** → add a new `F#` entry with a current requirement and link
  to any spec doc under `../docs/`.
- **Requirement changed** → don't overwrite; append a dated line to that
  feature's *Mutations* list explaining the change and the reason. The
  *Current requirement* line always reflects the latest.
- **Bug found** → add a row to the feature's *Bugs* table (and mirror serious
  ones in the global bug log). Mark status `open` / `fixed` and link the fix.

Keep entries short and factual — the "why" matters more than the "what".
