---
name: Slider
type: component
source: src/components/Slider.tsx
status: draft
last_verified: 2026-08-25
---

# Slider

## Purpose

A generic 0–1 draggable slider — currently used only for
`SettingsScreen`'s background-music volume, but written with no
volume-specific logic so it can be reused for anything else that needs a
continuous value later.

## How it works

`Slider` is a single `View` acting as its own touch responder — no
`PanResponder`, deliberately (see Non-goals). It measures its own width via
`onLayout`, and on `onResponderGrant`/`onResponderMove` divides the touch's
`locationX` (position relative to the track itself) by that width, clamps
the result to `[0, 1]`, and calls `onValueChange`. The component is fully
controlled: it renders whatever `value` it's given and never tracks its own
internal value.

Visually it's three layers in one track: a static light-gray background bar,
a colored "fill" bar sized to `value * 100%`, and a circular thumb
positioned at that same percentage (recentered with a fixed `marginLeft`
since percentage `left` doesn't account for the thumb's own width).

## Interface

| Name | Type | Required | Notes |
|------|------|----------|-------|
| `value` | `number` | Yes | Current value, `0`–`1`. Values outside that range are clamped when rendering the fill/thumb position, but not corrected back to the caller. |
| `onValueChange` | `(value: number) => void` | Yes | Called on both initial touch and every subsequent move, with a value already clamped to `[0, 1]`. |
| `accessibilityLabel` | `string` | No | Forwarded to the track's `accessibilityLabel`/`accessibilityValue` (role `"adjustable"`). |

## Edge cases & expected behavior

- Touch before the track has been laid out (`trackWidth` still `0`) →
  `onValueChange` is not called (there's no width to divide by yet).
- Touch left of the track's start, or right of its end → reported value
  clamps to `0` or `1` respectively, not a negative number or a number > 1.
- `value` passed in above `1` or below `0` → fill width and thumb position
  are clamped for rendering, but `Slider` doesn't call `onValueChange` to
  "correct" an out-of-range value on its own.

## Test scenarios

1. Lay out the track at a known width, touch at its horizontal midpoint →
   `onValueChange(0.5)`.
2. Touch to the left of the track's start → `onValueChange(0)`. Touch past
   its end → `onValueChange(1)`.

## Non-goals / known limitations

- No `PanResponder` — deliberately, since faking `PanResponder`'s derived
  handlers in a test requires a full native touch-history event shape that
  isn't practical to construct. The low-level Responder System props used
  instead (`onResponderGrant`/`onResponderMove`) cover everything this
  slider needs (touch position) without that gesture-math machinery, and
  are trivially fakeable with a plain `{ nativeEvent: { locationX } }`.
- No step/discrete-value support, no keyboard/D-pad adjustment beyond
  whatever `accessibilityRole="adjustable"` gets for free from the platform.
- No RTL layout handling — `locationX` is always measured left-to-right.

## Related

- Code: `src/components/Slider.tsx`
- Tests: `src/components/Slider.test.tsx`
- Used by: [[SettingsScreen]]
