export type PuzzleSource = 'user' | 'stock';

export interface Puzzle {
  id: string;
  title: string;
  source: PuzzleSource;
  /** Local file/content URI for a parent-uploaded photo. Stock puzzles don't set this. */
  imageUri?: string;
  /**
   * A bundled image module (the result of `require('./foo.png')`) for a
   * starter puzzle's artwork. Mutually exclusive with `imageUri`; user
   * puzzles never set it. See `src/utils/puzzleImage.ts` for how the two
   * are resolved into something `<Image>` / Skia's `useImage` can load.
   */
  imageAsset?: number;
}
