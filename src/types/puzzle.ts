export type PuzzleSource = 'user' | 'stock';

export interface Puzzle {
  id: string;
  title: string;
  source: PuzzleSource;
}
