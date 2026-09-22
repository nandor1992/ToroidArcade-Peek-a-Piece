---
name: MemoryBoard
type: game
source: src/games/memory/components/MemoryBoard.tsx
status: draft
last_verified: 2026-09-22
---

# MemoryBoard

## Purpose

The Family Memory game itself: a grid of face-down cards, two of each
picture. Turn one over, turn a second — matching pictures stay up,
mismatched ones turn back. Solved when every pair is showing.

It's the second game in the app and the counterpart to [[PuzzleBoard]]:
same family photos, a different thing to do with them, and far less
demanding of fine motor control — every interaction is a single tap on a
large target, with no dragging at all.

## How it works

**Dealing.** [[buildMemoryDeck]] produces the shuffled deck. The deal is
re-run on mount, whenever `resetSignal` changes, and whenever the pool
contents or `pictureCount` change — a parent switching the Settings chip
mid-game gets a fresh board rather than a half-played one at the old size.

The effect keys on `poolKey`, a join of the pictures' ids, **not** on the
`pictures` array identity. A host that rebuilds its puzzle list on each
render (which `App.tsx` does — `[...userPuzzles, ...stockPuzzles]`) would
otherwise re-deal the board continuously and no card could ever stay
turned.

**Turn state.** Two pieces of state carry the game:

- `turned` — card ids face-up and unresolved, at most two.
- `matched` — picture ids whose pair has been found.

A card is face-up if it's in `turned` *or* its picture is in `matched`.

**Resolving a pair.** An effect fires once `turned` reaches two. It
compares the two cards' `pictureId`s and sets a timer:

- match → after `MATCH_PAUSE_MS` (600ms) the picture joins `matched`;
- mismatch → after `MISMATCH_PAUSE_MS` (1300ms) nothing is recorded.

Either way `turned` clears, which is also what re-opens the board to taps.
The timer is cleaned up on unmount, so a player leaving mid-reveal doesn't
land a state update on an unmounted board.

**Cutting a mismatch reveal short.** `MISMATCH_PAUSE_MS` is an upper
bound, not a wait. A tap while a mismatched pair is showing replaces
`turned` immediately — with the tapped card if it's a fresh one, or with
nothing if it's one of the two on show or an already-matched card. The
effect's cleanup cancels the pending timer, so the pair turns back the
instant the child moves on rather than making them sit out the rest of the
pause. A *matching* pair is exempt: it's only up for `MATCH_PAUSE_MS` and
is about to stay up anyway, so taps during it are ignored.

Both the effect and the tap handler ask the same question — "do these two
cards share a picture?" — through the module-level `pairedPicture` helper,
which returns the shared picture id or null.

The two delays differ on purpose. The mismatch reveal is the only chance
the child gets to memorise where those two pictures were — it *is* the
game — so it's more than twice as long as the match pause, which only has
to confirm something that already succeeded.

**Taps that do nothing.** A tap is ignored when two cards are already
showing, when the card is already turned, or when its pair is already
found. Each is a normal toddler tap and each is a silent no-op rather than
an error.

**Solving.** An effect fires `onSolved` once when `matched` covers every
distinct picture in the deck. A `solvedRef` one-shot keeps it to a single
call, and re-dealing re-arms it.

**Layout.** The board measures itself with `onLayout`. `gridColumns` then
tries every column count from 1 to the card count and keeps whichever
yields the largest card, so the grid follows the shape of the space — wide
in landscape, tall in portrait — rather than applying a fixed rule. Card
size is the same min-of-both-axes calculation, floored.

## Interface

| Name | Type | Required | Notes |
|------|------|----------|-------|
| `pictures` | `Puzzle[]` | Yes | The pool to deal from. |
| `pictureCount` | `number` | Yes | Distinct pictures; the board holds twice this. |
| `onSolved` | `() => void` | No | Fired once when the last pair is found. |
| `resetSignal` | `number` | No | Any new value re-deals. Default 0. |

