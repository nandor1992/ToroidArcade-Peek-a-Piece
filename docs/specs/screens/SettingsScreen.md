---
name: SettingsScreen
type: screen
source: src/screens/SettingsScreen.tsx
status: draft
last_verified: 2026-08-25
---

# SettingsScreen

## Purpose

Reached from `ParentScreen`'s ⚙️ button (so it inherits that screen's
math-gate protection — there's no separate gate here). Lets a parent adjust
the two things that affect the whole app rather than a single puzzle:
background-music volume/mute, and the screen-time limit that drives
[[SessionLockOverlay]].

## How it works

Fully controlled, like `ParentScreen` — `SettingsScreen` owns none of this
state itself, only rendering what it's given and calling back on change.
`App.tsx` owns `soundVolume`, `soundMuted`, and `timerMinutes`.

- **Background Music**: a [[Slider]] bound to `soundVolume`
  (`onChangeSoundVolume`), plus a separate mute button
  (🔊/🔇 depending on `soundMuted`) that calls `onToggleMute` with the
  *opposite* of the current value. Muting doesn't change `soundVolume` —
  it's a separate flag layered on top, so unmuting restores whatever level
  was set before. The slider dims (`opacity: 0.4`) while muted as a visual
  hint, but stays interactive; dragging it while muted does not auto-unmute.
- **Screen Time Limit**: a row of preset chips (`Off`, `5 min`, `10 min`,
  `15 min`, `20 min`, `30 min` — `TIMER_PRESETS`) rather than a free-form
  number input. Tapping one calls `onChangeTimerMinutes` with that preset's
  `minutes` (`null` for `Off`); the chip matching the current
  `timerMinutes` is highlighted (`accessibilityState={{ selected }}`
  too).

## Interface

| Name | Type | Required | Notes |
|------|------|----------|-------|
| `soundVolume` | `number` | Yes | `0`–`1`, current slider position. |
| `onChangeSoundVolume` | `(value: number) => void` | Yes | Called on every slider drag update. |
| `soundMuted` | `boolean` | Yes | Current mute state. |
| `onToggleMute` | `(muted: boolean) => void` | Yes | Called with the new (opposite) state when the mute button is pressed. |
| `timerMinutes` | `number \| null` | Yes | Current screen-time limit; `null` means off. |
| `onChangeTimerMinutes` | `(minutes: number \| null) => void` | Yes | Called with the tapped preset's value. |
| `onBack` | `() => void` | No | Called when the back button is pressed. No-op if omitted. |

## Edge cases & expected behavior

- `timerMinutes` doesn't match any preset's `minutes` (shouldn't happen in
  practice, since presets are the only way to set it) → no chip renders as
  selected.
- Muting doesn't clear or zero `soundVolume` — only `App.tsx`'s
  `useBackgroundMusic` wiring (`muted ? 0 : volume`) is what actually
  silences playback.

## Test scenarios

1. Drag the slider to a known position → `onChangeSoundVolume` is called
   with the expected proportional value.
2. Press the mute button while unmuted → `onToggleMute(true)`. While muted,
   the button's label is "Unmute" and pressing it calls `onToggleMute(false)`.
3. Tap a timer preset (e.g. "10 min") → `onChangeTimerMinutes(10)`. Tap
   "Off" → `onChangeTimerMinutes(null)`.
4. Press Back → `onBack` is called.

## Non-goals / known limitations

- No custom/arbitrary timer duration — only the six presets.
- No sound-effect volume separate from background music (there are no
  sound effects yet either).
- No visual "you have N minutes left" indicator anywhere in the app; the
  limit is invisible until it fires.

## Related

- Code: `src/screens/SettingsScreen.tsx`
- Tests: `src/screens/SettingsScreen.test.tsx`
- Related specs: [[Slider]], [[ParentScreen]], [[SessionLockOverlay]], [[useBackgroundMusic]]
