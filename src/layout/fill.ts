import { optionalString } from "../props.js";
import type { FittedText } from "../text/index.js";
import { fillText } from "../text/index.js";
import type { MeasureText } from "../types.js";
import type { TextLine } from "./block.js";
import { measureIn } from "./measure.js";

/** One group of a template's text, and the box it has to fill. */
export interface FilledBlock {
  readonly maxWidth: number;
  readonly maxHeight: number;
  /** The advance used both to fit the lines and to draw them, so they agree. */
  readonly lineHeight: number;
  /** The largest size to try, which short text ends up drawn at. */
  readonly maxFontSize: number;
  /** The size below which the text is cut rather than shrunk any further. */
  readonly minFontSize: number;
  readonly fontWeight: number;
  readonly opacity: number;
  /** Space inserted before the group's first line, to separate it from the last. */
  readonly gapBefore?: number;
}

/**
 * Fit one group of a template's text to a box, and return its lines.
 *
 * The sibling of `blockLines`, for the layouts where the text is the picture
 * rather than a heading in it. Both take a prop that may not be there and give
 * back nothing at all when it is missing; what differs is what decides the
 * size. See {@link fillText} for which of the two a layout wants.
 *
 * `lineHeight` is here rather than left to `drawLines` because the fitting has
 * to know it: how tall a block of lines is is what the search is measuring
 * against. Pass the same value to both, or the block that was fitted is not
 * the block that gets drawn.
 */
export function fillLines(
  value: unknown,
  measure: MeasureText,
  fontFamily: string,
  block: FilledBlock,
): TextLine[] {
  const fitted: FittedText = fillText(
    optionalString(value) ?? "",
    measureIn(measure, fontFamily, block.fontWeight),
    {
      maxWidth: block.maxWidth,
      maxHeight: block.maxHeight,
      lineHeight: block.lineHeight,
      maxFontSize: block.maxFontSize,
      minFontSize: block.minFontSize,
    },
  );

  return fitted.lines.map((text, index) => ({
    text,
    fontSize: fitted.fontSize,
    fontWeight: block.fontWeight,
    opacity: block.opacity,
    ...(index === 0 &&
      block.gapBefore !== undefined && { gapBefore: block.gapBefore }),
  }));
}
