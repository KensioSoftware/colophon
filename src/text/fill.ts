import type { FittedText, MeasureAt } from "./fit.js";
import { nextSize } from "./step.js";
import { largestUnbroken } from "./unbroken.js";
import { wrapText } from "./wrap.js";

/** The box a block of text has to fill, and the sizes it may be drawn at. */
export interface FillOptions {
  readonly maxWidth: number;
  readonly maxHeight: number;
  /** Each line's advance down the box, as a multiple of its font size. */
  readonly lineHeight: number;
  /** A ceiling on the size, however much room the box turns out to have. */
  readonly maxFontSize: number;
  /** The size below which the text is cut rather than shrunk any further. */
  readonly minFontSize: number;
}

/**
 * How many whole lines fit in the box at a given size, and never fewer than one.
 *
 * A box too short for a single line gets that line anyway, running over rather
 * than being left empty. That is the rule `distribute` follows for a group that
 * overflows: a template which has asked for the impossible wants to see it.
 */
function linesInBox(maxHeight: number, advance: number): number {
  return Math.max(1, Math.floor(maxHeight / advance));
}

/**
 * The size the search starts from, which is the largest one worth trying: no
 * taller than a single line of the box, no larger than the caller's ceiling,
 * and small enough that no word has to be broken to fit the width.
 */
function startingSize(
  text: string,
  measure: MeasureAt,
  options: FillOptions,
): number {
  const ceiling = Math.min(
    options.maxFontSize,
    Math.floor(options.maxHeight / options.lineHeight),
  );

  return Math.max(
    options.minFontSize,
    largestUnbroken(text, measure, options.maxWidth, ceiling),
  );
}

/**
 * Wrap text into a box, at the largest size the whole of it fits at.
 *
 * This is {@link fitText} with the question turned round. `fitText` is given a
 * size and shrinks only when the words need more lines than the layout allows,
 * so a short title is drawn at whatever size the template named and no larger.
 * That is right where the text sits in a group with other things, since a
 * heading that grew to fill the space would stop looking like a heading.
 *
 * It is wrong where the text is the picture. A YouTube thumbnail is looked at
 * in a fraction of the space it was rendered at, so its words have to take the
 * room they are given rather than sit in the middle of it, and how much room
 * that is depends on how many words there are: three of them should be drawn
 * much larger than twelve. So the search comes down from the largest size the
 * box could hold until the wrapped block fits both the width and the height.
 *
 * Text that will not fit even at the floor is cut to the lines there is room
 * for, which is what `fitText` does at its own floor and for the same reason:
 * below a certain size the image has stopped saying anything anybody can read.
 */
export function fillText(
  text: string,
  measure: MeasureAt,
  options: FillOptions,
): FittedText {
  const { maxWidth, maxHeight, lineHeight, minFontSize } = options;
  let fontSize = startingSize(text, measure, options);
  let lines = wrapText(text, maxWidth, (line) => measure(line, fontSize));

  while (
    lines.length * fontSize * lineHeight > maxHeight &&
    fontSize > minFontSize
  ) {
    fontSize = nextSize(fontSize, minFontSize);
    lines = wrapText(text, maxWidth, (line) => measure(line, fontSize));
  }

  return {
    lines: lines.slice(0, linesInBox(maxHeight, fontSize * lineHeight)),
    fontSize,
  };
}
