import type { ImageSourcePropType } from 'react-native';
import type { Puzzle } from '../types/puzzle';

/**
 * The `<Image source>` for a puzzle's artwork, or `undefined` when it has
 * none yet (nothing to show but the emoji fallback):
 *
 * - a starter puzzle → its bundled asset module (a `require()`d number),
 * - a parent-uploaded photo → `{ uri }`,
 * - neither set → `undefined`.
 */
export function puzzleImageSource(
  puzzle: Puzzle,
): ImageSourcePropType | undefined {
  if (puzzle.imageAsset != null) {
    return puzzle.imageAsset;
  }
  if (puzzle.imageUri) {
    return { uri: puzzle.imageUri };
  }
  return undefined;
}

/**
 * The same artwork as {@link puzzleImageSource}, but in the shape Skia's
 * `useImage` wants — the bare asset module or URI string, not wrapped in
 * `{ uri }`. `undefined` when the puzzle has no source image to cut into
 * jigsaw pieces.
 */
export function puzzleSkiaSource(puzzle: Puzzle): number | string | undefined {
  if (puzzle.imageAsset != null) {
    return puzzle.imageAsset;
  }
  return puzzle.imageUri;
}
