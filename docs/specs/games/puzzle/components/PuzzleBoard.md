---
name: PuzzleBoard
type: game
source: src/games/puzzle/components/PuzzleBoard.tsx
status: draft
last_verified: 2026-08-30
---

# PuzzleBoard

## Purpose

The actual jigsaw game — replaces the plain full-size photo `PuzzleScreen`
used to show. Cuts `imageSource` into interlocking pieces (real rounded
tab/blank shapes via Skia clip paths, not rectangles — see
[[pieceShapes]]), scatters them around the edges of the play area, and
lets the player drag them back together. Pieces snap to their final spot
*or* to a matching neighbour; connected pieces drag as one; a piece
landed in its final place is locked. All state is local — nothing
persists once `PuzzleScreen` unmounts it, and a new puzzle / the Reset
button remounts the component to re-scatter.

## How it works

**The play area and the picture box.** The wrapping `View` fills the whole
screen below the header and measures itself via `onLayout` — that's the
coordinate space pieces live in. The *assembled* picture, though, only
occupies a centred box that is the image's own aspect ratio and no more
than **60% of the play area** in either dimension (`fitPuzzleBox`,
`MAX_PUZZLE_FRACTION`). So there's always a margin around it to scatter
pieces into, and the finished puzzle never fills the screen.

**Building the grid.** Once the play-area size *and* the image are known
(so the box can be computed), `generatePuzzleGrid(rows, columns,
box.width, box.height)` builds the piece list. Descriptor `targetX`/`Y`
are local to the box; each piece stores its **absolute** target
(`box.originX + descriptor.targetX`, …). Each piece is then given a random
start position via `scatterPosition` — a point anywhere in the play area
whose *centre* is outside the picture box (rejection-sampled), i.e. toward
the edges. This runs once per mount.

**Rendering.** One Skia `<Canvas>` sized to the play area, one `<Group>`
per piece. The `Group`'s `clip` is the piece outline
(`pathCommandsToSvgPath`, local space — see [[pathCommandsToSvgPath]]) and
its `transform` translates by the piece's absolute `x`/`y`. Inside, the
*whole* image is drawn at `box.width` x `box.height` (its natural aspect,
undistorted), offset by `-descriptor.targetX`/`-targetY` — so each piece
samples its correct slice regardless of where it currently sits. When the
dragged group is within snapping range, an extra stroked `<Path>` per
piece draws a teal outline around it as a "ready to snap" cue.

**Touch handling** — the low-level Responder System on the outer `View`
(same choice as [[Slider]]), one responder for the whole board:

- `onResponderGrant`: hit-tests the touch against each piece's rectangular
  bounding box, from the end of the array backward (topmost first),
  skipping any piece that's `placed`. The whole grabbed *group* is moved
  to the end of the array so it renders on top.
- `onResponderMove`: translates every piece in the dragged group by the
  delta since the last touch point.
- `onResponderRelease`: `bestSnap` finds the smallest translation (within
  `snapDistance`) that lands some piece of the group either on its own
  absolute target *or* correctly against a piece of another group; if
  found, the group is moved by it. Then `mergeAlignedGroups` unions any
  groups whose bordering pieces are now correctly positioned (repeated to
  a fixpoint, snapping each newly-joined group into exact alignment), and
  `markPlaced` flags every piece now sitting on its target. Nothing in
  range → the group stays where it was dropped.
  `snapDistance` is `max(18, min(pieceWidth, pieceHeight) * 0.4)` — a
  fraction of the piece size, so it's generous on a 2x2 grid without
  overlapping neighbouring targets on a fine 6x5 one, floored at 18px.

**Locking.** A `placed` piece (on its exact target) is skipped by
hit-testing — it can't be picked up again. Building outward from a placed
piece therefore locks each addition as it snaps home. A group that's only
snapped to *floating* neighbours (none on target) stays fully draggable.
Reset (a remount) is the only way to unstick everything.

**Snap-ready highlight.** A `useEffect` on `[pieces, draggingGroupId]`
runs the same `bestSnap` check on the current positions and sets
`snapReady`; that drives the teal outline in the render.

