---
name: MathGateForm
type: component
source: src/components/MathGateForm.tsx
status: draft
last_verified: 2026-08-25
---

# MathGateForm

## Purpose

The actual "parents only" check — a two-digit addition problem, an answer
field, and a submit button — factored out of [[ParentGateScreen]] so
[[SessionLockOverlay]] can reuse the identical gate logic without also
getting `ParentGateScreen`'s full-screen chrome (`SafeAreaView`, back
button, page title).

## How it works

On mount, generates a problem: two random two-digit numbers (10–99),
added together. The parent types an answer into a numeric `TextInput` and
either submits from the keyboard or presses Continue. If
`parseInt(answer) === a + b`, `onSuccess` fires. Otherwise the input
clears, an inline error shows, and a *new* problem replaces the old one —
so a wrong guess can't just be retried against the same sum.

This is the entire behavior both callers rely on; neither wraps it in
anything beyond their own layout chrome.

## Interface

| Name | Type | Required | Notes |
|------|------|----------|-------|
| `onSuccess` | `() => void` | Yes | Called once the correct sum is entered. |

## Edge cases & expected behavior

- Empty or non-numeric input submitted → treated as wrong (`parseInt`
  yields `NaN`, which never equals the sum) → new problem issued.
- Correct answer → `onSuccess` called exactly once; the component doesn't
  reset itself afterward (callers are expected to unmount or hide it).
- Wrong answer → `onSuccess` never called; a new `{a, b}` pair replaces the
  old one.

## Test scenarios

Covered indirectly through both callers' test suites
(`ParentGateScreen.test.tsx`, `SessionLockOverlay.test.tsx`) rather than a
dedicated test file, since the form has no behavior that isn't already
exercised end-to-end through them.

## Non-goals / known limitations

- No lockout/attempt-limiting — retries are unlimited. Two-digit addition
  is the only barrier.
- Not styled to fill or center itself — callers are expected to place it
  inside their own centered container (see both callers' styles).

## Related

- Code: `src/components/MathGateForm.tsx`
- Used by: [[ParentGateScreen]], [[SessionLockOverlay]]
