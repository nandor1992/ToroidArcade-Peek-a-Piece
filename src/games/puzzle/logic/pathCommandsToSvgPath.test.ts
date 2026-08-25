import { buildPiecePath } from './pieceShapes';
import { pathCommandsToSvgPath } from './pathCommandsToSvgPath';

test('serializes a rectangle piece to the expected SVG path', () => {
  const path = buildPiecePath(100, 60, {
    top: 'flat',
    right: 'flat',
    bottom: 'flat',
    left: 'flat',
  });

  expect(pathCommandsToSvgPath(path)).toBe(
    'M 0 0 L 100 0 L 100 60 L 0 60 L 0 0 Z',
  );
});

test('cubic segments serialize with both control points', () => {
  const path = buildPiecePath(100, 100, {
    top: 'tab',
    right: 'flat',
    bottom: 'flat',
    left: 'flat',
  });

  const d = pathCommandsToSvgPath(path);
  expect(d.startsWith('M 0 0')).toBe(true);
  expect(d).toContain('C ');
  expect(d.endsWith('Z')).toBe(true);
  // One "C x y, x y, x y" per cubic, two cubics per non-flat edge.
  expect(d.match(/C /g)).toHaveLength(2);
});