**Solved detection** is a separate `useEffect` watching `pieces`: the
puzzle is solved when every piece is in **one group** (whether that group
ended up on the targets or assembled off to the side). `solvedRef` guards
`onSolved` to once per mount. It's an effect, not part of the release
handler, because `onSolved` schedules a parent state update.

## Interface

| Name | Type | Required | Notes |
|------|------|----------|-------|
| `imageSource` | `number \| string` | Yes | The source image, in whatever shape Skia's `useImage` accepts: a bundled asset module (`require()`d number) for a starter puzzle, or a `file://` URI string for a parent-uploaded photo. Resolved by [[puzzleImage]] before it reaches here. |
| `rows` | `number` | No | Piece rows. Defaults to `2`. |
| `columns` | `number` | No | Piece columns. Defaults to `2`. |
| `onSolved` | `() => void` | No | Called once, when every piece is in a single connected group. |

## Toddler UX constraints

- The assembled picture is capped at 60% of the play area so pieces stay a
  comfortable size and there's room to scatter them clear of it.
- `snapDistance` scales with piece size and is deliberately generous — a
  piece just needs to land roughly near where it belongs, and it snaps to
  a matching *neighbour*, not only to its exact final slot.
- The teal "ready to snap" outline tells a child a drop will connect
  before they let go.
- A piece that's home is locked, so it can't be knocked back out by a
  stray drag; only the Reset button (a remount) scatters everything again.
- Hit-testing uses each piece's rectangular bounding box, not its exact
  clipped silhouette — easier to grab.
- Grid size comes from the parent (`rows`/`columns`, default 2x2 — see
  [[puzzleSizes]]); the bigger options are a deliberate parent choice.
- No audio feedback on snap/solve (no sound-effect pipeline).

## Edge cases & expected behavior

- Grabbing empty space, or a spot where only `placed` pieces sit → no-op.
- Dropping a group with nothing in snap range → it stays exactly where
  dropped, still draggable.
- Placing a piece on its exact target → it's locked; a further drag from
  its location does nothing (a neighbouring piece can still be grabbed).
- Snapping a piece to a *floating* neighbour → the two form a group that
  still drags freely (not locked until it reaches the targets).
- Every piece in one group → `onSolved` fires exactly once, even if
  `pieces` updates again afterward.
- Board resizes after initial layout → grid is not regenerated.

## Test scenarios

1. Assembling all pieces on their targets, one at a time, calls `onSolved`
   exactly once — `Math.random` mocked to `0` so every piece scatters to
   the origin and hit-test order is deterministic.
2. A piece placed on its target is locked: dragging from its location does
   nothing, and the puzzle still completes with the other pieces (proving
   it didn't move).
3. A piece dropped far from everything doesn't connect — proven by placing
   it correctly afterward and `onSolved` still firing once.

Tests run against `__mocks__/@shopify/react-native-skia.js` (see
Non-goals) — they drive the drag/snap/merge/solve logic on the outer
`View`'s Responder System props directly.

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
  — tests mock `Math.random` globally.
- `scatterPosition` rejection-samples and, if it can't find a spot outside
  the picture box in 30 tries, falls back to (0, 0). That only happens
  when `random` is degenerate (i.e. in tests); with real randomness the
  ~64% of the area outside the box is found immediately.
- The snap-ready highlight and the merged-group snapping are only
  exercised indirectly by the mock-backed tests; how they actually *look*
  needs a native build.
- No persisted or resumable state, by design — see Purpose.
- Requires a native rebuild (`@shopify/react-native-skia` is a native
  module) to actually run; can't be verified running on a device/simulator
  from this environment.

## Related

- Code: `src/games/puzzle/components/PuzzleBoard.tsx`
- Tests: `src/games/puzzle/components/PuzzleBoard.test.tsx`
- Mock: `__mocks__/@shopify/react-native-skia.js`
- Related specs: [[pieceShapes]], [[generatePuzzleGrid]], [[pathCommandsToSvgPath]], [[Slider]], [[PuzzleScreen]], [[puzzleImage]], [[puzzleSizes]]
