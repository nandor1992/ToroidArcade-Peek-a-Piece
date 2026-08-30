---
name: DemoApp
type: screen
source: src/app/DemoApp.tsx
status: draft
last_verified: 2026-08-30
---

# DemoApp (web demo build)

## Purpose

The root component for the **browser** build: the eight bundled starter
puzzles, playable on a web page, and nothing else. It exists so the app can
be tried without installing it — a marketing / "try it" page — not as a
second product. The native app keeps using `App.tsx`; this is a parallel
entry point, not a replacement.

## How it works

**Why a separate root at all.** Three of the app's native dependencies have
no web build: `react-native-image-picker`, `@dr.pogodin/react-native-fs`,
and `react-native-sound`. `Alert` is also absent from react-native-web. By
never importing `ParentScreen` / `SettingsScreen` / `ParentGateScreen` /
`SessionLockOverlay`, this root keeps the first two — and `Alert` — out of
the bundle entirely, so only *one* real shim is needed (audio). That's what
makes the demo cheap; a full-parity web build would have to solve all four.

**What it renders.** A two-state screen union (`home | puzzle`), the same
pattern as `App.tsx` but without the parent branches:

- [[HomeScreen]] with `stockPuzzles={STARTER_PUZZLES}` and no
  `onOpenParentArea` — which is why `HomeScreen` now hides its corner parent
  button when that prop is absent, rather than showing a dead one.
- [[PuzzleScreen]] at `DEFAULT_PUZZLE_SIZE` (2x2), wired to `markCompleted` /
  `clearCompleted` so the green ticks behave exactly as on native.

**What still works for free.** `usePersistentPuzzles` is reused unchanged:
AsyncStorage v3 picks its IndexedDB implementation on web automatically, so
completion ticks survive a page reload. `SafeAreaProvider`, the Responder
System behind the puzzle drag, and `AppState` all come from
react-native-web. Skia renders the board through CanvasKit/WASM.

**Deliberate omissions.** No parent area, no photo upload, no Settings, no
screen-time lock. Music volume is fixed at `DEMO_VOLUME` (0.6) and unmuted,
since there is no Settings screen to change it.

## Interface

No props — it is an entry-point component, rendered by `web/index.tsx`
via Skia's `WithSkiaWeb` (which must load CanvasKit before the board mounts).
Exported as a **default** export because `WithSkiaWeb`'s `getComponent`
expects a module with one.

## Toddler UX constraints

Inherited wholesale from [[HomeScreen]] and [[PuzzleScreen]] — this
component adds no UI of its own. Two web-specific notes:

- `web/index.html` sets `user-select: none`, `overscroll-behavior: none` and
  `touch-action: manipulation` on the root, so dragging a piece can't turn
  into a text selection or a pull-to-refresh.
- Music cannot autoplay in a browser; it starts on the first tap (see
  [[useBackgroundMusic]]). Silence before the first interaction is expected,
  not a bug.

## Edge cases & expected behavior

- CanvasKit still loading → `WithSkiaWeb`'s fallback shows "Retrieving
  Memories…", matching the static boot markup in `index.html` so the wait
  reads as one continuous screen.
- Page reloaded after solving a puzzle → the green tick is still there
  (IndexedDB via AsyncStorage).
- A render error anywhere below → [[ErrorBoundary]]'s recovery screen, same
  as native.
- Browser blocks autoplay → no music until the first pointer/key event, then
  it starts.

## Test scenarios

Not covered by Jest — the suite runs against the **native** module graph, so
it resolves `useBackgroundMusic.ts`, not the `.web.ts` shim. Verified
manually in a browser (`pnpm web:start`):

1. Home shows the eight starter puzzles and **no** parent button.
2. Opening one shows "Retrieving Memories…" then a playable board.
3. Drag / snap / merge works with both mouse and touch.
4. Solving shows "🎉 Great job!" and a green tick on Home.
5. Reload → the tick persists.
6. Music starts after the first click and pauses when the tab is hidden.
7. Icon glyphs render (not tofu boxes).

## Non-goals / known limitations

- **Demo scope by design** — no photo upload. `src/storage/photoFiles.web.ts`
  is a deliberate no-op stub, present only so `usePersistentPuzzles` bundles;
  it is the seam a full-parity build would replace with IndexedDB blobs.
- **Heavy payload**: `canvaskit.wasm` is ~8 MB uncompressed, plus ~2 MB of
  starter JPEGs and a 3.1 MB mp3. Serve with brotli/gzip; downscaling the
  starter art is the cheapest further win. See `docs/web-demo.md`.
- `require()`d images are URL strings on web but typed `number`
  (`Puzzle.imageAsset`). Skia's web `useImage` accepts URL strings, so this
  is runtime-correct; the native type is left alone rather than widened.
- No routing — the screen union is local state, so there's no shareable URL
  for an individual puzzle and the browser Back button leaves the page.
- Hosting is path-agnostic by construction (`publicPath: 'auto'`, relative
  `@font-face` src, `locateFile` resolved against `document.baseURI`), so the
  same `web/dist/` works at a domain root or under `/<repo>/` on GitHub
  Pages. Deployed by `.github/workflows/deploy-web.yml`; see
  `docs/web-demo.md`.

## Related

- Code: `src/app/DemoApp.tsx`
- Entry point: `web/index.tsx`, `web/index.html`
- Build: `webpack.config.js`; `pnpm web:start` / `pnpm web:build`
- Web shims: `src/hooks/useBackgroundMusic.web.ts`, `src/storage/photoFiles.web.ts`
- Related specs: [[HomeScreen]], [[PuzzleScreen]], [[usePersistentPuzzles]], [[useBackgroundMusic]], [[ErrorBoundary]], [[PuzzleBoard]]
