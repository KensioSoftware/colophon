import type { TextLine } from "./block.js";
import type { Extent } from "./types.js";

/** Vertical advance of a line, as a multiple of its font size. */
export const defaultLineHeight = 1.2;

/**
 * The room each line of a block takes down the page, which is what both
 * placing it and measuring it are made of.
 */
export function lineExtents(
  lines: readonly TextLine[],
  lineHeight: number = defaultLineHeight,
): readonly Extent[] {
  return lines.map((line) => ({
    size: line.fontSize * lineHeight,
    ...(line.gapBefore !== undefined && { gapBefore: line.gapBefore }),
  }));
}

/**
 * How tall a block of lines is once stacked.
 *
 * A template that puts a block of text in a group with something else, a logo
 * above a name or a quotation above who said it, has to know how much room the
 * words want before it can place either. `drawLines` is handed an area and
 * finds the middle of it, which is the other way round and no use here.
 */
export function linesHeight(
  lines: readonly TextLine[],
  lineHeight: number = defaultLineHeight,
): number {
  return lineExtents(lines, lineHeight).reduce(
    (total, extent) => total + extent.size + (extent.gapBefore ?? 0),
    0,
  );
}
