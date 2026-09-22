---
name: MemoryHomeScreen
type: screen
source: src/screens/MemoryHomeScreen.tsx
status: draft
last_verified: 2026-09-22
---

# MemoryHomeScreen

## Purpose

The Family Memory landing page — the memory counterpart of [[HomeScreen]]'s
puzzle grid, and the screen the "Family Memory" tile now opens.

Memory is played with a *set* of pictures, not one, so the unit of choice
is a round rather than a photo. Before this, picking Family Memory dropped
you straight into a single game with no way to play a different set. Now
the photo pool is split into rounds ([[buildMemoryGroups]]), each gets a
tile, and picking one opens it — with next/previous paging between rounds
from inside the game, exactly as the jigsaw pages between photos.

## How it works

Structurally a copy of [[HomeScreen]], deliberately: same full-bleed
`home-bg.jpg` backdrop at `opacity: 0.5`, same `AppHeader` (titled "Family
Memory", with a back chevron to the game picker), same `FlatList` of
chunked rows, same `columnsForViewport` breakpoints (4 across at >= 700dp,
3 at >= 520, otherwise 2; halved in portrait, floored at 2), same
`key={cols-n}` re-chunking on rotation, same short-row spacers, same
low-contrast corner "Parent controls" button.

Keeping the two landing pages identical in layout is the point — a parent
who has learned one has learned the other.

**The tile** is what differs. A puzzle tile is one photo; a memory tile is
a **2x2 collage** of the first four pictures in its round, over one of the
five cycling `TILE_COLORS`. A single photo would read as "this round is
about this picture", which is wrong — the round is the set.

A small cream badge in the corner carries the picture count, i.e. how many
pairs the round holds. That's for the adult judging how long it will take;
the child goes by the collage.

The tile's accessibility label is the round's title ("Set 1"), so screen
readers get something to say without any visible text on the tile itself.

`App.tsx` builds the rounds with a `useMemo` over the pool and the chosen
set size, so the tiles stay put between renders.

## Interface

| Name | Type | Required | Notes |
|------|------|----------|-------|
| `groups` | `MemoryGroup[]` | No | The rounds, from [[buildMemoryGroups]]. Defaults to `[]` → "No pictures yet". |
| `onSelectGroup` | `(group: MemoryGroup) => void` | No | Fired with the tapped round. Absent → the tile absorbs taps silently. |
| `onOpenParentArea` | `() => void` | No | Corner parent button. Omitted → no button at all. |
| `onBack` | `() => void` | No | Back to the game picker. Omitted → no back button. |

## Toddler UX constraints

- Tiles are square, at least 140dp, two to four across — the same generous
  targets as the puzzle grid.
- The collage carries the meaning; no text is needed to choose a round.
  The count badge and the "Set n" label are for the adult.
- A tap on a tile with nothing wired to it does nothing at all — no error,
  no flash.
- Press feedback is immediate (`opacity: 0.7` while held).
- The parent button stays deliberately low-contrast (`opacity: 0.55`), so
  it doesn't invite a toddler's tap.
- With no playable round, the screen says "No pictures yet" rather than
  showing an empty grid the child could tap at fruitlessly.

## Edge cases & expected behavior

- `groups` empty (every starter picture switched off and nothing
  uploaded) → "No pictures yet", no tiles, no `FlatList`.
- A round with fewer than four pictures → the collage fills only the slots
  it has; the rest show the tile's background colour.
- A picture in a round with no artwork → can't happen;
  [[buildMemoryGroups]] filters those out before grouping.
- `onSelectGroup` omitted → tiles still render and still press; the press
  is a no-op.
- `onBack` / `onOpenParentArea` omitted → those buttons don't render.
- Rotating the device → the column count recomputes and the list
  re-chunks, via the `key`.

## Test scenarios

1. 12 pictures at 3 per round → four tiles, labelled "Set 1".."Set 4".
2. Tapping "Set 2" calls `onSelectGroup` with that round's object.
3. A tile renders several thumbnails, not one.
4. 10 pictures at 4 per round → badges read 4, 4 and 2.
5. Tapping a tile with no `onSelectGroup` leaves the grid intact.
6. Back calls `onBack`; with it omitted no "Back" node exists.
7. The parent button calls `onOpenParentArea`; with it omitted no
   "Parent controls" node exists.
8. `groups={[]}` → no tiles and "No pictures yet" on screen.
9. Row chunking matches the puzzle grid: 2 across at width 400, 4 at 900,
   and 2 at 1100x1400 (portrait halving).

## Non-goals / known limitations

- **No completion state.** The puzzle grid badges solved photos; rounds
  carry no equivalent, because nothing persists memory progress yet. The
  hook that does it for puzzles ([[usePersistentPuzzles]]) is the obvious
  place if it's ever wanted.
- Rounds are positional (`set-1`, `set-2`), so adding a photo can change
  which pictures fall in which round. There's no stable per-round identity
  to preserve, since the grouping is derived rather than authored.
- No custom round names, and no way for a parent to hand-pick which
  pictures go together.
- Duplicated layout code with [[HomeScreen]] rather than a shared grid
  component. The two are close enough to merge if a third such page ever
  appears; with two, extracting it would cost more than it saves.

## Related

- Code: `src/screens/MemoryHomeScreen.tsx`
- Tests: `src/screens/MemoryHomeScreen.test.tsx`
- Related specs: [[buildMemoryGroups]], [[MemoryScreen]], [[MemoryBoard]], [[HomeScreen]], [[GameSelectScreen]], [[AppHeader]]
