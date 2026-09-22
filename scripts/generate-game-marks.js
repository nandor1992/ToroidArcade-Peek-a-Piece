/**
 * Generates src/components/gameMarkGeometry.ts — the vector geometry for the
 * Family Puzzle and Family Memory marks on the game picker.
 *
 *   node scripts/generate-game-marks.js
 *
 * Why generate rather than hand-author: both marks are built out of
 * resources/peekapiece-mark.svg, so their eyes, knob curves and drop-shadow
 * offsets are *derived* from the brand mark rather than eyeballed against it.
 * Keeping the derivation in code means that if the brand mark changes, this
 * re-runs instead of someone re-transcribing bezier data by hand (which is
 * what had to happen for the native launcher icons — see docs/architecture.md).
 *
 * Everything is emitted as absolute coordinates in a 512x512 space with
 * rotations already baked in, so the runtime component applies exactly one
 * transform (a uniform scale) and never has to care whether Skia measures
 * rotation in degrees or radians.
 */
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'src', 'components', 'gameMarkGeometry.ts');
const CANVAS = 512;
const DROP = 10; // the brand mark's own under-layer offset

const C = {
  teal: '#2EC4B6',
  navy: '#26385A',
  coral: '#FF6B6B',
  violet: '#9B5DE5',
  leaf: '#7BC950',
};

const r1 = n => Math.round(n * 10) / 10;
const pt = p => `${r1(p[0])} ${r1(p[1])}`;

/**
 * The brand mark shades its drop layer #2EC4B6 -> #1FA396, which is roughly a
 * 0.82 multiply. Applying the same rule gives every piece colour a matching
 * under-shade without inventing new brand colours.
 */
function shade(hex, k = 0.82) {
  /* eslint-disable no-bitwise -- unpacking a hex colour is what bitwise is for */
  const n = parseInt(hex.slice(1), 16);
  return (
    '#' +
    [(n >> 16) & 255, (n >> 8) & 255, n & 255]
      .map(v => Math.round(v * k).toString(16).padStart(2, '0'))
      .join('')
  );
  /* eslint-enable no-bitwise */
}

/* ------------------------------------------------------------------ knobs */

/**
 * The right-hand knob of resources/peekapiece-mark.svg, re-expressed as
 * (t, d): t runs 0..1 along the edge, d is the outward perpendicular offset,
 * both normalised by the cell size. Feeding a single cell through this
 * reproduces the brand mark's own piece path almost exactly.
 */
const KNOB = [
  [[0.25, 0], [0.33, 0], [0.38, 0.04]],
  [[0.44, 0.14], [0.32, 0.2], [0.5, 0.2]],
  [[0.68, 0.2], [0.56, 0.14], [0.62, 0.04]],
  [[0.68, 0], [0.75, 0], [1.0, 0]],
];

/**
 * An edge as absolute cubic segments. A seam is built once and reused
 * *reversed* by the neighbouring piece, which is what makes the pieces
 * actually interlock rather than merely look like they might.
 */
function knobEdge(from, to, sign) {
  const ex = to[0] - from[0];
  const ey = to[1] - from[1];
  const px = ey; // perpendicular, left of travel
  const py = -ex;
  const map = ([t, d]) => [
    from[0] + ex * t + px * d * sign,
    from[1] + ey * t + py * d * sign,
  ];
  return { start: from, segs: KNOB.map(seg => seg.map(map)) };
}

const flatEdge = (from, to) => ({ start: from, segs: [[from, to, to]] });

const forward = edge =>
  edge.segs.map(([c1, c2, e]) => `C${pt(c1)} ${pt(c2)} ${pt(e)}`).join('');

function reverse(edge) {
  const out = [];
  for (let i = edge.segs.length - 1; i >= 0; i--) {
    const [c1, c2] = edge.segs[i];
    const end = i === 0 ? edge.start : edge.segs[i - 1][2];
    out.push(`C${pt(c2)} ${pt(c1)} ${pt(end)}`);
  }
  return out.join('');
}

/** A 2x2 interlocking block, walked clockwise: top, right, bottom, left. */
function grid2x2(x, y, cell, signs) {
  const cx = x + cell;
  const cy = y + cell;
  // Interior seams, each defined once. V[row] runs top->bottom at x=cx;
  // H[col] runs left->right at y=cy.
  const V = [
    knobEdge([cx, y], [cx, cy], signs.v0),
    knobEdge([cx, cy], [cx, y + 2 * cell], signs.v1),
  ];
  const H = [
    knobEdge([x, cy], [cx, cy], signs.h0),
    knobEdge([cx, cy], [x + 2 * cell, cy], signs.h1),
  ];

  const pieces = [];
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      const x0 = x + col * cell;
      const y0 = y + row * cell;
      const tl = [x0, y0];
      const tr = [x0 + cell, y0];
      const br = [x0 + cell, y0 + cell];
      const bl = [x0, y0 + cell];
      pieces.push(
        `M${pt(tl)}` +
          forward(row === 0 ? flatEdge(tl, tr) : H[col]) +
          forward(col === 1 ? flatEdge(tr, br) : V[row]) +
          (row === 1 ? forward(flatEdge(br, bl)) : reverse(H[col])) +
          (col === 0 ? forward(flatEdge(bl, tl)) : reverse(V[row])) +
          'Z',
      );
    }
  }
  return pieces;
}

