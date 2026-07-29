import { textElement } from "../text/index.js";
import type { TextLine } from "./block.js";
import { distribute } from "./distribute.js";
import type { Align, Rect } from "./types.js";

/** Vertical advance of a line, as a multiple of its font size. */
const defaultLineHeight = 1.2;

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

/** How a block of lines is drawn: the font, the fill, and where it sits. */
export interface LinesStyle {
  readonly fontFamily: string;
  readonly fill: string;
  /** Multiplier on each line's font size. Defaults to `1.2`. */
  readonly lineHeight?: number;
  /** Horizontal anchor. `middle` centres each line in the area. */
  readonly anchor?: "start" | "middle" | "end";
  /** Where the block sits vertically in the area. Defaults to `centre`. */
  readonly align?: Align;
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
    lines.map((line) => ({
      size: line.fontSize * lineHeight,
      ...(line.gapBefore !== undefined && { gapBefore: line.gapBefore }),
    })),
    { start: area.y, end: area.y + area.height },
    align,
  );

  return placed.map((placement, index) => ({
    y: baselineFor(placement.start, lines[index]?.fontSize ?? 0),
    index,
  }));
}

/** The x a line is drawn from, which the anchor decides. */
function anchorX(area: Rect, anchor: LinesStyle["anchor"]): number {
  if (anchor === "middle") {
    return Math.round(area.x + area.width / 2);
  }

  return anchor === "end" ? area.x + area.width : area.x;
}

/**
 * Draw a block of lines within an area: place them, then write the `<text>`
 * elements. Once a template has fitted its words, this is the whole of what it
 * does with them.
 */
export function drawLines(
  lines: readonly TextLine[],
  area: Rect,
  style: LinesStyle,
): string {
  const placed = placeLines(
    lines,
    area,
    style.lineHeight ?? defaultLineHeight,
    style.align ?? "centre",
  );
  const x = anchorX(area, style.anchor);

  return lines
    .map((line, index) =>
      textElement(line.text, {
        x,
        y: placed[index]?.y ?? area.y,
        fontFamily: style.fontFamily,
        fontSize: line.fontSize,
        fontWeight: line.fontWeight,
        fill: style.fill,
        fillOpacity: line.opacity,
        ...(style.anchor !== undefined && { anchor: style.anchor }),
      }),
    )
    .join("");
}
