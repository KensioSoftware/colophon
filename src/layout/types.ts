/**
 * A rectangle in image coordinates, which is what every primitive here takes
 * and returns. Templates are handed the image's `dimensions` and work down
 * from there, so a rectangle is the one shape they all have in common.
 */
export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * A stretch of one axis: top and bottom for a stack, left and right for a row.
 * `start` is the smaller coordinate, so it is the top or the left edge.
 */
export interface Span {
  readonly start: number;
  readonly end: number;
}

/**
 * Where a group of items sits within the space it was given. `centre` is the
 * default everywhere, because a share image is looked at rather than read down,
 * and the middle is where the eye goes.
 */
export type Align = "start" | "centre" | "end";

/**
 * How much of an axis one item takes, and how much clear space goes before it.
 * A gap on the first item is space at the head of the group.
 */
export interface Extent {
  readonly size: number;
  readonly gapBefore?: number;
}

/** Where an item ended up: its start coordinate along the axis. */
export interface Placed {
  readonly start: number;
  readonly index: number;
}

/** Fill, corners and stroke for a rectangle. Every field is optional. */
export interface BoxStyle {
  readonly fill?: string;
  readonly fillOpacity?: number;
  /** Corner radius. Omit for square corners. */
  readonly radius?: number;
  readonly stroke?: string;
  readonly strokeOpacity?: number;
  readonly strokeWidth?: number;
}
