export interface MemorySize {
  /** How it's shown on the Settings chip — the picture count. */
  label: string;
  /**
   * How many distinct pictures are dealt. Each one appears on two cards,
   * so the board holds `pictures * 2` cards.
   */
  pictures: number;
}

/**
 * The picture counts a parent can pick from in Settings, from a 3-pair
 * board a two-year-old can actually clear up to a 10-pair one for an older
 * sibling. Kept modest at the top end: past ten pairs the cards get too
 * small to recognise a face on a phone, which defeats the point.
 */
export const MEMORY_SIZES: readonly MemorySize[] = [
  { label: '3', pictures: 3 },
  { label: '4', pictures: 4 },
  { label: '6', pictures: 6 },
  { label: '8', pictures: 8 },
  { label: '10', pictures: 10 },
] as const;

/** Six pictures — twelve cards. */
export const DEFAULT_MEMORY_SIZE: MemorySize = MEMORY_SIZES[2];

export function findMemorySize(label: string): MemorySize {
  return (
    MEMORY_SIZES.find(size => size.label === label) ?? DEFAULT_MEMORY_SIZE
  );
}
