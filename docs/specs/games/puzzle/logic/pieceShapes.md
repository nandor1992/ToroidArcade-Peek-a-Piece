---
name: pieceShapes
type: service
source: src/games/puzzle/logic/pieceShapes.ts
status: draft
last_verified: 2026-08-25
---

# pieceShapes

## Purpose

The actual jigsaw-tab geometry — turns a piece's four edge types (flat,
tab, blank) into a drawable outline. Deliberately framework-agnostic (no
Skia/React Native imports): it's pure coordinate math, so it can be fully
unit-tested without any native rendering, and reused by both the real game
board and the dev-only SVG preview used to sanity-check the shapes visually
before wiring up Skia.

## How it works

`buildPiecePath(width, height, edges)` walks a piece's boundary clockwise
starting from (0, 0) — top edge, right edge, bottom edge, left edge — and
returns a flat list of `PathCommand`s (`moveTo` / `lineTo` / `cubicTo` /
`close`) describing it. A `flat` edge (used on the outer border of the
whole photo, where there's no neighboring piece) is just a straight line.

A `tab`/`blank` edge is a single rounded knob, not a classic double-curve
"mushroom" tab — see Non-goals for why. For a given edge, `addEdge` derives
its direction and outward normal generically (rotate the edge's direction
90° clockwise), so the same code handles all four sides without
special-casing top/right/bottom/left. The knob bulges by
`BUMP_DEPTH_RATIO` (28%) of the edge's own length, `sign`ed by tab (+1,
bulges away from the piece) or blank (-1, dents into it), with a flat
`BUMP_HALF_WIDTH_RATIO`-wide (14%) plateau at the peak so it reads as a
rounded knob rather than a spike.

Because both directions and depths scale off the edge's own length, tabs
on a wide edge and tabs on a narrow edge (non-square pieces) each look
proportionate, and a tab on one piece's edge and the matching blank on its
neighbor's edge always use the exact same length/depth — same board,
same cell size, so the two edges are true mirrors and close up with no
gap. `generatePuzzleGrid` is what decides which pieces get tab vs. blank
on each shared edge.

## Interface

| Name | Type | Notes |
|------|------|-------|
| `buildPiecePath(width, height, edges)` | `(number, number, PieceEdges) => PathCommand[]` | Builds one piece's outline in its own local space — `(0,0)` is that piece's own top-left corner. |
| `PieceEdges` | `{ top, right, bottom, left: EdgeType }` | — |
| `EdgeType` | `'flat' \| 'tab' \| 'blank'` | — |
| `PathCommand` | tagged union | `moveTo`/`lineTo` (`x,y`), `cubicTo` (`c1x,c1y,c2x,c2y,x,y`), `close`. |

## Edge cases & expected behavior

- All four edges `flat` → the path is exactly a rectangle (no cubics at
  all).
- Any non-flat edge always ends with a `lineTo` landing exactly on the
  next corner — no gaps between sides regardless of edge type mix.
- A `tab` bulges outward (away from the piece's own interior); a `blank`
  bulges inward, by the same depth, opposite sign.

## Test scenarios

1. All-flat edges → path equals the exact expected 4-corner rectangle
   command sequence.
2. Each side's final command lands on the correct next corner, for a
   piece with a mix of tab/blank edges.
3. A `tab` edge's peak (the plateau `lineTo` between the two cubics) has
   negative offset on the piece's top edge (outward = up); a `blank`'s
   peak has positive offset (inward = down) — verified by scoping to just
   that edge's 5 contributed commands, not the whole path, since the
   piece's other sides also contribute non-zero y-values that would
   otherwise contaminate a naive "check every command" assertion.
4. Tab and blank peaks are exactly negatives of each other for edges of
   the same length.

## Non-goals / known limitations

- Not a classic "mushroom" jigsaw tab (narrower neck than head, with an
  overhang) — this is a simpler, guaranteed-non-self-intersecting rounded
  knob. Chosen deliberately: a true mushroom tab needs the curve to be
  non-monotonic along the edge direction near the peak, which is much
  easier to get subtly wrong (self-intersecting or lopsided) without being
  able to visually iterate in this environment. See the artifact preview
  linked from `generatePuzzleGrid`'s spec for what the current shape
  actually looks like.
- No jitter/randomized irregularity in tab size or position along the
  edge — every tab/blank on a same-length edge looks identical apart from
  which side it's on. Real hand-cut jigsaw puzzles vary piece to piece;
  this doesn't.
- No control over depth/width ratios per puzzle — they're fixed constants,
  not exposed as a difficulty knob.

## Related

- Code: `src/games/puzzle/logic/pieceShapes.ts`
- Tests: `src/games/puzzle/logic/pieceShapes.test.ts`
- Related specs: [[generatePuzzleGrid]], [[pathCommandsToSvgPath]]
