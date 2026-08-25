import type { PathCommand } from './pieceShapes';

/**
 * Serializes a piece outline to an SVG path `d` string. Skia's `Group`
 * `clip` prop accepts a path string directly, so this is what actually
 * cuts each piece's shape out of the board image — see
 * docs/specs/games/puzzle/components/PuzzleBoard.md.
 */
export function pathCommandsToSvgPath(commands: PathCommand[]): string {
  return commands
    .map(command => {
      switch (command.op) {
        case 'moveTo':
          return `M ${command.x} ${command.y}`;
        case 'lineTo':
          return `L ${command.x} ${command.y}`;
        case 'cubicTo':
          return `C ${command.c1x} ${command.c1y}, ${command.c2x} ${command.c2y}, ${command.x} ${command.y}`;
        case 'close':
          return 'Z';
      }
    })
    .join(' ');
}
