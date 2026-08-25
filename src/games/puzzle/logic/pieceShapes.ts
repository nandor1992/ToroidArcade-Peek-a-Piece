export type EdgeType = 'flat' | 'tab' | 'blank';

export interface PieceEdges {
  top: EdgeType;
  right: EdgeType;
  bottom: EdgeType;
  left: EdgeType;
}

export type PathCommand =
  | { op: 'moveTo'; x: number; y: number }
  | { op: 'lineTo'; x: number; y: number }
  | {
      op: 'cubicTo';
      c1x: number;
      c1y: number;
      c2x: number;
      c2y: number;
      x: number;
      y: number;
    }
  | { op: 'close' };

// How far a tab/blank bulges out of (or dents into) the piece, and how
// wide its rounded top is — both as a fraction of the edge's own length,
// so tabs scale with piece size instead of looking tiny on large pieces or
// overlapping on small ones.
const BUMP_DEPTH_RATIO = 0.28;
const BUMP_HALF_WIDTH_RATIO = 0.14;

/**
 * Appends one side of a piece's outline, from the pen's current position
 * (x0, y0) to (x1, y1). A flat edge is just a line — used on the outer
 * border of the whole image, where there's no neighboring piece to
 * interlock with. A tab/blank is a single rounded knob: two mirrored
 * cubic curves for the shoulders, joined by a flat-ish plateau at the
 * peak, deliberately simpler than a classic double-curve "mushroom" tab
 * (see docs/specs/games/puzzle/logic/pieceShapes.md for why).
 */
function addEdge(
  commands: PathCommand[],
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  type: EdgeType,
): void {
  if (type === 'flat') {
    commands.push({ op: 'lineTo', x: x1, y: y1 });
    return;
  }

  const dx = x1 - x0;
  const dy = y1 - y0;
  const length = Math.hypot(dx, dy);
  const ux = dx / length;
  const uy = dy / length;
  // Rotating the edge's direction 90° clockwise gives the outward normal
  // for any side of a clockwise-traced rectangle boundary — no need to
  // special-case top/right/bottom/left separately.
  const nx = uy;
  const ny = -ux;
  const sign = type === 'tab' ? 1 : -1;
  const depth = length * BUMP_DEPTH_RATIO * sign;
  const halfWidth = length * BUMP_HALF_WIDTH_RATIO;
  const center = length / 2;

  const point = (t: number, offset: number) => ({
    x: x0 + ux * t + nx * offset,
    y: y0 + uy * t + ny * offset,
  });

  // Shoulders sit on the edge itself (offset 0); the peaks are inset from
  // them and pulled out to full depth, joined by a flat plateau so the
  // bump reads as a rounded knob rather than a sharp spike.
  const shoulderL = point(center - halfWidth, 0);
  const peakL = point(center - halfWidth * 0.5, depth);
  const peakR = point(center + halfWidth * 0.5, depth);
  const shoulderR = point(center + halfWidth, 0);
  const riseControl1 = point(center - halfWidth, depth);
  const riseControl2 = point(center - halfWidth * 0.7, depth);
  const fallControl1 = point(center + halfWidth * 0.7, depth);
  const fallControl2 = point(center + halfWidth, depth);

  commands.push({ op: 'lineTo', x: shoulderL.x, y: shoulderL.y });
  commands.push({
    op: 'cubicTo',
    c1x: riseControl1.x,
    c1y: riseControl1.y,
    c2x: riseControl2.x,
    c2y: riseControl2.y,
    x: peakL.x,
    y: peakL.y,
  });
  commands.push({ op: 'lineTo', x: peakR.x, y: peakR.y });
  commands.push({
    op: 'cubicTo',
    c1x: fallControl1.x,
    c1y: fallControl1.y,
    c2x: fallControl2.x,
    c2y: fallControl2.y,
    x: shoulderR.x,
    y: shoulderR.y,
  });
  commands.push({ op: 'lineTo', x: x1, y: y1 });
}

/**
 * Builds one piece's outline in the piece's own local coordinate space —
 * (0, 0) is the piece's top-left corner regardless of where it ends up on
 * the board, so the same path can be reused for both the piece's cutout
 * (drawn against the full board image) and its hit-testing bounds.
 */
export function buildPiecePath(
  width: number,
  height: number,
  edges: PieceEdges,
): PathCommand[] {
  const commands: PathCommand[] = [{ op: 'moveTo', x: 0, y: 0 }];
  addEdge(commands, 0, 0, width, 0, edges.top);
  addEdge(commands, width, 0, width, height, edges.right);
  addEdge(commands, width, height, 0, height, edges.bottom);
  addEdge(commands, 0, height, 0, 0, edges.left);
  commands.push({ op: 'close' });
  return commands;
}
