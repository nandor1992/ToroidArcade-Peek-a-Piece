import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
// The source of truth for the track (docs/architecture.md); the native
// builds copy it into their own bundle paths, the web build imports it
// directly so there's no fourth copy of a 3 MB file in the repo.
import musicUrl from '../../resources/the_mountain-children.mp3';

export interface UseBackgroundMusicOptions {
  /** Whether music should be audible right now (e.g. a child-facing screen is active). */
  enabled: boolean;
  /** 0 (silent) to 1 (full volume) — the parent's chosen level, independent of `muted`. */
  volume: number;
  /** Overrides `volume` to silence playback without losing the stored level. */
  muted: boolean;
}

/**
 * Web implementation of {@link useBackgroundMusic} — same interface, HTML5
 * `Audio` instead of `react-native-sound` (which has no web build).
 * See docs/specs/hooks/useBackgroundMusic.md.
 *
 * The one behavioural difference from native is forced by the browser:
 * autoplay is blocked until the page has seen a user gesture, so a rejected
 * `play()` arms a one-shot listener that retries on the first pointer/key
 * event. Everything else — looping, the volume/mute split, pausing when the
 * app is backgrounded — matches native, and the foreground gate reuses the
 * same `AppState` API (react-native-web maps it to the Page Visibility API).
 */
export function useBackgroundMusic({
  enabled,
  volume,
  muted,
}: UseBackgroundMusicOptions): void {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [appActive, setAppActive] = useState(
    () => AppState.currentState !== 'background',
  );
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      setAppActive(nextState === 'active');
    });
    return () => subscription?.remove?.();
  }, []);
  const shouldPlay = enabled && appActive;

  // One long-lived element for the whole session, like the native `Sound`.
  useEffect(() => {
    const audio = new Audio(musicUrl);
    audio.loop = true;
    audio.preload = 'auto';
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    if (!shouldPlay) {
      audio.pause();
      return;
    }

    let cancelled = false;
    let retryOnGesture: (() => void) | null = null;

    const stopWaitingForGesture = () => {
      if (!retryOnGesture) {
        return;
      }
      window.removeEventListener('pointerdown', retryOnGesture);
      window.removeEventListener('keydown', retryOnGesture);
      retryOnGesture = null;
    };

    const attempt = () => {
      // `play()` rejects with NotAllowedError until the page has had a user
      // gesture. Anything else (e.g. the element being torn down) is also
      // non-fatal — music is ambience, never a blocker.
      audio.play().catch(() => {
        if (cancelled || retryOnGesture) {
          return;
        }
        retryOnGesture = () => {
          stopWaitingForGesture();
          if (!cancelled) {
            attempt();
          }
        };
        window.addEventListener('pointerdown', retryOnGesture, { once: true });
        window.addEventListener('keydown', retryOnGesture, { once: true });
      });
    };
    attempt();

    return () => {
      cancelled = true;
      stopWaitingForGesture();
    };
  }, [shouldPlay]);
}
