---
name: puzzleImage
type: service
source: src/utils/puzzleImage.ts
status: draft
last_verified: 2026-08-29
---

# puzzleImage

## Purpose

A puzzle's artwork can come from two places — a bundled starter asset
shipped with the app, or a photo the parent picked from their library —
and the two need different wrapping depending on who's loading them
(`<Image source>` vs Skia's `useImage`). This module is the one place that
knows the rules, so `HomeScreen`, `PuzzleScreen`, and anything added later
don't each re-implement the `imageAsset` / `imageUri` / nothing check.

## How it works

Both functions take a `Puzzle` and look at the same two optional fields, in
the same priority order:

1. `imageAsset` (a `require()`d image module — a number at runtime) wins if
   it's set. The check is `!= null`, not truthiness, so a Metro asset id of
   `0` still counts as "has artwork".
2. else `imageUri` (a `file://` / content URI string from `ParentScreen`).
3. else the puzzle has no artwork.

`puzzleImageSource` returns what React Native's `<Image source>` prop
wants: the asset module as-is, or `{ uri }` for a photo, or `undefined`.

`puzzleSkiaSource` returns what `@shopify/react-native-skia`'s `useImage`
wants: the asset module as-is, or the bare URI string, or `undefined`.

Callers treat `undefined` as "render the 🧩 emoji fallback, don't mount a
`PuzzleBoard`" — there's no source image to cut into jigsaw pieces.

## Interface

| Name | Type | Notes |
|------|------|-------|
| `puzzleImageSource(puzzle)` | `(Puzzle) => ImageSourcePropType \| undefined` | For `<Image source>`. |
| `puzzleSkiaSource(puzzle)` | `(Puzzle) => number \| string \| undefined` | For Skia `useImage`. |

## Toddler UX constraints

None directly — this is a pure helper with no UI. The behavior it enables
(starter puzzles showing real pictures and opening as real jigsaws instead
of bare emoji tiles) is covered in [[HomeScreen]] and [[PuzzleScreen]].

## Edge cases & expected behavior

- `imageAsset` set → returned as-is by both functions, `imageUri` ignored
  even if also present.
- `imageAsset` is `0` → still treated as present (guard is `!= null`).
- only `imageUri` set → `{ uri }` from `puzzleImageSource`, the raw string
  from `puzzleSkiaSource`.
- neither set → both return `undefined`.

## Test scenarios

Covered by `src/utils/puzzleImage.test.ts` (plain unit tests, no renderer):

1. Asset-backed puzzle → both functions return the asset module.
2. Photo-backed puzzle → `{ uri }` vs bare string respectively.
3. Artless puzzle → both return `undefined`.
4. `imageAsset: 0` → still returned, not treated as absent.

## Non-goals / known limitations

- Doesn't validate that `imageUri` is a well-formed or reachable URI — a
  bad string is passed straight through to the image loader, same as
  before this helper existed.
- Doesn't dedupe or cache anything; it's a plain field lookup per call.

## Related

- Code: `src/utils/puzzleImage.ts`
- Tests: `src/utils/puzzleImage.test.ts`
- Types: `src/types/puzzle.ts`
- Related specs: [[HomeScreen]], [[PuzzleScreen]], [[PuzzleBoard]]
