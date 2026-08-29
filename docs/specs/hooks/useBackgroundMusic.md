---
name: useBackgroundMusic
type: hook
source: src/hooks/useBackgroundMusic.ts
status: draft
last_verified: 2026-08-30
---

# useBackgroundMusic

## Purpose

Loops the single bundled background-music track for as long as a
child-facing screen is active — the soundtrack a toddler hears while
playing, and what `SettingsScreen`'s volume slider and mute button act on.

## How it works

Uses `react-native-sound`. On mount, constructs one `Sound` instance
pointed at `background_music.mp3` (`Sound.MAIN_BUNDLE`); on unmount, stops
and releases it. The bundled file is a copy of
`resources/the_mountain-children.mp3` (the source of truth), placed at the
two per-platform bundle paths below. Two more effects keep the live
instance in sync with props:

- `volume`/`muted` → `sound.setVolume(muted ? 0 : volume)`. Muting doesn't
  touch the stored `volume` value, matching `SettingsScreen`'s mute button
  being a separate control from the slider.
- `enabled` → `sound.play()` / `sound.pause()` — but only once
  `sound.isLoaded()` (see below).

`Sound.setCategory('Playback')` is called once at module load (outside the
hook itself), which is what lets iOS keep playing through the silent
switch — see `react-native-sound`'s docs.

**All setup runs from the load callback.** `react-native-sound@0.13`
loads the file asynchronously and *silently ignores* `play()`,
`setVolume()`, and `setNumberOfLoops()` until it finishes — `play()`
before then just fires its completion callback with `false` and returns;
there's no queue. So the hook passes a load callback to `new Sound(...)`
and, inside it, calls `setNumberOfLoops(-1)` (infinite loop — maps to
`setLooping(true)` on Android, `numberOfLoops = -1` on iOS), sets the
volume, and starts playback if enabled. Because props can change while the
file is still loading, the callback reads the *current* `enabled`/`volume`/
`muted` from a ref rather than the values captured at construction. The
`volume`/`muted` and `enabled` effects still fire during loading; they're
harmless no-ops then (the library guards `setVolume` internally; the
`enabled` effect bails on `!isLoaded()`), and the load callback applies
the right state once ready. An earlier version called all three
immediately after `new Sound()` — which is why the track never actually
played (or looped) on a real device.

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
- `enabled: true` from the very first render → playback still starts, from
  the load callback, once the file has loaded (not dropped because
  `play()` was called too early).
- The track reaches its end → it loops back to the start and keeps going,
  indefinitely, until `pause()`/`stop()`.

## Test scenarios

1. `enabled: true` → `play()` is called. Then `enabled: false` → `pause()`
   is called.
2. Mount with `enabled: true` before the async load resolves → `play()` is
   not called synchronously, but is called once loading finishes.
3. After loading, `setNumberOfLoops(-1)` has been called (loop forever);
   it is not called before loading, when the library would ignore it.
4. `muted: true` → `setVolume(0)` regardless of `volume`. `muted: false` →
   `setVolume(volume)`.
5. Unmount → `stop()` and `release()` are both called.

Tested against a manual mock (`__mocks__/react-native-sound.js`, picked up
automatically by Jest for any `react-native-sound` import — see that file's
own comment) rather than the real native module, which doesn't exist
outside a built app. The mock deliberately reproduces the real library's
async load (the constructor callback fires on a microtask, and the
instance methods no-op until then) so scenarios 2–3 are meaningful; tests
`await act()` after mounting to flush it.

## Non-goals / known limitations

- Only one track, no playlist, no per-puzzle music.
- Whoever swaps the track must keep redistribution rights in mind — it
  ships inside the app binary. The current track is licensed under the
  Pixabay Content License; its attribution ("Music by Dmitrii Kolesnikov
  from Pixabay") is shown in the About popup — see [[SettingsScreen]]
  (`ABOUT_INFO.music`) — and must be updated there too when the track
  changes. To replace it: overwrite
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
