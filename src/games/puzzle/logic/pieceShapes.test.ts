import { buildPiecePath } from './pieceShapes';
import type { PathCommand } from './pieceShapes';

test('an all-flat piece is exactly a rectangle', () => {
  const path = buildPiecePath(100, 60, {
    top: 'flat',
    right: 'flat',
    bottom: 'flat',
    left: 'flat',
  });

  expect(path).toEqual([
    { op: 'moveTo', x: 0, y: 0 },
    { op: 'lineTo', x: 100, y: 0 },
    { op: 'lineTo', x: 100, y: 60 },
    { op: 'lineTo', x: 0, y: 60 },
    { op: 'lineTo', x: 0, y: 0 },
    { op: 'close' },
  ]);
});

test('the path starts at the origin and ends with close', () => {
  const path = buildPiecePath(100, 100, {
    top: 'tab',
    right: 'blank',
    bottom: 'tab',
    left: 'blank',
  });

  expect(path[0]).toEqual({ op: 'moveTo', x: 0, y: 0 });
  expect(path[path.length - 1]).toEqual({ op: 'close' });
});

test('each side ends exactly at the next corner, with no gaps', () => {
  const width = 120;
  const height = 80;
  const path = buildPiecePath(width, height, {
    top: 'tab',
    right: 'blank',
    bottom: 'tab',
    left: 'blank',
  });

  const lineTos = path.filter(
    (c): c is Extract<PathCommand, { op: 'lineTo' }> => c.op === 'lineTo',
  );
  // The final lineTo of each side lands on a corner: top-right, then
  // bottom-right, then bottom-left, then back to top-left.
  const cornerPoints = [
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
    { x: 0, y: 0 },
  ];
  for (const corner of cornerPoints) {
    expect(lineTos).toContainEqual({ op: 'lineTo', ...corner });
  }
});

// The bump's two cubics rise from the edge to the peak and then fall back
// to the edge (so the whole shape closes up cleanly); the actual peak —
// off the edge line — is the plateau `lineTo` sandwiched between them,
// not either cubic's endpoint (the falling cubic's endpoint is back on
// the edge, at offset 0, by design). A non-flat edge always contributes
// exactly 5 commands (lineTo, cubicTo, lineTo, cubicTo, lineTo); with the
// top edge added first, that's commands[1..5] — scoping to that slice
// (rather than filtering the whole path) avoids confusing the top edge's
// peak with unrelated corner y-values from the other three sides.
function topEdgePlateauY(path: PathCommand[]): number {
  const topEdgeCommands = path.slice(1, 6);
  const plateau = topEdgeCommands[2];
  if (plateau.op !== 'lineTo') {
    throw new Error('Expected the middle command of a non-flat edge to be the plateau lineTo');
  }
  return plateau.y;
}

test('a tab bulges outward (away from the piece interior)', () => {
  const path = buildPiecePath(100, 100, {
    top: 'tab',
    right: 'flat',
    bottom: 'flat',
    left: 'flat',
  });

  // The top edge runs along y=0 with the piece body below it (y > 0), so
  // "outward" for the top edge is negative y.
  expect(topEdgePlateauY(path)).toBeLessThan(0);
});

test('a blank dents inward (into the piece interior)', () => {
  const path = buildPiecePath(100, 100, {
    top: 'blank',
    right: 'flat',
    bottom: 'flat',
    left: 'flat',
  });

  expect(topEdgePlateauY(path)).toBeGreaterThan(0);
});

test('tab and blank bulge by the same depth in opposite directions', () => {
  const tabPath = buildPiecePath(100, 100, {
    top: 'tab',
    right: 'flat',
    bottom: 'flat',
    left: 'flat',
  });
  const blankPath = buildPiecePath(100, 100, {
    top: 'blank',
    right: 'flat',
    bottom: 'flat',
    left: 'flat',
  });

  expect(topEdgePlateauY(tabPath)).toBe(-topEdgePlateauY(blankPath));
});
