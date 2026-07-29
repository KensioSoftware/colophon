import { breakWord } from "./break.js";

/**
 * The width a run of text will be drawn at, in the same units as the space it
 * has to fit. Bound to a font and a size by whoever is doing the wrapping.
 */
export type MeasureLine = (text: string) => number;

/**
 * Greedy word-wrap to a width rather than to a character count.
 *
 * Wrapping by characters means assuming every glyph is the same fraction of
 * the font size, which is wrong by a little for Latin text and wrong by half
 * for anything wider. Measuring the words is what puts the break where it
 * belongs.
 *
 * A single word too wide for the line is broken, since the alternative is a
 * line that runs off the image. Text written without spaces, which is most of
 * how Japanese and Chinese are set, is one long word by this reckoning and so
 * breaks at whatever character reaches the edge. That is a plain wrap rather
 * than a correct one: it does not know that a line should not begin with
 * closing punctuation.
 */
export function wrapText(
  text: string,
  maxWidth: number,
  measure: MeasureLine,
): string[] {
  const words = text.split(/\s+/).filter((word) => word !== "");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine === "" ? word : `${currentLine} ${word}`;

    if (measure(nextLine) <= maxWidth) {
      currentLine = nextLine;
      continue;
    }

    if (currentLine !== "") {
      lines.push(currentLine);
    }

    // The word starts a line of its own, and is only broken up if it cannot
    // fit on one even there.
    const pieces = breakWord(word, maxWidth, measure);
    lines.push(...pieces.slice(0, -1));
    currentLine = pieces.at(-1) ?? "";
  }

  if (currentLine !== "") {
    lines.push(currentLine);
  }

  return lines;
}
