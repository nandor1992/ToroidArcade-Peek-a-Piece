---
name: puzzleStore
type: service
source: src/storage/puzzleStore.ts
status: draft
last_verified: 2026-08-30
---

# puzzleStore

## Purpose

The domain layer over [[asyncStore]]: it owns the two AsyncStorage keys
the app persists and the shape-guarding that keeps a corrupted or
stale-format value from reaching the UI.

## How it works

Two keys:

- `@peekapiece/userPuzzles` → JSON `Puzzle[]`.
  - `loadUserPuzzles()` reads it and **filters to well-formed user
    entries**: `id`/`title`/`imageUri` are strings and `source === 'user'`.
    Anything else (a `stock` entry that slipped in, a missing image, `null`)
    is dropped. Corrupt JSON → `[]` (via `readJSON`).
  - `saveUserPuzzles(puzzles)` writes the array verbatim.
- `@peekapiece/completedPuzzleIds` → JSON `string[]`.
  - `loadCompletedIds()` reads it, keeps only string elements.
  - `saveCompletedIds(ids)` writes the array.

No merge / partial-update logic: callers ([[usePersistentPuzzles]]) hold
the full list in state and write the whole thing each change.

## Interface

| Name | Type | Notes |
|------|------|-------|
| `loadUserPuzzles` | `() => Promise<Puzzle[]>` | Shape-guarded; `[]` on absent/corrupt. |
| `saveUserPuzzles` | `(puzzles: Puzzle[]) => Promise<void>` | |
| `loadCompletedIds` | `() => Promise<string[]>` | `[]` on absent/corrupt. |
| `saveCompletedIds` | `(ids: string[]) => Promise<void>` | |

## Toddler UX constraints

Not user-facing.

## Edge cases & expected behavior

- First launch (keys absent) → both loads return `[]`.
- `userPuzzles` JSON has a `stock` entry or an entry with no `imageUri` →
  those are dropped by `loadUserPuzzles`.
- `userPuzzles` value is not valid JSON → `[]`.
- `completedPuzzleIds` contains a non-string → that element is dropped.

## Test scenarios

`src/storage/puzzleStore.test.ts`:
1. `saveUserPuzzles` then `loadUserPuzzles` round-trips.
2. A stored array with a malformed / `stock` / null entry → only the good
   `user` entry is returned.
3. Corrupt JSON at the key → `[]`.
4. `saveCompletedIds` / `loadCompletedIds` round-trip.

## Non-goals / known limitations

- No schema version field; the shape-guard is the whole migration story. A
  future `Puzzle` field change means adding to the guard, not a migration.
- Ordering is whatever the caller writes (newest-first, set by
  [[usePersistentPuzzles]]).

## Related

- Code: `src/storage/puzzleStore.ts`
- Tests: `src/storage/puzzleStore.test.ts`
- Related specs: [[asyncStore]], [[photoFiles]], [[usePersistentPuzzles]]
