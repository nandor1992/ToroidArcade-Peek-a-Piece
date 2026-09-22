---
name: formatting
type: service
source: src/formatting.test.ts
status: draft
last_verified: 2026-09-22
---

# formatting

## Purpose

Makes Prettier formatting a test failure rather than a matter of habit.

This repo's eslint setup extends `@react-native`, which extends
`eslint-config-prettier` — that **disables** the eslint rules Prettier owns so
the two don't fight. The side effect is that nothing in `npm run lint` or
`npm test` noticed formatting at all, and files drifted. This test closes that
gap without adding an eslint plugin or a second opinion about style.

## How it works

A single jest test that:

1. Walks `src/` and `__mocks__/` for `.ts`, `.tsx`, `.js`, `.jsx` files,
   skipping `node_modules`, `build`, `android` and `ios`.
2. Adds the loose top-level config files (`jest.config.js`, `metro.config.js`,
   `webpack.config.js`, `babel.config.js`, `.prettierrc.js`, `.eslintrc.js`),
   each only if it exists.
3. Asserts it found more than 20 files — a guard that silently checks nothing
   is worse than no guard, so a broken walk fails loudly.
4. Runs `prettier.check` on each with the config `prettier.resolveConfig`
   finds for that path, and asserts the list of unformatted files is empty.

Failures name every offending file, relative to the repo root with forward
slashes, so the message reads the same on Windows and CI.

## Interface

None — it is a test. The developer-facing surface is two npm scripts:

| Script | Effect |
|--------|--------|
| `npm run format` | Rewrites the same file set in place. The fix for a failure. |
| `npm run format:check` | Same check as this test, without jest. |

## Prettier configuration

`.prettierrc.js` carries two options beyond the defaults, both load-bearing:

- **`bracketSameLine: true`** — a multi-line JSX open tag ends `]}>` rather
  than putting `>` on its own line. This is the React Native template style
  the whole codebase was written in; without it, enforcing Prettier would
  rewrite every component in the repo for no benefit.
- **`endOfLine: 'auto'`** — this repo has **mixed line endings committed**, and
  `core.autocrlf` is `false`, so what is on disk is what is in git. Prettier's
  default (`'lf'`) would rewrite the endings of every CRLF file the first time
  it ran: a diff touching every line of the codebase, bundled into a commit
  that was supposed to be about formatting. `'auto'` keeps whatever each file
  already uses, so a three-line edit stays a three-line diff.

  Normalising the repo is a **separate decision** from enforcing formatting —
  it wants a `.gitattributes` (`* text=auto eol=lf`) and its own renormalise
  commit, so `git blame` has one obvious line to skip. If that happens, change
  this option to `'lf'` at the same time.

## Toddler UX constraints

None — this never runs on a device.

## Edge cases & expected behavior

- A file Prettier cannot parse → `prettier.check` throws, and the test fails
  with that file's parse error. Correct: an unparseable source file is a real
  problem.
- A new top-level config file → not checked until it is added to
  `LOOSE_FILES`. Deliberate: the alternative is globbing the repo root and
  arguing with generated files.
- Markdown is **out of scope**. `docs/` is hand-wrapped prose and Prettier
  would reflow every spec. The `docs/` convention is enforced by review and by
  `doc-drift-checker`, not by Prettier.
- The test has a 60s timeout; the full walk takes about a second, so the
  headroom is for a cold CI runner.

## Test scenarios

1. Introduce a badly formatted file under `src/` → `npx jest src/formatting`
   fails and names it.
2. Run `npm run format` → the test passes again.
3. Delete `babel.config.js` → the test still passes (loose files are optional).

## Non-goals / known limitations

- Does not format anything. It only reports; `npm run format` is the fix.
- Does not run Prettier as a git hook. There is no hook infrastructure in this
  repo, and a failing test at `npm test` is the enforcement point.
- Does not check `e2e/` YAML or `docs/`.

## Related

- Code: `src/formatting.test.ts`
- Config: `.prettierrc.js`, `package.json` (`format`, `format:check`)
