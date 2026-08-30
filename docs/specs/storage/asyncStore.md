---
name: asyncStore
type: service
source: src/storage/asyncStore.ts
status: draft
last_verified: 2026-08-30
---

# asyncStore

## Purpose

The one place `AsyncStorage` is touched. Everything else in `src/storage/`
goes through `readJSON` / `writeJSON` so the "persistence is best-effort,
never fatal" rule lives in a single file.

## How it works

- `readJSON<T>(key, fallback)` — `AsyncStorage.getItem(key)`, `JSON.parse`,
  return the value. Returns `fallback` on a missing key, malformed JSON, or
  any thrown storage error (all caught).
- `writeJSON(key, value)` — `JSON.stringify` + `AsyncStorage.setItem`.
  Swallows errors: a failed write just means that change isn't persisted;
  the in-memory React state is still correct.

## Interface

| Name | Type | Notes |
|------|------|-------|
| `readJSON<T>` | `(key: string, fallback: T) => Promise<T>` | Never rejects. |
| `writeJSON` | `(key: string, value: unknown) => Promise<void>` | Never rejects. |

## Toddler UX constraints

Not user-facing. The constraint it enforces: a storage failure must never
crash a screen a child is looking at.

## Edge cases & expected behavior

- Key absent → `fallback`.
- Stored value isn't valid JSON → `fallback` (not a throw).
- `AsyncStorage` itself throws (quota, native error) → `fallback` / silent
  no-op.

## Test scenarios

Covered indirectly by `puzzleStore.test.ts` (round-trip, corrupt-JSON
fallback) and `usePersistentPuzzles.test.tsx`.

## Non-goals / known limitations

- No namespacing/versioning of keys here — callers own their key strings
  (see [[puzzleStore]]).
- No migration framework; `loadUserPuzzles` / `loadCompletedIds` do their
  own shape-guarding instead.

## Related

- Code: `src/storage/asyncStore.ts`
- Mock: `__mocks__/@react-native-async-storage/async-storage.js` (in-memory)
- Related specs: [[puzzleStore]], [[photoFiles]], [[usePersistentPuzzles]]
