---
name: MemoryScreen
type: screen
source: src/screens/MemoryScreen.tsx
status: draft
last_verified: 2026-09-22
---

# MemoryScreen

## Purpose

Hosts the Family Memory game — the second tile on [[GameSelectScreen]].
Deliberately thin: it supplies the chrome (header, back, New game, the
celebration) and hands everything else to [[MemoryBoard]], the same split
[[PuzzleScreen]] has with [[PuzzleBoard]].

It replaced a placeholder that showed nothing but the game's name.

## How it works

An `AppHeader` titled "Family Memory" with a back chevron, over a play
area holding the board and two floating overlays.

**The board** gets `pictures` and `pictureCount` straight from the host
and `resetSignal` from local state. It's absolutely positioned to fill the
play area, inset 16 with a 76 top pad so the New game button has a clear
corner to sit in.

**New game** bumps `resetCount`, which re-deals the board in place. The
same counter also picks the background wash, so a new round visibly starts
on a different colour.

**Solved** is local: the board reports it via `onSolved` and the screen
shows "🎉 You found them all!". An effect clears it whenever `resetCount`
or `pictureCount` changes, since a fresh deal is never already solved.

**The background** is one of the same pale washes `PuzzleScreen` uses —
cycled by `resetCount` rather than randomised, so consecutive rounds never
land on the same colour twice in a row.

`App.tsx` passes the combined pool (`[...userPuzzles, ...stockPuzzles]`)
and `memorySize.pictures` from Settings. `DemoApp.tsx` passes the starter
set at the default count, since the web demo has no Settings screen.

## Interface

| Name | Type | Required | Notes |
|------|------|----------|-------|
| `pictures` | `Puzzle[]` | No | The pool to deal from. Defaults to `[]`, which shows the board's "No pictures yet". |
| `pictureCount` | `number` | No | Distinct pictures to deal. Defaults to `DEFAULT_MEMORY_SIZE.pictures` (6). |
| `onBack` | `() => void` | No | Back to the game picker. Absent → no back button renders. |

## Toddler UX constraints

- The only chrome is the back chevron and a 56x56 New game button, both
  well past the minimum target and kept out of the board's area.
- New game is always available, so a stuck or bored child (or the adult
  beside them) can restart without leaving the game.
- The celebration is `pointerEvents="none"` — it can't swallow a tap.
- No text is needed to play; the header title and the banner are for the
  adult.
- Everything else is [[MemoryBoard]]'s (see its spec for the tap rules and
  the reveal timings).

## Edge cases & expected behavior

- `onBack` omitted → no back button (the header renders none).
- `pictures` omitted or empty → the board shows "No pictures yet"; New
  game still works and still does nothing useful.
- `pictureCount` omitted → 6.
- Solving, then New game → the banner clears and every card is face-down
  again.
- `pictureCount` changing while the banner is up → the banner clears along
  with the re-deal.
- The banner shows only after the final pair; it is not shown on mount.

## Test scenarios

1. Renders with the title "Family Memory" and deals a board (count 3 → 6
   cards).
2. `pictureCount={4}` reaches the board, which deals 8 cards.
3. No `pictureCount` → the board is asked for 6.
4. Tapping Back calls `onBack`; with `onBack` omitted no "Back" control is
   in the tree.
5. Clearing every pair shows "🎉 You found them all!" — and it is absent
   before that.
6. Tapping New game clears the banner and turns every card face-down.

## Non-goals / known limitations

- No next/previous navigation between rounds — memory has no equivalent of
  the jigsaw's per-picture browsing; New game is the only control.
- No difficulty control on the screen itself; the picture count is a
  parent choice behind the gate, in [[SettingsScreen]].
- Nothing persists: leaving mid-round loses it.
- No background music of its own; `App.tsx` counts this screen as part of
  the child session, so the shared track keeps playing.

## Related

- Code: `src/screens/MemoryScreen.tsx`
- Tests: `src/screens/MemoryScreen.test.tsx`
- Related specs: [[MemoryBoard]], [[MemoryCard]], [[buildMemoryDeck]], [[memorySizes]], [[GameSelectScreen]], [[AppHeader]], [[PuzzleScreen]]
