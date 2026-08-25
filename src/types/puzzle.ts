export type PuzzleSource = 'user' | 'stock';

export interface Puzzle {
  id: string;
  title: string;
  source: PuzzleSource;
  /** Local file/content URI for a parent-uploaded photo. Stock puzzles don't set this yet. */
  imageUri?: string;
}
