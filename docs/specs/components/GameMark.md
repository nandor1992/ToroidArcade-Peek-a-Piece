---
name: GameMark
type: component
source: src/components/GameMark.tsx
status: draft
last_verified: 2026-09-22
---

# GameMark

## Purpose

The illustrated mark for one game on [[GameSelectScreen]] — a 2x2 jigsaw
block for Family Puzzle, a fanned pair of cards for Family Memory, each
with the Peek-a-Piece eyes peeking over the top.

These replaced generic Material Design glyphs (`puzzle`, `cards`). A
toddler picks a game by picture, so the picture is the whole interface on
that screen; a stock line icon says "some app's settings menu", while
these say *this* app. Both marks are built from
`resources/peekapiece-mark.svg`, so the picker looks like it belongs to
the same product as the launcher icon.

## How it works

A lookup from `name` to a [[gameMarkGeometry]] record, drawn into a Skia
`<Canvas>`:

1. Eyes first — for each eye, a navy `<Circle>` for the iris and a white
   one for the catchlight.
2. Then every shape in `shapes` order, as `<Path>` elements taking the
   geometry's SVG path strings directly.

The order is the point: the shapes are drawn *over* the eyes, so each eye's
bottom third is hidden and it reads as peeking over the artwork. That is
the brand's core device, and it is purely a draw-order effect — there is no
masking or clipping.

The whole thing sits inside one `<Group>` with a single
`{ scale: size / MARK_CANVAS }` transform. Nothing else is transformed at
runtime: the geometry is authored in absolute 512-space with every rotation
already baked in, which sidesteps the question of whether Skia measures
rotation in degrees or radians.

**Why Skia rather than PNGs.** Skia is already a dependency ([[PuzzleBoard]]
uses it) and `WithSkiaWeb` already gates the web build, so nothing new is
pulled in. The marks stay vector at every screen density with no rasterising
step — which matters concretely, because there is no SVG rasteriser
installed on the machine this project is developed on (see
`docs/architecture.md`; the native launcher icons had to be hand-transcribed
into a PowerShell drawing script for exactly this reason).

The root is a plain `View` marked `accessibilityElementsHidden` /
`importantForAccessibility="no-hide-descendants"`, the same arrangement as
[[Icon]]: the mark is decoration, and the `Pressable` around it carries the
label.

## Interface

| Name | Type | Required | Notes |
|------|------|----------|-------|
| `name` | `'puzzle' \| 'memory'` | Yes | Which mark to draw. |
| `size` | `number` | No | Rendered square in dp. Default 96. |

## Toddler UX constraints

- None of its own — it always sits inside a large, already-labelled
  `Pressable` that owns the touch target and the accessibility label.
- It has to read as *a jigsaw* and *a pair of cards* at a glance, without
  text. The four brand piece colours on the puzzle mark against two on the
  memory mark is a deliberate second channel for telling them apart, on top
  of the silhouettes.
- Hidden from screen readers so the tile announces once, not twice.

## Edge cases & expected behavior

- `size` omitted → renders at 96.
- `size` of 0 or less → the canvas has no area and nothing is visible.
  `GameSelectScreen` guards against this by not rendering the mark until
  its tile has been measured.
- Both marks draw every eye before every shape; a change that reordered
  them would leave the eyes floating on top of the artwork.
- The geometry is imported data, not computed here, so the same `name`
  always renders the same picture regardless of size.

## Test scenarios

1. `<GameMark name="puzzle" />` renders 8 paths and 4 circles (two per eye).
2. `<GameMark name="memory" />` renders 5 paths and 4 circles.
3. `<GameMark name="puzzle" size={128} />` puts a single
   `{ scale: 128 / 512 }` transform on its group.
4. `size={64}` lays out a 64x64 frame.
5. Walking the rendered tree in order, every circle precedes every path.
6. Exactly two circles carry `EYE_COLOR`; the other two are catchlights.

## Non-goals / known limitations

- Two marks only. A third game means adding geometry to the generator, not
  a new component.
- No animation, no press state — the tile handles press feedback by
  fading itself.
- No colour override. The marks are the brand's own palette by definition;
  a tintable version would be a different component.
- Rendering costs a Skia canvas per tile. That is two canvases on one
  static screen, which is not a concern, but it is why the marks are not
  used for small inline icons — [[Icon]] still covers those.

## Related

- Code: `src/components/GameMark.tsx`
- Tests: `src/components/GameMark.test.tsx`
- Geometry: `src/components/gameMarkGeometry.ts` (generated)
- Generator: `scripts/generate-game-marks.js`
- Mock: `__mocks__/@shopify/react-native-skia.js`
- Related specs: [[gameMarkGeometry]], [[GameSelectScreen]], [[Icon]], [[PuzzleBoard]]
