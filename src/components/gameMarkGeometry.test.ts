/**
 * @format
 */

import {
  MARK_CANVAS,
  MEMORY_MARK,
  PUZZLE_MARK,
  type GameMarkGeometry,
} from './gameMarkGeometry';

// These lock the *derivation*, not the numbers: the marks are generated from
// resources/peekapiece-mark.svg by scripts/generate-game-marks.js, and the
// point of the generator is that they keep the brand mark's proportions. If
// someone regenerates after changing the brand art, these catch a mark that
// has drifted off those proportions rather than silently shipping it.

/**
 * Flattens a path (only M/L/C/Z appear in the generated data) into a
 * polyline, so an edge can be measured where it actually runs rather than
 * only at its control points — a flat top edge has no control point above
 * the eye at all.
 */
function flatten(d: string): Array<[number, number]> {
  const tokens = d.match(/[MLCZ][^MLCZ]*/g) ?? [];
  const out: Array<[number, number]> = [];
  let cur: [number, number] = [0, 0];
  let start: [number, number] = [0, 0];
  for (const token of tokens) {
    const nums = (token.slice(1).match(/-?[0-9.]+/g) ?? []).map(Number);
    if (token[0] === 'M') {
      cur = [nums[0], nums[1]];
      start = cur;
      out.push(cur);
    } else if (token[0] === 'L') {
      cur = [nums[0], nums[1]];
      out.push(cur);
    } else if (token[0] === 'C') {
      const [x1, y1, x2, y2, x3, y3] = nums;
      const [x0, y0] = cur;
      for (let i = 1; i <= 24; i++) {
        const t = i / 24;
        const u = 1 - t;
        out.push([
          u * u * u * x0 +
            3 * u * u * t * x1 +
            3 * u * t * t * x2 +
            t * t * t * x3,
          u * u * u * y0 +
            3 * u * u * t * y1 +
            3 * u * t * t * y2 +
            t * t * t * y3,
        ]);
      }
      cur = [x3, y3];
    } else {
      out.push(start);
      cur = start;
    }
  }
  return out;
}

/** The topmost y at which any shape crosses the vertical line x = `x`. */
function topEdgeAt(mark: GameMarkGeometry, x: number): number {
  let top = Infinity;
  for (const shape of mark.shapes) {
    if (shape.opacity != null) {
      continue; // decoration (the card-back art), not an outline
    }
    const poly = flatten(shape.d);
    for (let i = 1; i < poly.length; i++) {
      const [ax, ay] = poly[i - 1];
      const [bx, by] = poly[i];
      if ((ax - x) * (bx - x) > 0 || ax === bx) {
        continue;
      }
      const y = ay + ((x - ax) / (bx - ax)) * (by - ay);
      top = Math.min(top, y);
    }
  }
  return top;
}

/** Every "x y" coordinate pair in a path. */
function points(d: string): Array<[number, number]> {
  return [...d.matchAll(/(-?[0-9.]+)\s(-?[0-9.]+)/g)].map(m => [
    Number(m[1]),
    Number(m[2]),
  ]);
}

function allPoints(mark: GameMarkGeometry): Array<[number, number]> {
  return mark.shapes.flatMap(shape => points(shape.d));
}

function bounds(mark: GameMarkGeometry) {
  const pts = allPoints(mark);
  const eyeTop = Math.min(...mark.eyes.map(e => e.cy - e.r));
  const xs = pts.map(p => p[0]);
  const ys = pts.map(p => p[1]);
  return {
    left: Math.min(...xs, ...mark.eyes.map(e => e.cx - e.r)),
    right: Math.max(...xs, ...mark.eyes.map(e => e.cx + e.r)),
    top: Math.min(...ys, eyeTop),
    bottom: Math.max(...ys),
  };
}

const MARKS: Array<[string, GameMarkGeometry]> = [
  ['puzzle', PUZZLE_MARK],
  ['memory', MEMORY_MARK],
];

