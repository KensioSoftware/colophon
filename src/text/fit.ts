import { nextSize } from "./step.js";
import { wrapText } from "./wrap.js";

/** The width a run of text would be drawn at, at a given font size. */
export type MeasureAt = (text: string, fontSize: number) => number;

/** The space a block of text has, and the sizes it may be drawn at. */
export interface FitOptions {
  readonly maxWidth: number;
  readonly maxLines: number;
  /** The size to draw at when the text fits at it. */
  readonly fontSize: number;
  /** The size below which shrinking costs more legibility than it is worth. */
  readonly minFontSize: number;
}

/** A block of text with the size it turned out to fit at. */
export interface FittedText {
  readonly lines: readonly string[];
  readonly fontSize: number;
}

/**
 * Wrap text into the space it has, shrinking it until it fits.
 *
 * The alternative, and what Colophon did before it could measure anything, is
 * to wrap at one size and drop whatever is left over. That reads as a mistake
 * rather than a design: a long title loses its last few words, and the image
 * says something the post does not. Shrinking keeps the words.
 *
 * It only shrinks so far, because a title small enough to fit anything is a
 * title nobody reads in a feed. Text that still does not fit at the floor is
 * cut to `maxLines` as before.
 */
export function fitText(
  text: string,
  measure: MeasureAt,
  options: FitOptions,
): FittedText {
  const { maxWidth, maxLines, minFontSize } = options;
  let fontSize = options.fontSize;
  let lines = wrapText(text, maxWidth, (line) => measure(line, fontSize));

  while (lines.length > maxLines && fontSize > minFontSize) {
    fontSize = nextSize(fontSize, minFontSize);
    lines = wrapText(text, maxWidth, (line) => measure(line, fontSize));
  }

  return { lines: lines.slice(0, maxLines), fontSize };
}
