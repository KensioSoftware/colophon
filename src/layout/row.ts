import { distribute } from "./distribute.js";
import type { Align, Extent, Rect } from "./types.js";

/** A placed item's rectangle, and which item it belongs to. */
export interface RowRect extends Rect {
  readonly index: number;
}

/**
 * Set items across an area and give each one its rectangle: an avatar beside a
 * name, a badge beside a title, a row of tags along the bottom.
 *
 * Each keeps the full height of the area, so an item shorter than the row
 * centres itself within the rectangle it was given rather than being told
 * where to sit.
 */
export function row(
  items: readonly Extent[],
  area: Rect,
  align: Align = "centre",
): readonly RowRect[] {
  const placed = distribute(
    items,
    { start: area.x, end: area.x + area.width },
    align,
  );

  return placed.map((placement, index) => ({
    x: placement.start,
    y: area.y,
    width: items[index]?.size ?? 0,
    height: area.height,
    index: placement.index,
  }));
}
