---
name: ParentGateScreen
type: screen
source: src/screens/ParentGateScreen.tsx
status: draft
last_verified: 2026-08-25
---

# ParentGateScreen

## Purpose

Stands between the small lock button on `HomeScreen` and `ParentScreen`.
A toddler can tap the lock button, but shouldn't be able to get past this
screen — the addition problem is the gate. This is an adult-facing screen
(unlike `HomeScreen`/`PuzzleScreen`), so normal text and a keyboard are fine
here; the constraint that matters is that the *math*, not the UI, is what a
toddler can't clear.

## How it works

On mount (and after every wrong answer), `ParentGateScreen` generates a
fresh problem: two random two-digit numbers (10–99), added together.
The parent types an answer into a numeric `TextInput` and presses
Continue (or submits from the keyboard). If `parseInt(answer) === a + b`,
`onSuccess` fires. Otherwise: the input clears, an inline error shows, and
a *new* problem is generated — so there's no way to retry the same sum
repeatedly.

The back button (top-left) calls `onBack` unconditionally, letting anyone
back out to `HomeScreen` without solving the problem.

## Interface

| Name | Type | Required | Notes |
|------|------|----------|-------|
| `onSuccess` | `() => void` | Yes | Called once the correct sum is entered. |
| `onBack` | `() => void` | No | Called when the back button is pressed. No-op if omitted. |

## Edge cases & expected behavior

- Empty or non-numeric input submitted → treated as wrong (`parseInt`
  yields `NaN`, which never equals the sum) → new problem issued.
- Correct answer → `onSuccess` called exactly once; no further problem is
  generated (the screen is expected to be unmounted by the caller).
- Wrong answer → `onSuccess` is never called; a new `{a, b}` pair replaces
  the old one, so the previously-displayed sum can't be reused.

## Test scenarios

1. Answer the displayed problem correctly → `onSuccess` is called.
2. Answer the displayed problem incorrectly → `onSuccess` is not called;
   answering the newly-issued problem correctly does succeed.
3. Press Back → `onBack` is called.

## Non-goals / known limitations

- No lockout/attempt-limiting — a parent (or a very persistent toddler) can
  retry indefinitely. Two-digit addition is the only barrier.
- No accessibility affordance beyond the standard `TextInput` keyboard;
  this screen is intentionally not designed to the toddler-UX constraints
  that apply elsewhere in the app.

## Related

- Code: `src/screens/ParentGateScreen.tsx`
- Tests: `src/screens/ParentGateScreen.test.tsx`
- Related specs: [[HomeScreen]], [[ParentScreen]]
