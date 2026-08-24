# Architecture

## What this app is

A React Native app where a parent uploads family photos and the app turns
them into simple games for a toddler to play. Jigsaw puzzles first; more game
types later (matching, sliding tiles, spot-the-difference, etc.).

## Key decisions

**Bare React Native CLI, not Expo.** Chosen for full control over native
touch handling (puzzle piece drag/snap needs to feel forgiving and immediate
for small hands) without Expo's native-module constraints. Means `android/`
and `ios/` are real native projects in this repo, owned by build tooling, not
hand-edited. Current stack, as scaffolded by `react-native init`: RN 0.87,
React 19.2, TypeScript, pnpm, Jest via `@react-native/jest-preset`,
ESLint/Prettier via `@react-native/eslint-config`.

**`App.tsx` and `index.js` stay at the repo root.** This is the RN CLI
convention — `index.js` registers the root component RN's native side looks
for, and moving it doesn't buy anything. `src/app/` holds the providers and
root navigation setup (theme provider, navigation container, etc.) that
`App.tsx` composes once they exist; today `App.tsx` is still the unmodified
RN template placeholder (`NewAppScreen`), so `src/app/` is empty until the
first real screen is wired in.

**Local-only storage, no backend.** Photos and puzzle progress live entirely
on-device. No accounts, no auth, no upload to any server. This is a deliberate
privacy stance (the content is photos of children) and it also removes an
entire category of complexity: no API, no sync conflicts, no server-side
specs to maintain. If cross-device sync is wanted later, treat it as an
opt-in layer added on top of a working offline-first app, not a foundation.

**Games are self-contained plugins under `src/games/<name>/`.** Each game
owns its own `components/` and `logic/` and exposes a small entry point
(`index.ts`). The goal: adding a second or third game type should mean adding
a new folder, not touching the puzzle game's code. `src/games/puzzle/` is the
first and, for now, only implementation of this pattern — treat it as the
reference example when adding the next game.

**Toddler-first UX is a first-class constraint, not a detail.** Large touch
targets, forgiving input (mis-taps do nothing rather than showing an error),
minimal-to-no text dependency, and clear audio/visual feedback are baseline
requirements for every screen and game component — see the "Toddler UX
constraints" section required in every spec.

## Open decisions (for the install/setup session or first implementation pass)

- **State management**: not yet chosen. Given the app's small scope, plain
  React Context + hooks or a lightweight store (e.g. Zustand) are both
  reasonable; avoid anything that assumes a backend (Redux-with-thunks-for-
  API-calls patterns are unnecessary overhead here).
- **Local persistence**: photo references + puzzle progress need a small
  local store — `react-native-mmkv` (fast key-value) or SQLite (e.g.
  `op-sqlite`) if querying structured puzzle/progress data turns out to
  matter. Actual photo bytes should stay wherever the OS photo picker leaves
  them (or a copy in app-private storage) rather than duplicated into a DB.
- **Navigation library**: `@react-navigation/native` is the de facto standard
  for bare RN and is assumed by the folder layout (`src/navigation/`), but
  hasn't been installed yet as of this doc.

Record the actual choice in this file once made — this doc is itself subject
to the same "keep it current" expectation as a component spec.
