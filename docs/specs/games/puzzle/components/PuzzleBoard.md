---
name: PuzzleBoard
type: game
source: src/games/puzzle/components/PuzzleBoard.tsx
status: draft
last_verified: 2026-08-29
---

# PuzzleBoard

## Purpose

The actual jigsaw game — replaces the plain full-size photo `PuzzleScreen`
used to show. Cuts `imageSource` into interlocking pieces (real rounded
tab/blank shapes via Skia clip paths, not rectangles — see
[[pieceShapes]]), scrambles them, and lets the player drag pieces back
into place. All state lives in this component's own `useState`/`useRef` —
nothing persists once `PuzzleScreen` unmounts it, which is deliberate: the
puzzle is meant to be forgotten and re-scrambled next time it's opened,
not resumed.

## How it works

**Layout.** On mount, the wrapping `View` measures itself via `onLayout`.
Once a non-zero size is known, `generatePuzzleGrid(rows, columns,
boardWidth, boardHeight)` builds the piece list, and each piece gets a
random scrambled starting position within the board's bounds
(`Math.random`, uninjectable — see Non-goals). This only runs once per
mount (guarded by `pieces` already being set): the board doesn't
re-scramble if it happens to resize later.

**Rendering.** One Skia `<Canvas>` containing one `<Group>` per piece.
Each `Group`'s `clip` is the piece's outline
(`pathCommandsToSvgPath(piece.path)`, a plain SVG path string — see
[[pathCommandsToSvgPath]]) and its `transform` is
`[{translateX: piece.x}, {translateY: piece.y}]`, i.e. the piece's current
on-screen position. Inside every `Group`, the *entire* board image is
drawn at the same computed [[coverRect]] rect, offset by
`-piece.descriptor.targetX`/`-targetY`. Working through the coordinate
spaces: the clip is defined in the piece's own local space (0,0 = that
piece's own top-left corner); translating the whole `Group` by
`piece.x`/`piece.y` moves the clip to its current on-screen position
without moving *where in the photo* it's sampling from, because the image
inside is offset independently by the piece's *target* position — that's
what makes a piece keep showing the same slice of the photo as it's
dragged around, while showing the *correct* slice once it lands on its
target.

**Touch handling.** No `PanResponder`, no gesture library — the outer
`View` uses the low-level Responder System directly (same choice as
[[Slider]], and for the same reason: this doesn't need gesture math,
just a touch position). There's exactly one responder for the whole
board, not one per piece (Skia's canvas has no per-shape touch targets of
its own):

- `onResponderGrant`: hit-tests the touch point against every *unplaced*
  piece's rectangular bounding box (not its actual clipped shape — a tab's
  overhang is small and this is meant to be forgivable, not precise),
  searching from the end of the `pieces` array backward so an overlapping
  pile prefers whichever piece was most recently brought to front. The
  grabbed piece is immediately moved to the end of the array (renders on
  top of everything for the rest of the gesture).
- `onResponderMove`: updates just that piece's `x`/`y`, offset by where
  within the piece it was originally grabbed (so the piece doesn't jump to
  center itself under the finger).
- `onResponderRelease`: if the piece's distance from its `targetX`/`targetY`
  is within `SNAP_DISTANCE` (40px), it snaps exactly onto the target and
  is marked `placed` (excluded from further hit-testing — it's locked in
  place). Otherwise it just stays wherever it was dropped, still
  draggable.

**Solved detection** is a separate `useEffect` watching `pieces`, not
something decided inside the release handler itself — an earlier version
called `onSolved` from inside `setPieces`'s updater function, which React
warns against (scheduling one component's update from inside another's
render/update cycle) since `onSolved` typically triggers a *parent's*
state update. `solvedRef` guards against calling `onSolved` more than once
per mount.

## Interface

