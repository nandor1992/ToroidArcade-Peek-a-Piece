import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Thin typed wrapper over `AsyncStorage` for JSON values. Every read
 * degrades to `fallback` on a missing key, malformed JSON, or a storage
 * error — persistence is a convenience here, never something a screen
 * should crash over. See docs/specs/storage/asyncStore.md.
 */
export async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Serialize and store `value`. Swallows storage errors (see `readJSON`). */
export async function writeJSON(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Best-effort: a failed write just means this change isn't persisted.
  }
}
