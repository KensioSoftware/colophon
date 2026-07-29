import type { FittedText } from "../text/index.js";
import { fitText } from "../text/index.js";
import type { MeasureText } from "../types.js";
import { measureIn } from "./measure.js";
import { optionalString } from "./props.js";

/** One group of a template's text: the space it has and how it is drawn. */
export interface TextBlock {
  readonly maxWidth: number;
  readonly maxLines: number;
  readonly fontSize: number;
  /**
   * Fraction of `fontSize` this group may shrink to before it is cut instead.
   * The title of a layout has the furthest to fall, because it is the line
   * worth keeping whole; a subtitle that has shrunk much has stopped being
   * readable in a feed, so it may as well lose its tail.
   */
  readonly floor: number;
  readonly fontWeight: number;
}

/** A block along with how the lines it produces are drawn. */
export interface StyledBlock extends TextBlock {
  readonly opacity: number;
  /** Space inserted before the group's first line, to separate it from the last. */
  readonly gapBefore?: number;
}

/** One line of a template's text block, ready to be stacked and drawn. */
export interface TextLine {
  readonly text: string;
  readonly fontSize: number;
  readonly fontWeight: number;
  readonly opacity: number;
  readonly gapBefore?: number;
}

/**
 * Fit one group of a template's text, from a prop that may not be there, and
 * return its lines. Each group is fitted on its own, so a long title shrinking
 * does not drag the subtitle down with it. A group whose prop is absent or
 * empty produces no lines at all.
 */
export function blockLines(
  value: unknown,
  measure: MeasureText,
  fontFamily: string,
  block: StyledBlock,
): TextLine[] {
  const fitted: FittedText = fitText(
    optionalString(value) ?? "",
    measureIn(measure, fontFamily, block.fontWeight),
    {
      maxWidth: block.maxWidth,
      maxLines: block.maxLines,
      fontSize: block.fontSize,
      minFontSize: Math.round(block.fontSize * block.floor),
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
