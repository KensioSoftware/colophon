import type { TextLine } from "../../layout/index.js";
import { blockLines, linesHeight } from "../../layout/index.js";
import type { Dimensions, MeasureText } from "../../types.js";
import { imageMargin } from "./panel.js";

/**
 * How many lines the title may wrap to before it is shrunk instead.
 *
 * Two rather than the three a `card` or a `docs` title gets, because every line
 * here comes off the panel below it. The snippet is the point of the image, and
 * a title taking a third of the height would be a caption running the layout.
 */
const maxTitleLines = 2;

/** How far it may shrink before it is cut, as the other titles do. */
const titleFloor = 0.62;

/**
 * The leading between wrapped title lines, as a fraction of their size.
 *
 * It is carried as a gap between the lines rather than as a line height so that
 * one line takes exactly its own font size, which is the room this layout has
 * always set aside for a title. A line height would space a wrapped block the
 * same way but would also make a single line taller than the size it is drawn
 * at, moving every existing image with a short title on it.
 */
const titleLeading = 0.2;

/**
 * So the lines are stacked at their own size, the leading being in the gaps
 * already. Measuring the block and placing it both go through this, or the room
 * reserved and the room drawn in would be different heights.
 */
export const titleLineHeight = 1;

/** The space the title has, and how to measure text into it. */
export interface CodeTitleText {
  readonly measure: MeasureText;
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly dimensions: Dimensions;
}

/**
 * The title, wrapped and shrunk into the width the panel has.
 *
 * A title absent from the props produces no lines at all, which is what the
 * layout reads as having no title to make room for.
 */
export function codeTitleLines(
  title: unknown,
  text: CodeTitleText,
): TextLine[] {
  const lines = blockLines(title, text.measure, text.fontFamily, {
    maxWidth: text.dimensions.width - imageMargin(text.dimensions) * 2,
    maxLines: maxTitleLines,
    fontSize: text.fontSize,
    floor: titleFloor,
    fontWeight: 700,
    opacity: 0.95,
  });

  return lines.map((line, index) =>
    index === 0
      ? line
      : { ...line, gapBefore: Math.round(line.fontSize * titleLeading) },
  );
}

/**
 * The room the title's lines take, which is what the panel gives up for them.
 *
 * The space reserved above the panel and the band the lines are then drawn in
 * both come from here, so a title that wrapped to two lines is placed in the
 * room two lines were taken out of.
 */
export function titleRoom(lines: readonly TextLine[]): number {
  return linesHeight(lines, titleLineHeight);
}
