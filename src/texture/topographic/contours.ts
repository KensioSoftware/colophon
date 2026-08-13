import type { Dimensions } from "../../types.js";
import { height } from "./field.js";

/** A point where a contour crosses the edge of one cell of the grid. */
interface Point {
  readonly x: number;
  readonly y: number;
}

/**
 * Where between two corners the contour crosses, by how far each of them is
 * above or below the level. Interpolating rather than taking the midpoint is
 * what makes the line smooth instead of stepped.
 */
function between(a: Point, b: Point, above: number, below: number): Point {
  const along = above / (above - below);

  return { x: a.x + (b.x - a.x) * along, y: a.y + (b.y - a.y) * along };
}

/** The corners of one cell, clockwise from the top left. */
function corners(x: number, y: number, step: number): readonly Point[] {
  return [
    { x, y },
    { x: x + step, y },
    { x: x + step, y: y + step },
    { x, y: y + step },
  ];
}

/**
 * The segments of one contour crossing one cell.
 *
 * Which edges it crosses is decided by which corners are above the level, read
 * as four bits. The two ambiguous cases, where opposite corners are above and
 * the other two below, are drawn as two separate segments: a saddle can be
 * joined either way and this is the reading that never crosses itself.
 */
function cell(
  values: readonly number[],
  points: readonly Point[],
  level: number,
): readonly (readonly [Point, Point])[] {
  const above = values.map((value) => value > level);
  const edges: Point[] = [];

  for (const [index, isAbove] of above.entries()) {
    const next = (index + 1) % 4;

    if (isAbove !== above[next]) {
      edges.push(
        between(
          points[index] as Point,
          points[next] as Point,
          (values[index] as number) - level,
          (values[next] as number) - level,
        ),
      );
    }
  }

  if (edges.length === 2) {
    return [[edges[0] as Point, edges[1] as Point]];
  }

  return edges.length === 4
    ? [
        [edges[0] as Point, edges[1] as Point],
        [edges[2] as Point, edges[3] as Point],
      ]
    : [];
}

/**
 * One contour of the landscape, as the segments where the ground passes
 * through a given height.
 *
 * This is marching squares: the field is sampled on a grid, and each cell
 * contributes the piece of the line that crosses it. Drawing the segments
 * separately rather than joining them into loops costs a little more markup
 * and saves the bookkeeping of walking a contour from cell to cell, which
 * would not change the picture.
 */
export function contourAt(
  level: number,
  step: number,
  dimensions: Dimensions,
  seed: number,
  relief: number,
): string {
  let path = "";

  for (let y = -step; y < dimensions.height + step; y += step) {
    for (let x = -step; x < dimensions.width + step; x += step) {
      const points = corners(x, y, step);
      const values = points.map(
        (point) => height(point.x, point.y, seed) * relief,
      );

      for (const [from, to] of cell(values, points, level)) {
        path +=
          `M${String(Math.round(from.x))} ${String(Math.round(from.y))}` +
          `L${String(Math.round(to.x))} ${String(Math.round(to.y))}`;
      }
    }
  }

  return path;
}
