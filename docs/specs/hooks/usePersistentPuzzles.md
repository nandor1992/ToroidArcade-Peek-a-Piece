---
name: usePersistentPuzzles
type: hook
source: src/hooks/usePersistentPuzzles.ts
status: draft
last_verified: 2026-08-30
---

# usePersistentPuzzles

## Purpose

The single hook `App.tsx` uses for the two pieces of state that must
outlive a launch: the parent's uploaded puzzle list, and which puzzles the
child has solved. It hydrates both from storage on mount and writes back
on every change, so `App.tsx` can treat them like ordinary local state.

## How it works

Holds three `useState`s: `userPuzzles: Puzzle[]`,
`completedIds: ReadonlySet<string>`, `hydrated: boolean`. A `mounted` ref
guards against setState-after-unmount from the async work.

**Hydration.** One `useEffect([])` runs
`Promise.all([loadUserPuzzles(), loadCompletedIds()])` ([[puzzleStore]]),
sets both states, and flips `hydrated` true. Until then `userPuzzles` is
`[]` and `completedIds` is empty — `App.tsx` renders anyway (a one-frame
pop-in, not a blocking splash).

**Mutations** — each updates React state synchronously (the UI's source of
truth) and kicks off a fire-and-forget persistence write (`persist()`,
which `.catch(() => {})`s; the storage helpers already swallow their own
errors):

- `addPuzzles(incoming)` — for each puzzle,
  `persistPickedPhoto(imageUri, id)` ([[photoFiles]]) copies the file into
  app storage and returns the durable URI; the puzzle's `imageUri` is
  rewritten to it. The persisted list is then **prepended** to state
  (newest first) and saved.
- `deletePuzzle(id)` — removes it from state, `deletePersistedPhoto`s its
  file, saves the shortened list.
- `markCompleted(puzzleId)` / `clearCompleted(puzzleId)` — add/remove the id
  in a new `Set`, save `[...set]`. **Idempotent**: if the id is already in
  the desired state the same `Set` reference is returned and nothing is
  written (solving re-renders shouldn't spam storage).

## Interface

Returns `PersistentPuzzles`:

| Field | Type | Notes |
|-------|------|-------|
| `userPuzzles` | `Puzzle[]` | Newest first. `[]` until `hydrated`. |
| `addPuzzles` | `(puzzles: Puzzle[]) => void` | Copies files, prepends, persists. |
| `deletePuzzle` | `(id: string) => void` | Removes entry + file, persists. |
| `completedIds` | `ReadonlySet<string>` | Every puzzle id solved at least once. |
| `markCompleted` | `(puzzleId: string) => void` | Idempotent. |
| `clearCompleted` | `(puzzleId: string) => void` | Idempotent. |
| `hydrated` | `boolean` | False until the first storage read lands. |

## Toddler UX constraints

Not directly user-facing. Downstream: photos persist across sessions
(nothing the child added vanishes), and a solved puzzle stays ticked on
`HomeScreen` until Reset.

## Edge cases & expected behavior

- Mount with empty storage → `userPuzzles: []`, `completedIds: ∅`,
  `hydrated` true after the first tick.
- `addPuzzles` where `persistPickedPhoto` fails for one photo → that
  puzzle is still added with its original `imageUri` (see [[photoFiles]]).
- `deletePuzzle` with an unknown id → state unchanged, still writes the
  (unchanged) list.
- `markCompleted` for an id already completed → no state change, no write.
- Hook unmounts while an async add/hydrate is in flight → the late setState
  is skipped (`mounted` ref).

## Test scenarios

`src/hooks/usePersistentPuzzles.test.tsx` (harness component exposing the
hook value, AsyncStorage + RNFS mocks):
1. Seed both storage keys → mount → `userPuzzles` and `completedIds`
   reflect them, `hydrated` true.
2. `addPuzzles([a, b])` → `copyFile` called twice, both prepended,
   `imageUri`s rewritten to `puzzles/<id>.jpg`, `@peekapiece/userPuzzles`
   written.
3. `deletePuzzle` → removed from state, file unlinked, list persisted as
   `[]`.
4. `markCompleted` then `clearCompleted` → set + storage track it both ways.
5. `markCompleted` twice for the same id → second call is a no-op (same
   Set reference, no extra write).

## Non-goals / known limitations

- No `hydrated` gate on the UI — a brief empty-then-populated flash is
  accepted (AsyncStorage reads are fast). MMKV's synchronous read would
  remove it but wasn't chosen (see architecture.md).
- Settings state (volume, timer, puzzle size, starter toggle) is **not**
  handled here — still session-only by design.
- Writes are fire-and-forget; a crash in the ~ms between setState and the
  write completing loses that one change.

## Related

- Code: `src/hooks/usePersistentPuzzles.ts`
- Tests: `src/hooks/usePersistentPuzzles.test.tsx`
- Related specs: [[puzzleStore]], [[photoFiles]], [[asyncStore]], [[HomeScreen]], [[PuzzleScreen]], [[ParentScreen]]
