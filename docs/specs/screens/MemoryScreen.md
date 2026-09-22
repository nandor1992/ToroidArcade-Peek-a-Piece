---
name: MemoryScreen
type: screen
source: src/screens/MemoryScreen.tsx
status: draft
last_verified: 2026-09-22
---

# MemoryScreen

## Purpose

Plays one round of Family Memory, with next/previous paging between
rounds. The memory counterpart of [[PuzzleScreen]], and laid out the same
way on purpose — a child who has learned the jigsaw's controls already
knows these.

It's reached from [[MemoryHomeScreen]], which chooses the round.

## How it works

Deliberately thin: the rules live in [[MemoryBoard]] and the deal in
[[buildMemoryDeck]]. This screen supplies chrome and navigation.

**Which round.** `groups` is every round ([[buildMemoryGroups]]);
`initialGroupId` picks the starting one. The index is local state seeded
from that id, falling back to the first round when the id is unknown —
the same `findIndex`/`-1` guard `PuzzleScreen` uses.

**Paging.** "Previous set" and "Next set" step the index, wrapping in both
directions with the modulo arithmetic `PuzzleScreen` uses. The board is
**keyed on the round's id**, so switching rounds remounts it — a clean
deal rather than turned cards carried across from the last one.

**Layout**, mirroring `PuzzleScreen`: `AppHeader` (titled "Family Memory")
above a play area holding the board, with floating controls over it —
Home and New game top-left/right, previous/next centred on the side edges,
celebration bottom. The controls layer is `pointerEvents="box-none"` so
taps between the buttons still reach the cards. The board layer is padded
76 on both sides and the top to keep cards clear of all of them.

**Reset and background.** "New game" bumps `resetCount`, re-dealing the
round in place. `(index + resetCount)` picks the pale background wash, so
both moving between rounds and re-dealing one visibly start afresh.

**Solved** is local: the board reports it, and an effect clears it
whenever the round or `resetCount` changes, since a new deal is never
already solved.

The board layer carries the round's title as its `accessibilityLabel` —
the one non-button label on the screen, which is how tests identify the
current round (`PuzzleScreen` does the same with the puzzle's title).

## Interface

| Name | Type | Required | Notes |
|------|------|----------|-------|
| `groups` | `MemoryGroup[]` | Yes | Every round; what next/previous page through. |
| `initialGroupId` | `string` | Yes | The round picked on the landing page. Unknown id → the first round. |
| `onBack` | `() => void` | No | The Home button — back to the memory landing page. |

Note this screen takes **rounds**, not pictures: the round determines both
the pictures and the pair count (`group.pictures.length`), so there's no
separate count prop.

## Toddler UX constraints

- Four controls, each 56x56 and well separated: Home, New game, previous,
  next — the same positions and sizes as the jigsaw's.
- The board is inset from every control, so a stray tap near an edge hits
  a button or nothing, never the wrong card.
- New game is always available, so a stuck or bored child can restart
  without leaving.
- The celebration is `pointerEvents="none"` and can't swallow a tap.
- No text is needed to play; the header title and banner are for the
  adult.
- Everything else is [[MemoryBoard]]'s — the tap rules and reveal timings.

## Edge cases & expected behavior

- `groups` empty → renders `null`. The landing page shows "No pictures
  yet" instead of ever routing here.
- `initialGroupId` not in `groups` → opens the first round.
- Next from the last round → wraps to the first. Previous from the first →
  wraps to the last.
- Switching rounds → the board remounts; nothing is face-up, nothing
  matched, the celebration clears.
- New game → re-deals the same round and clears the celebration.
- `onBack` omitted → the Home button renders but does nothing (unlike the
  header's back button, which hides itself). It's always supplied in
  practice.

## Test scenarios

1. `initialGroupId="set-2"` → "Set 2" is on the board layer, with two
   cards per picture in it.
2. An unknown `initialGroupId` → "Set 1".
3. The header reads "Family Memory".
4. Next, Next, Previous from "Set 1" → Set 2, Set 3, Set 2.
5. Next from the last round wraps to "Set 1".
6. Previous from the first round wraps to the last.
7. Turn a card, then Next → the new round has nothing face-up.
8. Home → `onBack` is called.
9. Clear every pair → "🎉 You found them all!" appears (and isn't there
   before).
10. New game after solving → the banner clears and every card is
    face-down.
11. Moving to another round after solving → the banner clears.
12. `groups={[]}` → renders nothing.

## Non-goals / known limitations

- **Nothing persists.** Leaving mid-round loses it, same as the jigsaw.
- No move counter, best time, or per-round completion marks — which is
  also why [[MemoryHomeScreen]]'s tiles carry no "solved" badge.
- The round's pair count is fixed by the round; changing the Settings size
  re-groups the pool and so changes the tiles, rather than resizing the
  round you're in.
- No background music of its own; `App.tsx` counts this screen as part of
  the child session, so the shared track keeps playing.
- The header shows a title where [[PuzzleScreen]]'s still shows the plain
  wordmark — a small inconsistency between the two game screens, left
  alone rather than changing the jigsaw in a memory-game commit.

## Related

- Code: `src/screens/MemoryScreen.tsx`
- Tests: `src/screens/MemoryScreen.test.tsx`
- Related specs: [[MemoryHomeScreen]], [[MemoryBoard]], [[MemoryCard]], [[buildMemoryGroups]], [[buildMemoryDeck]], [[PuzzleScreen]], [[AppHeader]]
