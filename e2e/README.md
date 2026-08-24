# e2e/

End-to-end UI flows for FamilyPuzzles, kept as a separate top-level folder
(distinct from `docs/` and `src/`) so the whole automated-testing story lives
in one obvious place.

This is deliberately split from unit/component tests:

- **Unit/component tests** (`*.test.tsx`) live co-located next to the source
  file they cover, e.g. `App.tsx` + `App.test.tsx`, `src/screens/Foo.tsx` +
  `src/screens/Foo.test.tsx`. Run with `pnpm test` (Jest).
- **E2E flows** (this folder) drive the actual built app on a
  simulator/emulator through full user journeys — they can't be co-located
  with a single source file since a flow usually spans several screens.

## Convention

One [Maestro](https://maestro.mobile.dev/) flow file per design doc's "Test
scenarios" section, named to match the spec:

```
docs/specs/games/puzzle/PuzzleBoard.md  ("Test scenarios" section)
  -> e2e/games-puzzle-PuzzleBoard.yaml
```

Flow files are generated/maintained by the `e2e-tester` agent (see
`.claude/agents/e2e-tester.md`), run via the `/e2e-run` skill. They assume:

- The [Maestro CLI](https://maestro.mobile.dev/getting-started/installing-maestro)
  is installed and on `PATH`.
- A debug build of the app is already installed on a running
  simulator/emulator.

Neither is set up by this repo automatically — that's part of the app's
build/install tooling, not something the E2E agent installs on its own.

## Running

```
maestro test e2e/<flow>.yaml   # single flow
maestro test e2e/               # everything in this folder
```
