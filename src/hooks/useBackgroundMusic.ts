import { useEffect, useRef } from 'react';
import Sound from 'react-native-sound';

Sound.setCategory('Playback');

const BACKGROUND_MUSIC_FILE = 'background_music.wav';

export interface UseBackgroundMusicOptions {
  /** Whether music should be audible right now (e.g. a child-facing screen is active). */
  enabled: boolean;
  /** 0 (silent) to 1 (full volume) — the parent's chosen level, independent of `muted`. */
  volume: number;
  /** Overrides `volume` to silence playback without losing the stored level. */
  muted: boolean;
}

/**
 * Loops a single bundled placeholder track for as long as `enabled` is
 * true, at `muted ? 0 : volume`. See
 * docs/specs/hooks/useBackgroundMusic.md.
 */
export function useBackgroundMusic({
  enabled,
  volume,
  muted,
}: UseBackgroundMusicOptions): void {
  const soundRef = useRef<Sound | null>(null);

  useEffect(() => {
    // setNumberOfLoops is set right away, not inside the load callback:
    // that callback's timing isn't guaranteed (real playback loads it
    // asynchronously; a mock could easily call it synchronously), so
    // closing over `sound` there is fragile either way.
    const sound = new Sound(BACKGROUND_MUSIC_FILE, Sound.MAIN_BUNDLE);
    sound.setNumberOfLoops(-1);
    soundRef.current = sound;
    return () => {
      sound.stop();
      sound.release();
      soundRef.current = null;
    };
  }, []);

  useEffect(() => {
    soundRef.current?.setVolume(muted ? 0 : volume);
  }, [volume, muted]);

  useEffect(() => {
    if (enabled) {
      soundRef.current?.play();
    } else {
      soundRef.current?.pause();
    }
  }, [enabled]);
}
