---
name: memorySizes
type: game
source: src/games/memory/memorySizes.ts
status: draft
last_verified: 2026-09-22
---

# memorySizes

## Purpose

The picture counts a parent can choose from for Family Memory, and the
default. The direct counterpart of [[puzzleSizes]], and the single place
the difficulty ladder is defined so Settings and the game can't disagree
about it.

Since the memory game gained a landing page, this is also the **round
size**: it's what [[buildMemoryGroups]] chunks the photo pool by, so
changing it re-groups the pool and changes the tiles on
[[MemoryHomeScreen]], not just the size of one game.

## How it works

A frozen list of `{ label, pictures }`. `pictures` is the number of
*distinct* pictures dealt; each appears on two cards, so the board holds
`pictures * 2`. The label is the bare count — Settings renders it as
"<n> pictures" for accessibility.

Options are 3, 4, 6, 8 and 10 pictures (6 to 20 cards).
`DEFAULT_MEMORY_SIZE` is the 6 entry, i.e. a twelve-card board.

The top end stops at 10 deliberately: past ten pairs the cards get too
small on a phone to recognise a face, and recognising the face is the
whole point of using family photos.

`findMemorySize(label)` resolves a stored label back to an option, falling
back to the default — the same shape as `findPuzzleSize`, ready for
whenever Settings choices start being persisted.

## Interface

| Export | Type | Notes |
|--------|------|-------|
| `MemorySize` | type | `{ label: string; pictures: number }`. |
| `MEMORY_SIZES` | `readonly MemorySize[]` | 3, 4, 6, 8, 10. |
| `DEFAULT_MEMORY_SIZE` | `MemorySize` | The 6 entry. |
| `findMemorySize` | `(label: string) => MemorySize` | Falls back to the default. |

## Toddler UX constraints

None directly — it's data. It exists to keep the lowest option (3 pairs)
genuinely clearable by a two-year-old, and the highest one still legible.

## Edge cases & expected behavior

- `findMemorySize` with an unknown label → `DEFAULT_MEMORY_SIZE`.
- `DEFAULT_MEMORY_SIZE.pictures` is 6.
- A round may end up smaller than the chosen count when the pool doesn't
  divide evenly, or larger by one when a single picture would otherwise be
  orphaned — see [[buildMemoryGroups]].

## Test scenarios

Covered through `SettingsScreen.test.tsx` (every option renders as a chip,
the current one is selected, picking one reports it, and the default is 6)
and [[MemoryBoard]]'s count tests.

## Non-goals / known limitations

- Not persisted: like every other Settings choice, it resets on relaunch.
- No per-child profiles.
- The counts are fixed; there's no free-entry number.

## Related

- Code: `src/games/memory/memorySizes.ts`
- Related specs: [[MemoryBoard]], [[buildMemoryGroups]], [[buildMemoryDeck]], [[MemoryHomeScreen]], [[SettingsScreen]], [[puzzleSizes]]
