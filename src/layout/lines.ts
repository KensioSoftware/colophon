import type { TextLine } from "./block.js";
import { distribute } from "./distribute.js";
import { defaultLineHeight, lineExtents } from "./extent.js";
import type { Align, Rect } from "./types.js";

/**
 * Where the baseline sits within a line's advance. A face puts its ascenders
 * around here, and taking it as a fraction of the size rather than as a metric
 * read from the font means a line lands in the same place whichever font the
 * image is eventually drawn in.
 */
const baselineRatio = 0.8;

/**
 * The baseline of one line of text sitting in a band of its own font size.
 *
 * A template that has set room aside for a single line, rather than stacking
 * several, wants this rather than a fraction of the font size chosen by eye:
 * the ink then lands inside the band that was written down, so the clear space
 * either side of it is the space that was reserved. The descender takes the
 * rest of the band, which is why the room below a line is not the same as the
 * room above it.
 */
export function baselineFor(top: number, fontSize: number): number {
  return Math.round(top + fontSize * baselineRatio);
}

/** A line with its computed text baseline. */
export interface PlacedLine {
  readonly y: number;
  readonly index: number;
}

/**
 * Place a block of lines within an area and return each baseline.
 *
 * The lines are placed as one block rather than each finding its own middle,
 * which is what keeps a wrapped title reading as a paragraph. A block taller
 * than its area starts at the top and runs over, since a template that has
 * overflowed wants to see it.
 */
export function placeLines(
  lines: readonly TextLine[],
  area: Rect,
  lineHeight = defaultLineHeight,
  align: Align = "centre",
): readonly PlacedLine[] {
  const placed = distribute(
    lineExtents(lines, lineHeight),
    { start: area.y, end: area.y + area.height },
    align,
  );

  return placed.map((placement, index) => ({
    y: baselineFor(placement.start, lines[index]?.fontSize ?? 0),
    index,
  }));
}
