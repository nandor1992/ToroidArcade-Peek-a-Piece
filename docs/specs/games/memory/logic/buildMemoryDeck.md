---
name: buildMemoryDeck
type: game
source: src/games/memory/logic/buildMemoryDeck.ts
version: 1
status: draft
last_verified: 2026-09-22
---

# buildMemoryDeck

## Purpose

Deals a round of Family Memory: picks the pictures, puts each on two
cards, and shuffles. Kept as a pure function away from
[[MemoryBoard]] so the dealing rules — which are where the game can be
made unwinnable — are testable without rendering anything.

## How it works

1. `pictureCount <= 0` → empty deck, nothing else runs.
2. Drops any picture with no artwork, via `puzzleImageSource`.
3. Shuffles the survivors (Fisher-Yates, back to front, with the injected
   `random`) and takes the first `pictureCount`.
4. Emits two cards per chosen picture, ids suffixed `-a` / `-b`, both
   carrying the same `pictureId`, `title` and resolved `source`.
5. Shuffles the cards.

**Why the selection is shuffled, not just the deal.** A parent with twenty
photos and a six-picture setting would otherwise see the same six every
round. Shuffling first means a different set each time, which is the whole
value of having uploaded the photos.

**Why blank pictures are dropped.** A card with no artwork can't be matched
by looking at it, and looking is the entire game — one blank pair would
make the round unwinnable by sight.

**Why a short pool isn't padded.** With fewer pictures than requested, the
deck is just smaller. Reusing one picture across two different pairs would
make those two pairs indistinguishable: four identical-looking cards where
only one specific partner counts as a match.

`random` is a parameter (default `Math.random`) so tests can pin the deal.

## Interface

```ts
buildMemoryDeck(
  pictures: Puzzle[],
  pictureCount: number,
  random?: () => number,
): MemoryCard[]
```

| Name | Type | Required | Notes |
|------|------|----------|-------|
| `pictures` | `Puzzle[]` | Yes | The pool — uploaded photos and starter pictures alike. |
| `pictureCount` | `number` | Yes | Distinct pictures to deal. The deck is twice this, at most. |
| `random` | `() => number` | No | Defaults to `Math.random`. |

`MemoryCard` is `{ id, pictureId, title, source }`. `id` is unique per
card; `pictureId` is shared by the two cards of a pair and is the match
key; `source` is an `ImageSourcePropType`, already resolved from the
puzzle's asset module or URI.

## Toddler UX constraints

- Every dealt card is guaranteed to show a picture, so matching is always
  possible by sight alone — no reading, no memory of a label.
- The pair count never exceeds what was asked for, so the parent's
  difficulty choice is never quietly overridden upward.

## Edge cases & expected behavior

- `pictureCount <= 0`, or `pictures` empty → `[]`.
- A picture with neither `imageAsset` nor `imageUri` → dropped; it never
  appears in the deck.
- Fewer usable pictures than `pictureCount` → a deck of
  `usable.length * 2` cards, every `pictureId` distinct.
- A starter picture → `source` is the bundled asset module (a number).
- An uploaded photo → `source` is `{ uri }`.
- Both cards of a pair carry the same `title` and `source`.
- Called twice with the same pool and a live `random` → different
  selection and different order.

## Test scenarios

1. 8 pictures, count 3 → 6 cards, exactly 2 per `pictureId`.
2. All card ids unique; 6 distinct `pictureId`s for count 6.
3. Both cards of a pair carry the picture's asset and title.
4. An uploaded photo resolves to `{ uri: 'file:///a.jpg' }`.
5. A picture with no artwork is excluded from the deck.
6. 2 pictures, count 6 → 4 cards, 2 distinct pictures — never a reused
   picture.
7. Empty pool, count 0, and negative count all give `[]`.
8. Two deals with a varying `random` differ in both selection and order.

## Non-goals / known limitations

- No difficulty beyond the picture count — no timers, no move limit, no
  partially-revealed openings.
- No weighting toward uploaded photos over starter art; the pool arrives
  pre-ordered by the host and is shuffled flat.
- Shuffle quality is whatever `random` provides; no seeding for
  reproducible rounds.

## Related

- Code: `src/games/memory/logic/buildMemoryDeck.ts`
- Tests: `src/games/memory/logic/buildMemoryDeck.test.ts`
- Related specs: [[MemoryBoard]], [[MemoryCard]], [[memorySizes]], [[puzzleImage]]
