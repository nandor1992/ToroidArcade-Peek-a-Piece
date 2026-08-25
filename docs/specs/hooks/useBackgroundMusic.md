---
name: useBackgroundMusic
type: hook
source: src/hooks/useBackgroundMusic.ts
status: draft
last_verified: 2026-08-25
---

# useBackgroundMusic

## Purpose

Loops a single bundled placeholder background-music track for as long as a
child-facing screen is active, so `SettingsScreen`'s volume slider and mute
button have something audible to actually demonstrate — see Non-goals for
what "placeholder" means here.

## How it works

Uses `react-native-sound`. On mount, constructs one `Sound` instance
pointed at `background_music.wav` (`Sound.MAIN_BUNDLE`) and sets it to loop
indefinitely (`setNumberOfLoops(-1)`); on unmount, stops and releases it.
Two more effects keep the live instance in sync with props:

- `volume`/`muted` → `sound.setVolume(muted ? 0 : volume)`. Muting doesn't
  touch the stored `volume` value, matching `SettingsScreen`'s mute button
  being a separate control from the slider.
- `enabled` → `sound.play()` / `sound.pause()`.

`Sound.setCategory('Playback')` is called once at module load (outside the
hook itself), which is what lets iOS keep playing through the silent
switch — see `react-native-sound`'s docs.

**Load-callback ordering matters.** `setNumberOfLoops` is called
immediately after constructing the `Sound`, not from inside its load
callback — an earlier version did the latter and closed over the `sound`
variable from inside that callback, which broke the moment the callback
fired synchronously (exactly what the test mock does, and what a real
implementation could legitimately do too depending on caching). Keep new
per-instance setup calls outside that callback for the same reason.

`App.tsx` calls this with `enabled: inChildSession && !locked` — music
plays on `HomeScreen`/`PuzzleScreen`, pauses on any parent-only screen and
while `SessionLockOverlay` is showing.

## Interface

| Name | Type | Required | Notes |
|------|------|----------|-------|
| `enabled` | `boolean` | Yes | Whether the track should be audible right now. |
| `volume` | `number` | Yes | `0`–`1`. Ignored while `muted`. |
| `muted` | `boolean` | Yes | Forces effective volume to `0` without discarding `volume`. |

Returns nothing — this hook is called for its side effect only.

## Edge cases & expected behavior

- Component unmounts mid-playback → the sound is stopped and released, not
  left playing.
- `enabled` toggles rapidly → each toggle just calls `play()`/`pause()` on
  the same long-lived instance; no reload happens.

## Test scenarios

1. `enabled: true` → `play()` is called. Then `enabled: false` → `pause()`
   is called.
2. `muted: true` → `setVolume(0)` regardless of `volume`. `muted: false` →
   `setVolume(volume)`.
3. Unmount → `stop()` and `release()` are both called.

Tested against a manual mock (`__mocks__/react-native-sound.js`, picked up
automatically by Jest for any `react-native-sound` import — see that file's
own comment) rather than the real native module, which doesn't exist
outside a built app.

## Non-goals / known limitations

- `background_music.wav` is a synthesized placeholder tone (a short major
  arpeggio, generated locally, not a licensed or composed track) — good
  enough to prove the mute/volume wiring works, not what should ship.
  Swapping in real music is a follow-up, same caveat as the starter-puzzle
  photos.
- Only one track, no playlist, no per-puzzle music.
- iOS needs the file added to the Xcode project's bundle resources
  (`ios/PeekaPiece/background_music.wav` exists on disk, but Xcode project
  membership has to be added manually — see the note in this feature's
  commit message); Android picks it up automatically from
  `android/app/src/main/res/raw/background_music.wav`.
- No fade in/out on enable/disable — play/pause is immediate.

## Related

- Code: `src/hooks/useBackgroundMusic.ts`
- Tests: `src/hooks/useBackgroundMusic.test.tsx`
- Mock: `__mocks__/react-native-sound.js`
- Related specs: [[SettingsScreen]]