Also exports `gridColumns`, `MATCH_PAUSE_MS` and `MISMATCH_PAUSE_MS`.

## Toddler UX constraints

- Every interaction is a single tap on a card that fills its share of the
  grid — no dragging, no precision, no double-tap.
- Mis-taps are silently ignored: the same card twice, an already-matched
  card, anything during a matching pair's brief pause. Nothing shows an
  error.
- The mismatch pause (1300ms) is long enough to look at both pictures
  before they turn back — but a child who has already looked doesn't wait
  it out: their next tap turns them back at once, so the board never feels
  like it's ignoring them.
- Matched cards stay face-up and visibly settle (see [[MemoryCard]]), so
  progress is always on screen and what's left is what stands out.
- No timer, no score, no fail state — the round ends only by being
  finished, or by leaving.
- An empty pool shows "No pictures yet" rather than a blank screen.
- No audio feedback on match/solve (no sound-effect pipeline — same gap as
  the jigsaw).

## Edge cases & expected behavior

- Empty `pictures`, or none with artwork → no cards; "No pictures yet".
- Fewer usable pictures than `pictureCount` → a smaller board (see
  [[buildMemoryDeck]]); `onSolved` still fires when that smaller set is
  cleared.
- Tap while two cards are showing → ignored; the two stay up.
- Tap the same card twice → counts once; the board still waits for a
  second card.
- Tap an already-matched card → ignored; it never re-enters `turned`.
- `resetSignal` changes → fresh deck, nothing turned, nothing matched,
  `onSolved` re-armed.
- `pictureCount` changes → re-deal at the new size.
- Re-render with an equal-but-new `pictures` array → **no** re-deal; a
  turned card stays turned.
- Before `onLayout` reports a size → card size is 0 and no cards render.
- Unmount mid-reveal → the pending timer is cleared.

## Test scenarios

1. Count 3 → 6 cards, 3 distinct pictures, all face down.
2. Count 6 → 12 cards.
3. Tap a card → exactly one card face-up.
4. Tap both cards of one picture, advance `MATCH_PAUSE_MS` → both face-up
   and marked matched.
5. Tap one card of each of two pictures, advance `MISMATCH_PAUSE_MS` →
   both face-down, nothing matched.
6. Same, advanced to just *before* the pause elapses → both still face-up.
7. Tap a third card while a mismatched pair shows → only that card is
   face-up, the pair has turned back with no wait.
7a. Tap one of the two showing cards instead → none face-up.
7b. Tap a third card while a *matching* pair shows → still two face-up,
   and the pair still lands as matched after `MATCH_PAUSE_MS`.
8. Tap the same card twice → one face-up; its real partner still pairs.
9. Tap a matched card then a fresh one → three face-up, still two matched.
10. Clear every pair → `onSolved` called exactly once, all cards matched.
11. Bump `resetSignal` → 6 cards again, none face-up, none matched.
12. Change `pictureCount` 3 → 4 → 8 cards, none face-up.
13. Re-render with an equal picture list → the turned card stays turned.
14. Empty pool → no cards, "No pictures yet" on screen.
15. `gridColumns`: wider for a wide area than a tall one; between 1 and the
    card count on a square area; 1 when unmeasured.

Tests address cards by `pictureId`, never by grid position, so they're
independent of how the deck shuffled.

## Non-goals / known limitations

- **Nothing persists.** Leaving mid-game loses it, exactly like the
  jigsaw.
- No move counter, best-time, or per-child progress.
- No "peek all cards at the start" opening, which some memory games use to
  ease younger players in.
- No sound. The match/mismatch distinction is visual only.
- `gridColumns` runs its loop on every render. Trivial at ten pairs; it
  would want memoising if the board ever got much bigger.

## Related

- Code: `src/games/memory/components/MemoryBoard.tsx`
- Tests: `src/games/memory/components/MemoryBoard.test.tsx`
- Related specs: [[MemoryCard]], [[buildMemoryDeck]], [[memorySizes]], [[MemoryScreen]], [[PuzzleBoard]]
