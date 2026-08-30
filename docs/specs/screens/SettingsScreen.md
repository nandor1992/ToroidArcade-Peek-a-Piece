---
name: SettingsScreen
type: screen
source: src/screens/SettingsScreen.tsx
status: draft
last_verified: 2026-08-30
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

The back button is a chevron [[Icon]] (`back`).

- **Background Music**: a [[Slider]] bound to `soundVolume`
  (`onChangeSoundVolume`), plus a separate mute button — an [[Icon]]
  (`volumeOn` / `volumeOff` depending on `soundMuted`) — that calls
  `onToggleMute` with the *opposite* of the current value. Muting doesn't
  change `soundVolume` — it's a separate flag layered on top, so unmuting
  restores whatever level was set before. The slider dims (`opacity: 0.4`)
  while muted as a visual hint, but stays interactive; dragging it while
  muted does not auto-unmute. `App.tsx` keeps the background track
  *playing* while this screen is open (unlike other parent screens) so the
  slider and mute button have something audible to affect — see
  [[useBackgroundMusic]].
- **Screen Time Limit**: a row of preset chips (`Off`, `5 min`, `10 min`,
  `15 min`, `20 min`, `30 min` — `TIMER_PRESETS`) rather than a free-form
  number input. Tapping one calls `onChangeTimerMinutes` with that preset's
  `minutes` (`null` for `Off`); the chip matching the current
  `timerMinutes` is highlighted (`accessibilityState={{ selected }}`
  too).
- **About**: unlike everything else on this screen, this is local UI state
  (`aboutVisible`) rather than something `App.tsx` owns — there's nothing
  for a caller to control or react to. Tapping the About button opens a
  `Modal` (`transparent`, `animationType="fade"`) showing the app name,
  a fixed credit line, a background-music attribution line ("Music by
  *Dmitrii Kolesnikov* from *Pixabay*", the two names being
  `accessibilityRole="link"` `Text` spans that `Linking.openURL` their
  Pixabay URLs), and a version string (all from `ABOUT_INFO`,
  hand-maintained in this file — see Non-goals), with a Close button that
  dismisses it. `onRequestClose` (Android back button / iOS swipe) also
  dismisses it. This is the one place in the app that opens an external
  link, and it's fine here because Settings sits behind the parent gate.

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
4. Tap the About button → the popup becomes visible and shows the app
   name. Tap Close → the popup is hidden again.
5. In the open About popup, tap the "Dmitrii Kolesnikov" / "Pixabay" links
   → `Linking.openURL` is called with the matching Pixabay URL.
6. Press Back → `onBack` is called.

## Non-goals / known limitations

- No custom/arbitrary timer duration — only the six presets.
- No sound-effect volume separate from background music (there are no
  sound effects yet either).
- No visual "you have N minutes left" indicator anywhere in the app; the
  limit is invisible until it fires.
- `ABOUT_INFO.version` is a hardcoded string, not read from `package.json`
  — nothing keeps it in sync automatically, so it can drift if the app's
  version bumps without this file being touched too.
- "Who created the app" is a fixed credit line (`ABOUT_INFO.credit`), not
  configurable or localized.
- The music attribution (`ABOUT_INFO.music`) is likewise hardcoded for the
  one bundled track; swapping the track (see [[useBackgroundMusic]]) means
  updating this line by hand too. The `utm_*` params on the URLs are
  Pixabay's referral-attribution string, kept verbatim.

## Related

- Code: `src/screens/SettingsScreen.tsx`
- Tests: `src/screens/SettingsScreen.test.tsx`
- Related specs: [[Slider]], [[Icon]], [[ParentScreen]], [[SessionLockOverlay]], [[useBackgroundMusic]]
