---
name: SessionLockOverlay
type: screen
source: src/screens/SessionLockOverlay.tsx
status: draft
last_verified: 2026-08-25
---

# SessionLockOverlay

## Purpose

The screen-time limit's enforcement point. When the parent-configured
session timer (`SettingsScreen`'s "Screen Time Limit") runs out while a
child-facing screen is showing, `App.tsx` renders this on top of it instead
of navigating anywhere — the underlying screen (`HomeScreen` or
`PuzzleScreen`) stays mounted, dimmed and non-interactive, behind a dark
scrim. There is deliberately no way to dismiss this besides solving the
math problem.

## How it works

`SessionLockOverlay` itself is presentational: a full-screen dark scrim
(`rgba(0,0,0,0.6)`) centering a card with a "Time's Up!" title, a short
subtitle, and a [[MathGateForm]]. Solving the form calls `onUnlock`.

`App.tsx` is what decides *when* this renders and what it covers — see its
comment above the session-timer `useEffect`. In short: a `setTimeout` keyed
to the configured `timerMinutes` sets `locked: true`, which makes `App.tsx`
render the current screen at `opacity: 0.4` with `pointerEvents: 'none'`
and stack this overlay on top. `onUnlock` sets `locked: false`, which (since
the underlying screen was never unmounted) resumes exactly where the child
left off — no navigation back to `HomeScreen`.

## Interface

| Name | Type | Required | Notes |
|------|------|----------|-------|
| `onUnlock` | `() => void` | Yes | Called once the math problem is solved. |

## Edge cases & expected behavior

- Wrong answer → same as `MathGateForm` generally: no unlock, a new
  problem is issued.
- Nothing in this component reads or resets the session timer itself —
  that's entirely `App.tsx`'s job (a fresh countdown starts the next time
  `inChildSession && !locked` becomes true again).

## Test scenarios

1. Solve the math problem → `onUnlock` is called.

(The timer-elapses-then-locks-then-unlocks flow end-to-end is covered by
`App.test.tsx`, not here, since triggering the actual lock requires the
`App.tsx`-level timer wiring this component doesn't own.)

## Non-goals / known limitations

- No countdown display, no warning before the lock hits — it's a hard cut
  at the configured number of minutes.
- No sound/vibration when locking, distinct from the general lack of audio
  feedback elsewhere in the app.
- Background music is paused while locked (`App.tsx` passes
  `enabled: inChildSession && !locked` to `useBackgroundMusic`), which this
  component doesn't control directly.

## Related

- Code: `src/screens/SessionLockOverlay.tsx`
- Tests: `src/screens/SessionLockOverlay.test.tsx`, `App.test.tsx`
- Related specs: [[MathGateForm]], [[SettingsScreen]], [[HomeScreen]], [[PuzzleScreen]]
