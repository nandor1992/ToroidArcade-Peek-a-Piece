---
name: MemoryCard
type: game
source: src/games/memory/components/MemoryCard.tsx
status: draft
last_verified: 2026-09-22
---

# MemoryCard

## Purpose

One card on the [[MemoryBoard]]: a patterned back, a family photo on the
face, and the flip between them. The flip is the game's signature
moment — the turn is what the child is doing, so it has to be legible as a
turn rather than a swap.

## How it works

Both faces are always mounted, absolutely stacked to fill the card, with
`backfaceVisibility: 'hidden'`. A single `Animated.Value` (`turn`) drives
both: the back rotates `0deg -> 180deg`, the front `180deg -> 360deg`,
each under `perspective: 800`. Whichever face is turned away is hidden, so
exactly one is ever visible.

One shared value rather than two independent animations is what keeps the
halves of the turn in step. Cross-fading two opacities — the obvious
alternative — shows a moment of both faces at once mid-turn, which reads
as a dissolve, not a flip.

`turn` animates to `faceUp ? 1 : 0` over `FLIP_MS` (182ms) whenever
`faceUp` changes, on the native driver. It's initialised to the current
`faceUp`, so a card that mounts face-up doesn't animate in from the back.

**The back** is `colors.sunbeam` with a `colors.tangerine` border and the
Peek-a-Piece logo at 52% — the same mark as [[AppHeader]], so a face-down
card still reads as part of this app.

**The face** is the photo, `cover`, with a `colors.teal` border. A matched
card switches to a `colors.leaf` border and lays a 45% cream veil over the
photo: still recognisable, visibly done, so the unmatched cards are what
draw the eye.

## Interface

| Name | Type | Required | Notes |
|------|------|----------|-------|
| `card` | `MemoryCard` (data) | Yes | From [[buildMemoryDeck]] — carries `title` and `source`. |
| `faceUp` | `boolean` | Yes | Turned over right now, whether just tapped or already matched. |
| `matched` | `boolean` | Yes | Pair found: green border and the veil. |
| `size` | `number` | Yes | Card edge in dp; cards are square. |
| `onPress` | `(card) => void` | No | The board decides what a tap means. |

Also exports `FLIP_MS`.

## Toddler UX constraints

- The whole card is the touch target, sized by the board to fill its share
  of the grid — always far beyond the minimum.
- The flip takes 182ms: fast enough that the board keeps up with a child
  tapping quickly, slow enough to read as a turn rather than a jump.
- `onPress` is always wired, even when the board will ignore the tap, so a
  card never feels dead under the finger.
- Face-down cards all carry the same accessibility label, "Hidden card" —
  announcing the picture would hand a screen-reader user the answer. A
  face-up card announces its title.
- A matched card is marked `disabled` *and* `selected` for accessibility,
  while staying visible.

## Edge cases & expected behavior

- Mounted with `faceUp` already true → renders face-up without animating.
- `faceUp` toggling mid-animation → the timing retargets from where it is;
  no snap.
- `matched` true implies the board is passing `faceUp` true; the component
  doesn't enforce that.
- `size` of 0 → a zero-size card renders but is invisible and unhittable.
  The board avoids this by not rendering before it has measured.
- The photo is `cover`, so a non-square picture is cropped, never
  letterboxed — a card is always a full square of picture.

## Test scenarios

Covered through [[MemoryBoard]]'s tests, which drive `onPress` and assert
on `faceUp` / `matched`. No dedicated test: the component holds no game
state, and the flip is an animation rather than behaviour worth asserting
in the test renderer.

## Non-goals / known limitations

- No press-in feedback of its own (no scale or dim on touch); the flip is
  the feedback.
- No sound on flip.
- The back pattern is the same for every card — no per-child or seasonal
  backs.
- `backfaceVisibility` relies on real 3D transform support. It holds on
  iOS and Android; on react-native-web it is applied as the CSS property
  of the same name, which is widely supported but not exercised by the web
  demo (the demo has no Settings, but it does reach this screen).

## Related

- Code: `src/games/memory/components/MemoryCard.tsx`
- Related specs: [[MemoryBoard]], [[buildMemoryDeck]], [[AppHeader]]
