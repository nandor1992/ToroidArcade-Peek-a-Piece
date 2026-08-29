import { useEffect, useRef } from 'react';
import Sound from 'react-native-sound';

Sound.setCategory('Playback');

const BACKGROUND_MUSIC_FILE = 'background_music.mp3';

export interface UseBackgroundMusicOptions {
  /** Whether music should be audible right now (e.g. a child-facing screen is active). */
  enabled: boolean;
  /** 0 (silent) to 1 (full volume) — the parent's chosen level, independent of `muted`. */
  volume: number;
  /** Overrides `volume` to silence playback without losing the stored level. */
  muted: boolean;
}

/**
 * Loops the single bundled background track (from
 * `resources/the_mountain-children.mp3`) for as long as `enabled` is true,
 * at `muted ? 0 : volume`. See docs/specs/hooks/useBackgroundMusic.md.
 */
export function useBackgroundMusic({
  enabled,
  volume,
  muted,
}: UseBackgroundMusicOptions): void {
  const soundRef = useRef<Sound | null>(null);
  // The latest desired state, so the async load callback below can apply
  // whatever's current by the time the file finishes loading — not the
  // stale values captured when the sound was constructed.
  const desiredRef = useRef({ enabled, volume, muted });
  desiredRef.current = { enabled, volume, muted };

  useEffect(() => {
    let released = false;
    // `react-native-sound` silently ignores play()/setVolume()/
    // setNumberOfLoops() until `prepare()` has finished loading the file
    // (there's no queue — play() before then just no-ops). So all the
    // initial setup has to run from inside this load callback, once
    // `isLoaded()` is true, rather than immediately after `new Sound()`.
    const sound = new Sound(
      BACKGROUND_MUSIC_FILE,
      Sound.MAIN_BUNDLE,
      error => {
        if (error || released) {
          return;
        }
        sound.setNumberOfLoops(-1);
        const desired = desiredRef.current;
        sound.setVolume(desired.muted ? 0 : desired.volume);
        if (desired.enabled) {
          sound.play();
        }
      },
    );
    soundRef.current = sound;
    return () => {
      released = true;
      sound.stop();
      sound.release();
      soundRef.current = null;
    };
  }, []);

  useEffect(() => {
    // No-op until loaded (the library guards this internally); the load
    // callback applies the right volume from `desiredRef` in that case.
    soundRef.current?.setVolume(muted ? 0 : volume);
  }, [volume, muted]);

  useEffect(() => {
    const sound = soundRef.current;
    // Same story: before the file has loaded there's nothing to play or
    // pause yet — the load callback starts playback if `enabled` by then.
    if (!sound || !sound.isLoaded()) {
      return;
    }
    if (enabled) {
      sound.play();
    } else {
      sound.pause();
    }
  }, [enabled]);
}
