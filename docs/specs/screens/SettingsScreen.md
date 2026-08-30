---
name: SettingsScreen
type: screen
source: src/screens/SettingsScreen.tsx
status: draft
last_verified: 2026-08-30
---

# SettingsScreen

## Purpose

Reached from `ParentScreen`'s cog button (so it inherits that screen's
math-gate protection — there's no separate gate here). Lets a parent adjust
the things that affect the whole app rather than a single puzzle:
background-music volume/mute, the jigsaw piece-grid size, and the
screen-time limit that drives [[SessionLockOverlay]]. Also carries the
app's dedication and (in the About popup) its attributions.

## How it works

Fully controlled, like `ParentScreen` — `SettingsScreen` owns none of this
state itself, only rendering what it's given and calling back on change.
`App.tsx` owns `soundVolume`, `soundMuted`, `timerMinutes`, and
`puzzleSize`.

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
The **Puzzle Size**, **Screen Time Limit**, and **About** sections all
have their label and their controls centred; **Background Music** keeps
its left-aligned label + right-aligned mute button row.

- **Puzzle Size**: a row of preset chips from `PUZZLE_SIZES` (see
  [[puzzleSizes]]) — `2x2` … `6x5`, labelled columns x rows. Tapping one
  calls `onChangePuzzleSize` with the matching `PuzzleSize` object; the
  chip whose `label` equals `puzzleSize.label` is highlighted
  (`accessibilityState={{ selected }}`). `App.tsx` passes the choice to
  `PuzzleScreen` → [[PuzzleBoard]].
- **Screen Time Limit**: a row of preset chips (`Off`, `5 min`, `10 min`,
  `15 min`, `20 min`, `30 min` — `TIMER_PRESETS`) rather than a free-form
  number input. Tapping one calls `onChangeTimerMinutes` with that preset's
  `minutes` (`null` for `Off`); the chip matching the current
  `timerMinutes` is highlighted.
- **About**: local UI state (`aboutVisible`), nothing `App.tsx` owns.
  Tapping the button opens a `Modal` (`transparent`, `animationType="fade"`,
  `maxWidth: 460` card with an even `gap` between every element) showing,
  top to bottom: the app name; the dedication *"Built with love for Julia
  and Vincent"* (italic); a faint divider rule; the credit line; the
  starter-art attribution *"Generated with imagetocartoon.com using our
  family photos"*; the music attribution *"Music by Dmitrii Kolesnikov
  from Pixabay"* (the two names are `accessibilityRole="link"` `Text`
  spans that `Linking.openURL` their Pixabay URLs); the version string;
  and a Close button. All the strings come from `ABOUT_INFO` / `DEDICATION`
  (hand-maintained in this file — see Non-goals). `onRequestClose`
  (Android back / iOS swipe) also dismisses it. The Pixabay links are the
  app's only external link, fine here because Settings sits behind the
  parent gate.

## Interface

| Name | Type | Required | Notes |
|------|------|----------|-------|
| `soundVolume` | `number` | Yes | `0`–`1`, current slider position. |
| `onChangeSoundVolume` | `(value: number) => void` | Yes | Called on every slider drag update. |
| `soundMuted` | `boolean` | Yes | Current mute state. |
| `onToggleMute` | `(muted: boolean) => void` | Yes | Called with the new (opposite) state when the mute button is pressed. |
| `timerMinutes` | `number \| null` | Yes | Current screen-time limit; `null` means off. |
| `onChangeTimerMinutes` | `(minutes: number \| null) => void` | Yes | Called with the tapped preset's value. |
| `puzzleSize` | `PuzzleSize` | Yes | Current jigsaw grid ([[puzzleSizes]]). |
| `onChangePuzzleSize` | `(size: PuzzleSize) => void` | Yes | Called with the tapped size chip's `PuzzleSize`. |
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
4. Tap a puzzle-size chip (e.g. "4x4") → `onChangePuzzleSize` is called
   with that `PuzzleSize`. The chip matching `puzzleSize` renders selected.
5. The dedication text is *not* on the screen until the About popup is
   opened; tapping About shows it along with the app name, the
   imagetocartoon.com line, and the music credit. Tap Close → hidden.
6. In the open About popup, tap the "Dmitrii Kolesnikov" / "Pixabay" links
   → `Linking.openURL` is called with the matching Pixabay URL.
7. Press Back → `onBack` is called.

## Non-goals / known limitations

- No custom/arbitrary timer duration — only the six presets.
- No sound-effect volume separate from background music (there are no
  sound effects yet either).
- No visual "you have N minutes left" indicator anywhere in the app; the
  limit is invisible until it fires.
- `ABOUT_INFO.version` is a hardcoded string, not read from `package.json`
  — nothing keeps it in sync automatically, so it can drift if the app's
  version bumps without this file being touched too.
- The credit line, dedication, and both attributions
  (`ABOUT_INFO.credit` / `.starterArt` / `.music`, and `DEDICATION`) are
  fixed strings — not configurable or localised. Swapping the music track
  (see [[useBackgroundMusic]]) or the starter art means editing them by
  hand. The `utm_*` params on the Pixabay URLs are its referral-attribution
  string, kept verbatim.
- `puzzleSize` isn't persisted — resets to `2x2` on restart, like every
  other setting.

## Related

- Code: `src/screens/SettingsScreen.tsx`
- Tests: `src/screens/SettingsScreen.test.tsx`
- Related specs: [[Slider]], [[Icon]], [[puzzleSizes]], [[ParentScreen]], [[SessionLockOverlay]], [[useBackgroundMusic]]
