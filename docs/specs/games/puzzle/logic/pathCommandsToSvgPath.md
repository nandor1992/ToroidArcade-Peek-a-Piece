---
name: pathCommandsToSvgPath
type: service
source: src/games/puzzle/logic/pathCommandsToSvgPath.ts
status: draft
last_verified: 2026-08-25
---

# pathCommandsToSvgPath

## Purpose

Turns a piece's `PathCommand[]` (from [[pieceShapes]]) into an SVG path
`d` string. This isn't just a debug convenience — Skia's `Group` `clip`
prop accepts a path string directly (`ClipDef = SkRRect | SkRect |
PathDef`, `PathDef = string | SkPath`), so this is the real mechanism
[[PuzzleBoard]] uses to cut each piece's shape out of the board image.
There's no separate `SkPath`-object construction anywhere in this game.

## How it works

A straight `map` + `join(' ')` over the command list: `moveTo` → `M x y`,
`lineTo` → `L x y`, `cubicTo` → `C c1x c1y, c2x c2y, x y`, `close` → `Z`.
No validation — it trusts the input is already a well-formed, closed path
(which `buildPiecePath` always produces).

## Interface

| Name | Type | Notes |
|------|------|-------|
| `pathCommandsToSvgPath(commands)` | `(PathCommand[]) => string` | — |

## Edge cases & expected behavior

- Empty input → empty string (not tested explicitly, but falls out of
  `[].map().join(' ')` trivially — not worth a dedicated test since
  `buildPiecePath` never actually produces an empty list).

## Test scenarios

1. A flat-edged rectangle serializes to the exact expected `M ... L ... Z`
   string.
2. A path with cubic segments starts with `M 0 0`, contains `C `, ends
   with `Z`, and has exactly one `C` per cubic command.

## Non-goals / known limitations

- No round-trip parsing (SVG string back to `PathCommand[]`) — one
  direction only, since nothing in this app needs the reverse.

## Related

- Code: `src/games/puzzle/logic/pathCommandsToSvgPath.ts`
- Tests: `src/games/puzzle/logic/pathCommandsToSvgPath.test.ts`
- Related specs: [[pieceShapes]], [[PuzzleBoard]]
