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

The addition-problem logic itself lives in [[MathGateForm]] (extracted so
`SessionLockOverlay` can reuse it without this screen's full-screen chrome).
`ParentGateScreen` is that chrome: a `SafeAreaView`, an optional back
button, a title, and the form.

The back button only renders when `onBack` is provided — used for the
`HomeScreen` → gate flow (cancel back out without solving), but omitted
when this screen's caller wants no escape route besides solving it.

## Interface

| Name | Type | Required | Notes |
|------|------|----------|-------|
| `onSuccess` | `() => void` | Yes | Called once the correct sum is entered (forwarded to `MathGateForm`). |
| `onBack` | `() => void` | No | Called when the back button is pressed. Back button isn't rendered at all if omitted, rather than rendered as a no-op. |
| `title` | `string` | No | Defaults to `"Parents Only"`. |

## Edge cases & expected behavior

- `onBack` omitted → no back button renders (not merely a disabled one).
- Answer correctness/retry behavior is `MathGateForm`'s — see its spec.

## Test scenarios

1. Answer the displayed problem correctly → `onSuccess` is called.
2. Answer the displayed problem incorrectly → `onSuccess` is not called;
   answering the newly-issued problem correctly does succeed.
3. Press Back → `onBack` is called.
4. No `onBack` passed → no element with the "Back" accessibility label
   renders at all.
5. A custom `title` is passed → it replaces the default "Parents Only".

## Non-goals / known limitations

- No lockout/attempt-limiting — a parent (or a very persistent toddler) can
  retry indefinitely. Two-digit addition is the only barrier.
- No accessibility affordance beyond the standard `TextInput` keyboard;
  this screen is intentionally not designed to the toddler-UX constraints
  that apply elsewhere in the app.

## Related

- Code: `src/screens/ParentGateScreen.tsx`
- Tests: `src/screens/ParentGateScreen.test.tsx`
- Related specs: [[HomeScreen]], [[ParentScreen]], [[MathGateForm]], [[SessionLockOverlay]]
