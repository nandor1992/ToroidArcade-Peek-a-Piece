import { computeCoverRect } from './coverRect';

test('a wider-than-board image is scaled to fill height, cropped left/right', () => {
  // image 400x200 (2:1), board 200x200 (1:1) — must scale to height (200),
  // giving width 400, centered horizontally with 100px hanging off each side.
  const rect = computeCoverRect(400, 200, 200, 200);
  expect(rect).toEqual({ x: -100, y: 0, width: 400, height: 200 });
});

test('a taller-than-board image is scaled to fill width, cropped top/bottom', () => {
  const rect = computeCoverRect(200, 400, 200, 200);
  expect(rect).toEqual({ x: 0, y: -100, width: 200, height: 400 });
});

test('an image already matching the board aspect ratio needs no cropping', () => {
  const rect = computeCoverRect(300, 300, 150, 150);
  expect(rect).toEqual({ x: 0, y: 0, width: 150, height: 150 });
});

test('falls back to the board size when given a zero or negative dimension', () => {
  expect(computeCoverRect(0, 100, 200, 200)).toEqual({
    x: 0,
    y: 0,
    width: 200,
    height: 200,
  });
  expect(computeCoverRect(100, 100, 0, 200)).toEqual({
    x: 0,
    y: 0,
    width: 0,
    height: 200,
  });
});
