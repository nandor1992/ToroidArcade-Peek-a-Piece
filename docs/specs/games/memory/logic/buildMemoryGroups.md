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
5. If the final chunk has a single picture, it is folded into the chunk
   before it — leaving that round one larger rather than producing a
   trivial one-pair tile. (Only when there *is* a previous chunk; a lone
   picture overall yields no rounds at all, per step 3.)
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

- 12 pictures at 6 → two rounds of 6.
- 14 at 6 → rounds of 6, 6, 2 — a short final round is kept when it's
  still a real game.
- 13 at 6 → rounds of 6 and **7**; the orphan joins the previous round.
- 3 at 6 → one round of 3; a pool smaller than a round is still a round.
- 1 picture, or 0 → `[]`.
- Only unusable pictures → `[]`.
- `groupSize` of 0 or 1 → `[]`.
- Called twice with the same pool → identical rounds, in identical order.
- Every picture in the pool appears in exactly one round.

## Test scenarios

1. 12 at 6 → sizes `[6, 6]`, ids `set-1`/`set-2`, titles "Set 1"/"Set 2".
2. 14 at 6 → sizes `[6, 6, 2]`.
3. 13 at 6 → sizes `[6, 7]`, and the second round holds `p6`..`p12`.
4. A user photo first in the pool stays first in round one.
5. Two calls on the same pool give identical rounds.
6. A picture with no artwork never appears in any round.
7. 3 at 6 → a single round of 3.
8. Empty pool, a single picture, and a single artwork-less picture all
   give `[]`.
9. `groupSize` 1 and 0 give `[]`.
10. 17 at 4 → all 17 pictures present exactly once across the rounds.

## Non-goals / known limitations

- Rounds are positional, so adding a photo shifts which pictures fall in
  which round. There's no stable identity to preserve — the grouping is
  derived, not authored.
- No parent control over which pictures are grouped together, and no
  round naming.
- No balancing: with 13 pictures at 6 the last round is 7, not 6 and 7
  redistributed to 7 and 6. The simpler rule is easier to predict.

## Related

- Code: `src/games/memory/logic/buildMemoryGroups.ts`
- Tests: `src/games/memory/logic/buildMemoryGroups.test.ts`
- Related specs: [[MemoryHomeScreen]], [[MemoryScreen]], [[buildMemoryDeck]], [[memorySizes]]
