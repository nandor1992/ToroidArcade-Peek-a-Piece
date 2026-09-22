---
name: buildMemoryGroups
type: game
source: src/games/memory/logic/buildMemoryGroups.ts
status: draft
last_verified: 2026-09-22
---

# buildMemoryGroups

## Purpose

Splits the photo pool into the rounds of Family Memory that
[[MemoryHomeScreen]] lists and [[MemoryScreen]] pages between — the memory
equivalent of the puzzle grid's one-tile-per-photo.

It exists because memory is played with a *set* of pictures. The jigsaw
can list photos directly; memory needs a layer that decides which pictures
belong to the same round.

## How it works

1. `groupSize < 2` → no rounds. A one-pair round is won by tapping twice.
2. Drops pictures with no artwork (`puzzleImageSource` undefined) — the
   same rule [[buildMemoryDeck]] applies, for the same reason: a card
   nobody can see can't be matched by sight.
3. Fewer than 2 usable pictures left → no rounds.
4. Chunks the survivors into runs of `groupSize`, in pool order.
5. If the final chunk is short, it's **topped up from the start of the
   pool** until it reaches `groupSize` — so every round is the size the
   parent chose, and no tile is a two-tap walkover.

   Pictures already in that round are skipped, because a picture appearing
   twice in one round deals four identical cards: matching two of them
   leaves the other two stranded with no partner and the round can never
   be finished. Repeating *across* rounds is harmless — each round is
   dealt on its own.

   Only possible when the pool is bigger than one round. When it isn't,
   there's a single round holding everything and nothing to borrow from,
   so it stays short. (That also makes the fill always complete: with
   `pool > groupSize` there are strictly more pictures outside the short
   chunk than slots left to fill.)
6. Labels each round `set-N` / "Set N" by position.

**Deliberately not shuffled.** These are stable sets the player picks
between and pages through, so the same tile has to mean the same round
every time the screen opens. Shuffling happens a layer down, when a chosen
round is dealt — see [[buildMemoryDeck]].

**Pool order is preserved**, so uploaded photos land in the early rounds
just as they sit first on the puzzle grid.

## Interface

```ts
buildMemoryGroups(pictures: Puzzle[], groupSize: number): MemoryGroup[]
```

| Name | Type | Required | Notes |
|------|------|----------|-------|
| `pictures` | `Puzzle[]` | Yes | The pool, in display order. |
| `groupSize` | `number` | Yes | Pictures per round — the Settings "Memory Pictures" choice. |

`MemoryGroup` is `{ id, title, pictures }`. `id` is `set-N`; `title` is
"Set N"; `pictures` is that round's slice, which is what gets dealt.

## Toddler UX constraints

None directly — it's a pure function. It serves one: every round it
produces is actually playable and actually winnable, so a child can't open
a tile that turns out to be empty or instantly over.

## Edge cases & expected behavior

- 12 pictures at 6 → two rounds of 6; nothing to fill.
- 14 at 6 → rounds of 6, 6, 6 — the last being `p12, p13` plus `p0..p3`.
- 13 at 6 → rounds of 6, 6, 6 — the last being `p12` plus `p0..p4`.
- 8 at 6 (the bundled starter set) → two rounds of 6.
- Whenever the pool exceeds one round, **every** round is exactly
  `groupSize`.
- No round ever contains the same picture twice.
- 3 at 6 → one round of 3; a pool smaller than a round stays short,
  because filling it could only duplicate a picture already in it.
- 1 picture, or 0 → `[]`.
- Only unusable pictures → `[]`.
- `groupSize` of 0 or 1 → `[]`.
- Called twice with the same pool → identical rounds, in identical order.
- Every picture in the pool appears in at least one round; those borrowed
  to fill the last round appear twice, in different rounds.

## Test scenarios

1. 12 at 6 → sizes `[6, 6]`, ids `set-1`/`set-2`, titles "Set 1"/"Set 2".
2. 14 at 6 → sizes `[6, 6, 6]`; the last is `p12, p13, p0, p1, p2, p3`.
3. 13 at 6 → sizes `[6, 6, 6]`; the last is `p12, p0, p1, p2, p3, p4`.
4. 8 at 6 → sizes `[6, 6]`; the last is `p6, p7, p0, p1, p2, p3`.
5. Across pools of 7–21 and sizes 3–10, no round ever repeats a picture.
6. Across the same spread, every round is exactly `groupSize` whenever the
   pool exceeds one round.
7. A user photo first in the pool stays first in round one.
8. Two calls on the same pool give identical rounds.
9. A picture with no artwork never appears in any round.
10. 3 at 6 → a single round of 3; 2 at 6 → one of 2; 6 at 6 → one of 6.
11. Empty pool, a single picture, and a single artwork-less picture all
    give `[]`.
12. `groupSize` 1 and 0 give `[]`.
13. 17 at 4 → all 17 pictures appear, across 20 slots.

## Non-goals / known limitations

- Rounds are positional, so adding a photo shifts which pictures fall in
  which round. There's no stable identity to preserve — the grouping is
  derived, not authored.
- No parent control over which pictures are grouped together, and no
  round naming.
- No balancing: the fill always draws from the front of the pool, so with
  an uneven pool the earliest pictures are the ones seen twice. Drawing
  from the least-used pictures instead would spread it more evenly, at the
  cost of a rule nobody could predict from looking at the grid.

## Related

- Code: `src/games/memory/logic/buildMemoryGroups.ts`
- Tests: `src/games/memory/logic/buildMemoryGroups.test.ts`
- Related specs: [[MemoryHomeScreen]], [[MemoryScreen]], [[buildMemoryDeck]], [[memorySizes]]
