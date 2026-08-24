# Peek-a-Piece

React Native (bare CLI) app: parents upload family photos, the app turns them
into games (jigsaw puzzles first) for toddlers to play. Local-only storage —
no backend, no accounts.

See [`docs/architecture.md`](docs/architecture.md#branding) for the name,
icon, and colour/type identity — sourced from `resources/`.

## Conventions

- **`docs/specs/` mirrors `src/` 1:1.** Every non-trivial file under `src/`
  has a matching design doc at the same path under `docs/specs/`, with `.tsx`
  swapped for `.md`. Start new specs from `docs/specs/_TEMPLATE.md`. Read
  [`docs/README.md`](docs/README.md) before writing or editing a spec.
- **Games are self-contained plugins** under `src/games/<name>/`, each with
  its own `components/` and `logic/`. Don't reach across game folders.
- **Tests are co-located** next to the source they cover (`Foo.tsx` +
  `Foo.test.tsx`), not in a mirrored `__tests__/` tree. E2E flows (Maestro)
  live under `e2e/`.
- **Toddler UX is a hard constraint** on every screen/component: large touch
  targets, forgiving input (mis-taps do nothing, no precision required),
  minimal text dependency, clear audio/visual feedback. This is documented
  per-component in each spec's "Toddler UX constraints" section — treat it as
  required, not optional, when implementing.
- **Local-only, always.** Don't introduce network calls, accounts, or cloud
  storage for photos/progress without an explicit decision recorded in
  [`docs/architecture.md`](docs/architecture.md).

See [`docs/architecture.md`](docs/architecture.md) for the full "why" behind
the stack, and [`docs/README.md`](docs/README.md) for how the spec system and
its automation (`spec-bug-hunter`, `e2e-tester`, `doc-drift-checker`) work.
