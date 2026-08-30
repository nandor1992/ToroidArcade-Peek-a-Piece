<div align="center">

<img src="resources/peekapiece-icon.png" alt="Peek-a-Piece" width="120" />

# Peek-a-Piece

**Turn family photos into jigsaw puzzles for toddlers.**

A parent adds photos; the app cuts them into interlocking pieces a small child
can drag back together. Everything stays on the device — no accounts, no
servers, no ads, no tracking.

### [▶&nbsp; Play the web demo](https://nandor1992.github.io/ToroidArcade-Peek-a-Piece/)

<sub>Starter puzzles, straight in the browser — nothing to install.</sub>

</div>

---

## What it does

- **Real jigsaw pieces**, not tiles — rounded tab/blank shapes cut with Skia,
  rendered on a full-screen board.
- **Forgiving drag-and-drop** built for imprecise hands: pieces snap to their
  own slot *or* to a matching neighbour, joined pieces drag as one group, and a
  piece that's home locks so it can't be knocked out again.
- **Your photos.** A parent picks images from the device library; they're
  copied into app-private storage and survive restarts.
- **Eight bundled starter puzzles**, so it's playable before anything is
  uploaded.
- **Completion ticks.** A solved puzzle gets a green check on the home grid;
  Reset clears it.
- **Seven grid sizes**, 2×2 up to 6×5, chosen by the parent.
- **Parent gate.** Uploads and settings sit behind an arithmetic question a
  toddler can't solve.
- **Screen-time limit** — an optional timer that locks the app behind the same
  gate when the session is up.
- **Background music** with volume and mute, which pauses when the app is
  backgrounded.

## Try it in a browser

**→ [nandor1992.github.io/ToroidArcade-Peek-a-Piece](https://nandor1992.github.io/ToroidArcade-Peek-a-Piece/)**

The board is rendered by Skia compiled to WebAssembly, so the first load pulls
a few MB before the puzzle appears.

To run the same build locally:

```bash
pnpm install
pnpm web:start        # http://localhost:8080
```

The demo is starter puzzles only (no parent area or photo upload). See
[`docs/specs/app/DemoApp.md`](docs/specs/app/DemoApp.md) for why, and
[`docs/web-demo.md`](docs/web-demo.md) for deploying it to GitHub Pages.

## Running the app

Requires the [React Native environment](https://reactnative.dev/docs/set-up-your-environment)
for bare (non-Expo) projects, plus Node ≥ 22.11 and pnpm.

```bash
pnpm install
pnpm start            # Metro
pnpm android          # or: pnpm ios   (run `pod install` in ios/ first)
```

> **Note** — `node_modules` must use a **flat** layout. `.npmrc` and
> `pnpm-workspace.yaml` both pin `nodeLinker: hoisted`, because React Native
> autolinking and `@shopify/react-native-skia`'s split native packages resolve
> by walking a real `node_modules` tree. If a Gradle build fails at
> `:shopify_react-native-skia`, do a clean `rm -rf node_modules && pnpm install`.

## Checks

```bash
pnpm exec tsc --noEmit     # types
pnpm test                  # jest
pnpm lint                  # eslint
pnpm web:build             # static web demo -> web/dist/
```

## Tech

Bare React Native 0.87 (new architecture) + TypeScript. The puzzle board is
[React Native Skia](https://shopify.github.io/react-native-skia/); persistence
is AsyncStorage plus app-private file copies; the web demo is
react-native-web + Webpack 5. Navigation is a small hand-rolled screen union in
`App.tsx` rather than a nav library — five screens doesn't warrant one yet.

## Layout

```
App.tsx              native entry (all screens)
src/app/             DemoApp — web entry (starter puzzles only)
src/screens/         Home, Puzzle, ParentGate, Parent, Settings, SessionLock
src/games/puzzle/    the game as a self-contained plugin (components/ + logic/)
src/components/      shared UI (Icon, Slider, AppHeader, ErrorBoundary…)
src/storage/         AsyncStorage wrapper, puzzle store, photo file copies
src/hooks/           background music, persistent puzzles
web/                 web demo entry + HTML shell
docs/specs/          design docs, mirroring src/ 1:1
resources/           brand source of truth (icon, palette, music)
```

Two conventions worth knowing before you edit anything:

- **`docs/specs/` mirrors `src/` 1:1.** Every non-trivial source file has a
  design doc at the same path with `.md` instead of `.tsx`. Read
  [`docs/README.md`](docs/README.md) first.
- **Toddler UX is a hard constraint**, documented per-component: large touch
  targets, forgiving input, minimal text, clear feedback.

The full "why" behind the stack is in
[`docs/architecture.md`](docs/architecture.md).

## Privacy

No data leaves the device. No accounts, no analytics, no ad SDKs, no network
calls at all — photos of children are the whole point of keeping it local. Full
policy: [`docs/legal/privacy-policy.md`](docs/legal/privacy-policy.md).

## Credits

- Music: [Dmitrii Kolesnikov](https://pixabay.com/users/the_mountain-3616498/)
  via [Pixabay](https://pixabay.com/), Pixabay Content License.
- Starter puzzle art generated from family photos with imagetocartoon.com.
- Icons: [Material Design Icons](https://pictogrammers.com/library/mdi/).

Built with love for Julia and Vincent.
