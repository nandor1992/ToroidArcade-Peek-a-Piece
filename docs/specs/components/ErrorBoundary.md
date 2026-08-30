---
name: ErrorBoundary
type: component
source: src/components/ErrorBoundary.tsx
status: draft
last_verified: 2026-08-30
---

# ErrorBoundary

## Purpose

A single React error boundary wrapping the whole app in `App.tsx`. Without
it, any uncaught render/lifecycle exception leaves React showing nothing —
a permanent white screen with a toddler holding the device and no way
back. With it, a crash becomes a calm, parent-readable recovery screen.

## How it works

A class component (error boundaries can't be hooks). `getDerivedStateFromError`
flips `hasError` true so the next render shows the fallback;
`componentDidCatch` logs the error via `console.error` (there is no
crash-reporting SDK by design — see `docs/architecture.md`) and calls the
optional `onError` prop (a test seam).

Fallback UI: full-screen cream background, a 🧩, "Something went wrong",
"Please hand this back to a grown-up", and a **Try again** button that sets
`hasError` back to false — which remounts the child subtree. That recovers
a transient error; a deterministic one will re-throw and show the fallback
again, at which point the parent has to close and reopen the app.

Placed just inside `SafeAreaProvider` in `App.tsx`, around the screen
content and the `SessionLockOverlay`, so a crash in any screen is caught
but `StatusBar hidden` and the safe-area context are still applied to the
fallback.

## Interface

| Name | Type | Required | Notes |
|------|------|----------|-------|
| `children` | `React.ReactNode` | Yes | The app tree to protect. |
| `onError` | `(error: Error) => void` | No | Called from `componentDidCatch`. Test seam / future hook for logging. |

## Toddler UX constraints

- This screen is deliberately parent-facing — it uses words, because its
  whole job is to tell the adult what happened. The child isn't expected
  to act on it.
- One large button, full-width tap target, clear label.
- No auto-retry loop that could thrash; recovery is an explicit tap.

## Edge cases & expected behavior

- Child renders fine → `children` pass through untouched, zero overhead.
- Child throws during render → fallback shows; `onError` gets the `Error`.
- "Try again" tapped after the underlying cause is gone → children render
  again.
- "Try again" tapped while the cause persists → fallback reappears (no
  crash, no infinite loop — it's one remount per tap).
- An error thrown in `App`'s own hooks (above this boundary) is NOT caught
  — those are intentionally minimal and stable.

## Test scenarios

`src/components/ErrorBoundary.test.tsx` (console.error silenced):
1. Non-throwing child → its content renders.
2. Throwing child → "Something went wrong" shows and `onError` is called
   with the thrown `Error`.
3. A host that can stop throwing → fallback shows, then tapping "Try again"
   after it stops → the healthy child renders.

## Non-goals / known limitations

- No error reporting/telemetry — `console.error` only (surfaced by Android
  Vitals / logcat). Adding a reporter later means filling in `onError` at
  the `App.tsx` call site, not changing this component.
- Doesn't catch errors in event handlers, async callbacks, or the native
  side — only the React render tree, per React's error-boundary contract.
- One boundary for the whole app (no per-screen granularity) — fine at
  this size; a crash in one screen taking down all of them is acceptable
  when "all of them" is five screens.

## Related

- Code: `src/components/ErrorBoundary.tsx`
- Tests: `src/components/ErrorBoundary.test.tsx`
- Used by: `App.tsx`
- Related specs: [[SessionLockOverlay]]
