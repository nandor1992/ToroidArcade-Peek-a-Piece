---
name: gameMarkGeometry
type: service
source: src/components/gameMarkGeometry.ts
status: draft
last_verified: 2026-09-22
---

# gameMarkGeometry

## Purpose

The vector geometry behind [[GameMark]] — the Family Puzzle and Family
Memory marks on the picker — as plain data, with no React and no Skia in
sight.

**This file is generated. Do not edit it by hand.** It is written by
`scripts/generate-game-marks.js`; the interesting content is that script,
and this spec describes both.

The reason it is generated rather than drawn is that both marks are
*derived* from `resources/peekapiece-mark.svg` rather than merely inspired
by it. The eyes keep the brand mark's exact proportions and the jigsaw
knobs are its own bezier curve remapped onto new seams. Keeping the
derivation in code means a change to the brand art is a re-run, not another
round of hand-transcribing bezier data — which is what the native launcher
icons required (see `docs/architecture.md`).

## How it works

### What the generator derives from the brand mark

- **The knob profile.** The brand mark's right-hand knob, re-expressed as
  `(t, d)` pairs where `t` runs 0..1 along an edge and `d` is the outward
  perpendicular offset, both normalised by cell size. Feeding a single cell
  through it reproduces the mark's own piece path almost exactly. It can
  then be mapped onto any edge, in either direction.
- **The eyes.** Radius 0.198 of the shape's width, centres 0.448 apart,
  catchlight up-and-left at 0.060/0.069 with radius 0.060 — all measured
  off the brand mark.
- **The burial.** The app icon hides 16 of each eye's 46 radius behind the
  piece. Both marks place their eyes so the artwork hides that same 34.8%.
- **The drop shadow.** The mark pairs each shape with a darker copy offset
  10px down. `shade()` reproduces the mark's own `#2EC4B6 -> #1FA396` as a
  0.82 multiply, so each piece colour gets a matching under-shade without
  inventing new brand colours.

### The two marks

**Puzzle** is a 2x2 block at cell size 150, in the four brand piece colours
(teal, coral, violet, leaf). Each interior seam is built once and reused
*reversed* by the neighbouring piece, which is what makes the pieces
genuinely interlock rather than merely look like they might. All four
shades are emitted before all four bodies, so the offset copies show
through the seams and read as depth.

**Memory** is two rounded cards fanned at mirrored ±11°. The mirroring is
load-bearing: it puts both cards' top edges at the same height under each
eye, so the two eyes are buried by equal amounts. Between the cards sits
the app icon's piece silhouette at 30% navy, scaled 0.34 and centred on the
back card — the face-down card's back pattern.

### What it emits

Absolute coordinates in a 512x512 space (`MARK_CANVAS`) with **every
rotation already baked in**, so the runtime applies one uniform scale and
never has to care whether Skia measures rotation in degrees or radians.
Cards are emitted as paths (rounded corners via the standard 0.5523 bezier
constant), not rects, for the same reason.

`shapes` are in draw order, over the eyes.

## Interface

| Export | Type | Notes |
|--------|------|-------|
| `MARK_CANVAS` | `number` | 512 — the square the coordinates are authored in. |
| `PUZZLE_MARK` | `GameMarkGeometry` | 8 shapes (4 shades, 4 bodies), 2 eyes. |
| `MEMORY_MARK` | `GameMarkGeometry` | 5 shapes (2 cards + backing art), 2 eyes. |
| `EYE_COLOR` | `string` | Brand navy `#26385A`. |
| `EYE_HIGHLIGHT_COLOR` | `string` | `#FFFFFF`. |
| `GameMarkGeometry` | type | `{ shapes: MarkShape[]; eyes: MarkEye[] }`. |
| `MarkShape` | type | `{ d: string; fill: string; opacity?: number }` — `d` is SVG path data, taken directly by Skia's `<Path>`. |
| `MarkEye` | type | `{ cx, cy, r, highlight: { cx, cy, r } }`. |

## Toddler UX constraints

None directly — it is data. The constraints it serves belong to
[[GameMark]] and [[GameSelectScreen]]: the marks must read without text and
must be distinguishable from each other at a glance, which is why the
puzzle mark carries four colours and the memory mark two.

## Edge cases & expected behavior

- Every path starts with `M`, ends with `Z`, and contains no `NaN`,
  `undefined` or `Infinity`.
- Both marks fit inside 0..512 on both axes and are centred there to within
  12 units, so the two sit optically level side by side on the picker.
- Each mark has exactly two eyes, level with each other (equal `cy`, equal
  `r`) and symmetric about x=256.
- Each catchlight sits up and to the left of its iris centre and fits
  entirely inside the iris.
- Measured on the flattened path outlines, the artwork directly beneath
  each eye hides exactly 16/46 of that eye's radius — in **both** marks and
  for **all four** eyes.
- The puzzle mark's fills include all four brand piece colours.
- Every opaque shape is one of a shade/body pair, so the opaque count is
  even and each shade is darker than the body over it.
- Re-running the generator on unchanged inputs produces a byte-identical
  file.

## Test scenarios

`src/components/gameMarkGeometry.test.ts` asserts each of the edge cases
above against the emitted data. They deliberately lock the *derivation*
rather than the literal numbers: if someone regenerates after changing the
brand art, a mark that has drifted off the brand's proportions fails rather
than shipping quietly.

The burial check flattens each path (M/L/C/Z) into a polyline and measures
where the outline actually crosses the eye's vertical centre line — a flat
top edge has no control point above the eye, so sampling control points
alone gets the wrong answer.

## Non-goals / known limitations

- **Not hand-editable.** Edits are overwritten by the next generator run.
  Change `scripts/generate-game-marks.js` instead.
- The generator is not wired into any build step or pre-commit hook; it is
  run by hand when the brand art changes. That is deliberate — it runs
  roughly never, and the output is committed and tested.
- The generator emits only these two marks. A third game means a third
  entry there.
- Coordinates are rounded to one decimal place, so a re-derivation can
  differ from a hand-transcription of the same curve in the last digit.

## Related

- Code: `src/components/gameMarkGeometry.ts` (generated)
- Generator: `scripts/generate-game-marks.js`
- Tests: `src/components/gameMarkGeometry.test.ts`
- Brand source: `resources/peekapiece-mark.svg`, `resources/peekapiece-icon.svg`
- Related specs: [[GameMark]], [[GameSelectScreen]]
