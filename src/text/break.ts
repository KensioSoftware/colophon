import type { MeasureLine } from "./wrap.js";

/**
 * Grapheme segmentation, so a break never lands inside an emoji or between a
 * letter and the accent that belongs to it. Built once, since a build breaks
 * a great many words and the segmenter carries locale data with it.
 */
const graphemes = new Intl.Segmenter(undefined, { granularity: "grapheme" });

/**
 * Break one word across as many lines as it takes, for a word that is wider
 * than the line it has to fit on. A URL, a compound German noun, or a whole
 * Japanese sentence, which has no spaces to break at in the first place.
 *
 * Always returns at least one piece, even where a single character is wider
 * than the line: overflowing by one glyph beats looping forever.
 */
export function breakWord(
  word: string,
  maxWidth: number,
  measure: MeasureLine,
): string[] {
  const pieces: string[] = [];
  let current = "";

  for (const { segment } of graphemes.segment(word)) {
    const next = current + segment;

    if (current !== "" && measure(next) > maxWidth) {
      pieces.push(current);
      current = segment;
    } else {
      current = next;
    }
  }

  return current === "" ? [word] : [...pieces, current];
}
