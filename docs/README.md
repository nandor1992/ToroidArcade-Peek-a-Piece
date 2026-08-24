# docs/

This folder is the app's design record — not a user manual, a *spec*. Every
non-trivial file under `src/` gets a matching doc under `docs/specs/` that
explains why it exists and how it's supposed to behave. Automated Claude
sessions read these specs to hunt for bugs (code vs. doc mismatches), to
generate and run E2E tests, and to flag docs that have gone stale.

## The 1:1 mirror rule

`docs/specs/` mirrors `src/` path-for-path:

```
src/screens/HomeScreen.tsx        -> docs/specs/screens/HomeScreen.md
src/games/puzzle/PuzzleBoard.tsx  -> docs/specs/games/puzzle/PuzzleBoard.md
```

This is deliberate: given a source path, the spec path is mechanical (swap
`src/` for `docs/specs/`, `.tsx`/`.ts` for `.md`), and vice versa. No lookup
table to maintain, nothing for an agent to guess at.

Not every file needs a spec (a tiny formatting `utils/` helper doesn't). Write
one for anything with a "why" or a "how it behaves" worth capturing: screens,
games, shared components with real interaction logic, storage/services, hooks
with non-obvious behavior.

## Writing a spec

Start from [`specs/_TEMPLATE.md`](specs/_TEMPLATE.md). Keep the frontmatter
accurate — `source` and `last_verified` are read by the `doc-drift-checker`
agent to detect docs that fell out of sync with the code. Update
`last_verified` whenever you re-confirm the doc still matches the code, even
if you didn't change the doc's text.

The `/new-component` skill scaffolds a source file and its matching spec
together, pre-filled from the template.

## How the automation uses this

- **`spec-bug-hunter`** reads a spec's "Edge cases & expected behavior" and
  "Interface" sections and checks the source file actually does what's
  documented (and doesn't claim behavior that isn't implemented).
- **`e2e-tester`** turns a spec's "Test scenarios" into Maestro flows and runs
  them against a built app.
- **`doc-drift-checker`** compares each spec's `last_verified` date against
  git history on its `source` file and flags specs that are now stale.

See [`architecture.md`](architecture.md) for the app-level design (why
bare RN, why local-only storage, why games are structured as plugins).
