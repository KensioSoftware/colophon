import { distribute } from "./distribute.js";
import type { Align, Extent, Rect } from "./types.js";

/** A stacked item's rectangle, and which item it belongs to. */
export interface StackedRect extends Rect {
  readonly index: number;
}

/**
 * Stack items down an area and give each one its rectangle.
 *
 * Each keeps the full width of the area, because the vertical placement is the
 * only decision being made here. An item that wants less width draws itself
 * narrower, or puts a `row` inside the rectangle it was given.
 */
export function stack(
  items: readonly Extent[],
  area: Rect,
  align: Align = "centre",
): readonly StackedRect[] {
  const placed = distribute(
    items,
    { start: area.y, end: area.y + area.height },
    align,
  );

  return placed.map((placement, index) => ({
    x: area.x,
    y: placement.start,
    width: area.width,
    height: items[index]?.size ?? 0,
    index: placement.index,
  }));
}
