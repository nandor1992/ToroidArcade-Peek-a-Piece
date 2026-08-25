export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Where a `imageWidth` x `imageHeight` image would be drawn, undistorted,
 * to fully cover a `boardWidth` x `boardHeight` area (same idea as CSS
 * `object-fit: cover` / RN's `resizeMode="cover"`) — centered, scaled up
 * just enough that neither dimension leaves a gap. Used to figure out
 * which slice of the photo each puzzle piece should show, without
 * stretching the photo to the board's aspect ratio.
 */
export function computeCoverRect(
  imageWidth: number,
  imageHeight: number,
  boardWidth: number,
  boardHeight: number,
): Rect {
  if (imageWidth <= 0 || imageHeight <= 0 || boardWidth <= 0 || boardHeight <= 0) {
    return { x: 0, y: 0, width: boardWidth, height: boardHeight };
  }
  const scale = Math.max(boardWidth / imageWidth, boardHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return {
    x: (boardWidth - width) / 2,
    y: (boardHeight - height) / 2,
    width,
    height,
  };
}
