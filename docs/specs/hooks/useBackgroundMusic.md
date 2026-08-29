---
name: useBackgroundMusic
type: hook
source: src/hooks/useBackgroundMusic.ts
status: draft
last_verified: 2026-08-29
---

# useBackgroundMusic

## Purpose

Loops the single bundled background-music track for as long as a
child-facing screen is active — the soundtrack a toddler hears while
playing, and what `SettingsScreen`'s volume slider and mute button act on.

## How it works

Uses `react-native-sound`. On mount, constructs one `Sound` instance
pointed at `background_music.mp3` (`Sound.MAIN_BUNDLE`) and sets it to loop
indefinitely (`setNumberOfLoops(-1)`); on unmount, stops and releases it.
The bundled file is a copy of `resources/the_mountain-children.mp3` (the
source of truth), placed at the two per-platform bundle paths below.
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

- Only one track, no playlist, no per-puzzle music.
- Whoever swaps the track must keep redistribution rights in mind — it
  ships inside the app binary. To replace it: overwrite
  `resources/the_mountain-children.mp3` and re-copy it to
  `android/app/src/main/res/raw/background_music.mp3` and
  `ios/PeekaPiece/background_music.mp3` (keep those bundle filenames, since
  `BACKGROUND_MUSIC_FILE` and the Android raw-resource lookup depend on
  them). A different bundle name also needs the iOS `project.pbxproj`
  reference updated.
- Bundle wiring: iOS references `PeekaPiece/background_music.mp3` from
  `project.pbxproj` (PBXFileReference + the Resources build phase); Android
  picks it up automatically from
  `android/app/src/main/res/raw/background_music.mp3` (lowercase,
  `[a-z0-9_]` only — hence the generic bundle name rather than the source
  file's `the_mountain-children.mp3`).
- No fade in/out on enable/disable — play/pause is immediate.

## Related

- Code: `src/hooks/useBackgroundMusic.ts`
- Tests: `src/hooks/useBackgroundMusic.test.tsx`
- Mock: `__mocks__/react-native-sound.js`
- Track source: `resources/the_mountain-children.mp3`
- Bundled copies: `android/app/src/main/res/raw/background_music.mp3`, `ios/PeekaPiece/background_music.mp3`
- Related specs: [[SettingsScreen]]