| Name | Type | Required | Notes |
|------|------|----------|-------|
| `imageSource` | `number \| string` | Yes | The source image, in whatever shape Skia's `useImage` accepts: a bundled asset module (`require()`d number) for a starter puzzle, or a `file://` URI string for a parent-uploaded photo. Resolved by [[puzzleImage]] before it reaches here. |
| `rows` | `number` | No | Defaults to `2`. |
| `columns` | `number` | No | Defaults to `2`. |
| `onSolved` | `() => void` | No | Called once, the moment every piece is placed. |

## Toddler UX constraints

- `SNAP_DISTANCE` (40px) is deliberately generous — a piece doesn't need
  to be dropped pixel-precisely on its target, just roughly near it.
- Hit-testing uses each piece's full rectangular bounding box, not its
  exact (smaller, oddly-shaped) clipped silhouette — easier to grab than
  the visible shape alone would allow.
- A default 2x2 grid (4 large pieces) keeps individual pieces big — no
  explicit minimum touch-target size is enforced beyond "the board is
  divided by a small `rows`/`columns`," but the default is chosen with
  that in mind.
- No audio feedback on snap/solve — same known gap as the rest of the app
  (no sound-effect pipeline, only background music).

## Edge cases & expected behavior

- Grabbing an area with no piece under it (or only *placed* pieces under
  it) → no-op; nothing is set as dragging.
- Dropping a piece far from its target → it stays exactly where dropped,
  remains grabbable on the next touch.
- All pieces placed → `onSolved` fires exactly once, even if `pieces`
  updates again afterward (e.g. from further no-op drags).
- Board resizes after the initial layout → grid is not regenerated;
  pieces keep their already-assigned pixel positions/targets from the
  original size.

## Test scenarios

1. Dropping all pieces on their correct targets, one at a time, calls
   `onSolved` exactly once — verified with `Math.random` mocked to `0` so
   every piece starts stacked at the origin and hit-testing order is
   deterministic (topmost = last-generated-in-row-major-order first).
2. Dropping a piece far from its target does not place it — proven by
   then placing it correctly afterward along with the rest and confirming
   `onSolved` still only fires once (i.e. the earlier wrong drop wasn't
   silently counted as a placement).

Both tests run against `__mocks__/@shopify/react-native-skia.js` (see
Non-goals) — they exercise the drag/hit-test/snap/solve logic on the
outer `View`'s Responder System props directly, not any actual Skia
rendering.

## Non-goals / known limitations

- **No real Skia rendering is tested.** `@shopify/react-native-skia` needs
  either a native binding or a CanvasKit/WASM instance to do anything real
  (the library ships jest tooling for the latter, requiring
  `canvaskit-wasm` and a custom `testEnvironment` that conflicts with this
  project's existing RN jest preset environment) — not worth the
  complexity here. The manual mock
  (`__mocks__/@shopify/react-native-skia.js`) renders inert `View`s so the
  component mounts, which is enough because all of this component's
  actual *logic* lives on the plain `View`'s Responder System, not inside
  the Skia tree. The piece geometry itself (the part that could actually
  look wrong) is separately verified by `pieceShapes`' unit tests plus a
  rendered SVG preview artifact — see [[generatePuzzleGrid]]'s spec.
- Scramble positions use bare `Math.random()`, not an injectable function
  like `generatePuzzleGrid`'s `random` parameter — tests work around this
  by mocking `Math.random` globally rather than passing a seed in. Worth
  reconsidering if this component grows more randomness-dependent tests.
- No persisted or resumable state, by design — see Purpose.
- Requires a native rebuild (`@shopify/react-native-skia` is a native
  module) to actually run; can't be verified running on a device/simulator
  from this environment.

## Related

- Code: `src/games/puzzle/components/PuzzleBoard.tsx`
- Tests: `src/games/puzzle/components/PuzzleBoard.test.tsx`
- Mock: `__mocks__/@shopify/react-native-skia.js`
- Related specs: [[pieceShapes]], [[generatePuzzleGrid]], [[pathCommandsToSvgPath]], [[coverRect]], [[Slider]], [[PuzzleScreen]], [[puzzleImage]]