/* ------------------------------------------------------------ primitives */

const translate = (d, dx, dy) =>
  d.replace(/-?\d+(\.\d+)?\s-?\d+(\.\d+)?/g, m => {
    const [x, y] = m.split(/\s+/).map(Number);
    return `${r1(x + dx)} ${r1(y + dy)}`;
  });

function rotator(cx, cy, deg) {
  const a = (deg * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  return ([x, y]) => [cx + x * cos - y * sin, cy + x * sin + y * cos];
}

/** A rounded rect centred on the origin, rotated, as an absolute path. */
function roundedCard(cx, cy, deg, w, h, radius, dy = 0) {
  const map = rotator(cx, cy, deg);
  const x0 = -w / 2;
  const y0 = -h / 2 + dy;
  const x1 = w / 2;
  const y1 = h / 2 + dy;
  // Circular-arc corners approximated with the standard 0.5523 bezier
  // constant, so the whole card is one path and needs no runtime transform.
  const k = radius * 0.5523;
  const P = (x, y) => pt(map([x, y]));
  return (
    `M${P(x0 + radius, y0)}` +
    `L${P(x1 - radius, y0)}` +
    `C${P(x1 - radius + k, y0)} ${P(x1, y0 + radius - k)} ${P(x1, y0 + radius)}` +
    `L${P(x1, y1 - radius)}` +
    `C${P(x1, y1 - radius + k)} ${P(x1 - radius + k, y1)} ${P(x1 - radius, y1)}` +
    `L${P(x0 + radius, y1)}` +
    `C${P(x0 + radius - k, y1)} ${P(x0, y1 - radius + k)} ${P(x0, y1 - radius)}` +
    `L${P(x0, y0 + radius)}` +
    `C${P(x0, y0 + radius - k)} ${P(x0 + radius - k, y0)} ${P(x0 + radius, y0)}` +
    'Z'
  );
}

/** Applies translate-then-scale to an absolute path (for the card back art). */
function placePath(d, scale, cx, cy, srcCx, srcCy) {
  return d.replace(/-?\d+(\.\d+)?\s-?\d+(\.\d+)?/g, m => {
    const [x, y] = m.split(/\s+/).map(Number);
    return `${r1(cx + (x - srcCx) * scale)} ${r1(cy + (y - srcCy) * scale)}`;
  });
}

/**
 * Eyes at the brand mark's exact proportions: radius 0.198 of the shape's
 * width, centres 0.448 apart, highlight up-and-left at 0.060/0.069 with
 * radius 0.060. `cy` is chosen so the shape below hides 34.8% of each eye —
 * the same fraction the app icon's piece hides.
 */
function eyes(cx, cy, w) {
  const R = 0.198 * w;
  const dx = 0.224 * w;
  const off = 0.0603 * w;
  return [-dx, dx].map(o => ({
    cx: r1(cx + o),
    cy: r1(cy),
    r: r1(R),
    highlight: {
      cx: r1(cx + o - off),
      cy: r1(cy - 0.069 * w),
      r: r1(off),
    },
  }));
}

const BURY = 0.348; // fraction of each eye radius hidden by the shape

/* ---------------------------------------------------------------- marks */

// The launcher icon's piece silhouette, used as the memory card's back art.
const MARK_PIECE =
  'M117 173C193.6 173 270.1 173 349 173C349 231 349 249.6 358.3 261.2' +
  'C381.5 275.1 395.4 247.2 395.4 289C395.4 330.8 381.5 302.9 358.3 316.8' +
  'C349 328.4 349 347 349 405C272.4 405 195.9 405 117 405C117 347 117 328.4 126.3 316.8' +
  'C149.5 302.9 163.4 330.8 163.4 289C163.4 247.2 149.5 275.1 126.3 261.2' +
  'C117 249.6 117 231 117 173Z';
const MARK_PIECE_CENTRE = [256, 289];

function puzzleMark() {
  const X = 106;
  const Y = 152;
  const CELL = 150;
  const W = CELL * 2;
  const paths = grid2x2(X, Y, CELL, { v0: 1, v1: -1, h0: -1, h1: 1 });
  const fills = [C.teal, C.coral, C.violet, C.leaf]; // TL, TR, BL, BR
  return {
    eyes: eyes(X + W / 2, Y - (1 - BURY) * 0.198 * W, W),
    // Shades first so every piece's under-layer sits behind every body,
    // which is what makes the offset read through the seams as depth.
    shapes: [
      ...paths.map((d, i) => ({ d: translate(d, 0, DROP), fill: shade(fills[i]) })),
      ...paths.map((d, i) => ({ d, fill: fills[i] })),
    ],
  };
}

function memoryMark() {
  const W = 186;
  const H = 246;
  const RADIUS = 26;
  const TILT = 11;
  const CY = 292;
  // Mirrored tilts about the centre line, so both cards' top edges sit at the
  // same height under each eye and the two eyes are buried equally.
  const back = { cx: 206, deg: -TILT, fill: C.coral };
  const front = { cx: 306, deg: TILT, fill: C.teal };

  const backCentre = rotator(back.cx, CY, back.deg)([0, 0]);
  const cardBackArt = placePath(
    MARK_PIECE,
    0.34,
    backCentre[0],
    backCentre[1],
    MARK_PIECE_CENTRE[0],
    MARK_PIECE_CENTRE[1],
  );

  const card = c => [
    { d: roundedCard(c.cx, CY, c.deg, W, H, RADIUS, DROP), fill: shade(c.fill) },
    { d: roundedCard(c.cx, CY, c.deg, W, H, RADIUS), fill: c.fill },
  ];

  // Eye height is measured off the back card's top edge under the left eye.
  const topEdge = rotator(back.cx, CY, back.deg)([-W / 2, -H / 2])[1];
  const topEdgeRight = rotator(back.cx, CY, back.deg)([W / 2, -H / 2])[1];
  const eyeR = 0.198 * 300;
  const eyeX = 256 - 0.224 * 300;
  const tAt =
    (eyeX - rotator(back.cx, CY, back.deg)([-W / 2, -H / 2])[0]) /
    (rotator(back.cx, CY, back.deg)([W / 2, -H / 2])[0] -
      rotator(back.cx, CY, back.deg)([-W / 2, -H / 2])[0]);
  const topUnderEye = topEdge + tAt * (topEdgeRight - topEdge);

  return {
    eyes: eyes(256, topUnderEye + BURY * eyeR - eyeR, 300),
    shapes: [
      ...card(back),
      // The face-down card's back pattern, between the two cards so the
      // front card overlaps it exactly as it overlaps the card itself.
      { d: cardBackArt, fill: C.navy, opacity: 0.3 },
      ...card(front),
    ],
  };
}

/* ---------------------------------------------------------------- emit */

const fmt = v => JSON.stringify(v);

function emitShapes(shapes) {
  return shapes
    .map(s => {
      const opacity = s.opacity == null ? '' : `, opacity: ${s.opacity}`;
      return `    { fill: ${fmt(s.fill)}${opacity}, d: ${fmt(s.d)} },`;
    })
    .join('\n');
}

function emitEyes(list) {
  return list
    .map(
      e =>
        `    { cx: ${e.cx}, cy: ${e.cy}, r: ${e.r}, highlight: ` +
        `{ cx: ${e.highlight.cx}, cy: ${e.highlight.cy}, r: ${e.highlight.r} } },`,
    )
    .join('\n');
}

function emitMark(name, mark) {
  return (
    `export const ${name}: GameMarkGeometry = {\n` +
    `  shapes: [\n${emitShapes(mark.shapes)}\n  ],\n` +
    `  eyes: [\n${emitEyes(mark.eyes)}\n  ],\n};\n`
  );
}

const file = `// GENERATED FILE — do not edit by hand.
// Run \`node scripts/generate-game-marks.js\` to regenerate.
//
// Vector geometry for the two game marks on the picker, derived from
// resources/peekapiece-mark.svg: the eyes keep the brand mark's exact
// proportions and the jigsaw knobs are its own bezier profile mapped onto
// each seam. See docs/specs/components/gameMarkGeometry.md.
//
// Coordinates are absolute in a ${CANVAS}x${CANVAS} space with every rotation
// already baked in, so rendering needs one uniform scale and nothing else.

/** The square the coordinates below are authored in. */
export const MARK_CANVAS = ${CANVAS};

export interface MarkShape {
  /** SVG path data, accepted directly by Skia's \`<Path>\`. */
  d: string;
  fill: string;
  opacity?: number;
}

export interface MarkEye {
  cx: number;
  cy: number;
  r: number;
  /** The white catchlight, up and to the left as in the brand mark. */
  highlight: { cx: number; cy: number; r: number };
}

export interface GameMarkGeometry {
  /** Drawn in order, over the eyes — so the shapes partly hide them. */
  shapes: MarkShape[];
  eyes: MarkEye[];
}

/** Navy of the eyes, and white of their catchlights. */
export const EYE_COLOR = ${fmt(C.navy)};
export const EYE_HIGHLIGHT_COLOR = '#FFFFFF';

${emitMark('PUZZLE_MARK', puzzleMark())}
${emitMark('MEMORY_MARK', memoryMark())}`;

fs.writeFileSync(OUT, file);
console.log(`wrote ${path.relative(path.join(__dirname, '..'), OUT)}`);