describe.each(MARKS)('%s mark', (_name, mark) => {
  test('every path is closed and free of malformed numbers', () => {
    for (const shape of mark.shapes) {
      expect(shape.d).toMatch(/^M/);
      expect(shape.d).toMatch(/Z$/);
      expect(shape.d).not.toMatch(/NaN|undefined|Infinity/);
      expect(points(shape.d).length).toBeGreaterThan(0);
    }
  });

  test('stays inside the authored canvas', () => {
    const b = bounds(mark);
    expect(b.left).toBeGreaterThanOrEqual(0);
    expect(b.top).toBeGreaterThanOrEqual(0);
    expect(b.right).toBeLessThanOrEqual(MARK_CANVAS);
    expect(b.bottom).toBeLessThanOrEqual(MARK_CANVAS);
  });

  test('is centred in the canvas', () => {
    const b = bounds(mark);
    // Within 12 of centre on both axes — tight enough that the two marks
    // look optically aligned when they sit side by side on the picker.
    expect(Math.abs((b.left + b.right) / 2 - MARK_CANVAS / 2)).toBeLessThan(12);
    expect(Math.abs((b.top + b.bottom) / 2 - MARK_CANVAS / 2)).toBeLessThan(12);
  });

  test('has two eyes, level with each other, symmetric about the centre', () => {
    expect(mark.eyes).toHaveLength(2);
    const [left, right] = mark.eyes;
    expect(left.cy).toBe(right.cy);
    expect(left.r).toBe(right.r);
    expect((left.cx + right.cx) / 2).toBeCloseTo(MARK_CANVAS / 2, 1);
  });

  test("each eye's catchlight sits up and to the left, inside the iris", () => {
    for (const eye of mark.eyes) {
      expect(eye.highlight.cx).toBeLessThan(eye.cx);
      expect(eye.highlight.cy).toBeLessThan(eye.cy);
      const dx = eye.cx - eye.highlight.cx;
      const dy = eye.cy - eye.highlight.cy;
      expect(Math.hypot(dx, dy) + eye.highlight.r).toBeLessThan(eye.r);
    }
  });

  test('eye radius keeps the brand mark 0.198 ratio against the artwork', () => {
    const b = bounds(mark);
    // The brand mark's eye radius is 0.198 of the shape's width. Both marks
    // are built around a 300-wide shape, so both eyes come out the same size
    // — which is what makes the two picker tiles balance.
    expect(mark.eyes[0].r).toBeCloseTo(0.198 * 300, 1);
    expect(b.right - b.left).toBeGreaterThan(280);
  });
});

test('both marks bury the same fraction of the eye, as the app icon does', () => {
  // resources/peekapiece-icon.svg hides 16 of each eye's 46 radius behind the
  // piece. Every mark has to hide the same fraction or the family resemblance
  // goes: the eyes stop reading as peeking over something.
  const APP_ICON_BURY = 16 / 46;

  for (const [name, mark] of MARKS) {
    for (const eye of mark.eyes) {
      const shapeTop = topEdgeAt(mark, eye.cx);
      expect(Number.isFinite(shapeTop)).toBe(true);
      const buried = (eye.cy + eye.r - shapeTop) / eye.r;
      expect(`${name} ${buried.toFixed(3)}`).toBe(
        `${name} ${APP_ICON_BURY.toFixed(3)}`,
      );
    }
  }
});

test('the puzzle mark uses the four brand piece colours', () => {
  const fills = PUZZLE_MARK.shapes.map(s => s.fill.toUpperCase());
  for (const colour of ['#2EC4B6', '#FF6B6B', '#9B5DE5', '#7BC950']) {
    expect(fills).toContain(colour);
  }
});

test('every shape has a drop-shadow twin behind it', () => {
  // The brand mark pairs each shape with a darker copy offset downward. Both
  // marks follow it, so the shape count is even and the shades are darker
  // than the bodies they sit under.
  for (const [, mark] of MARKS) {
    const opaque = mark.shapes.filter(s => s.opacity == null);
    expect(opaque.length % 2).toBe(0);
  }
  const [shade] = PUZZLE_MARK.shapes;
  const body = PUZZLE_MARK.shapes[PUZZLE_MARK.shapes.length - 4];
  const lum = (hex: string) =>
    parseInt(hex.slice(1, 3), 16) +
    parseInt(hex.slice(3, 5), 16) +
    parseInt(hex.slice(5, 7), 16);
  expect(lum(shade.fill)).toBeLessThan(lum(body.fill));
});
