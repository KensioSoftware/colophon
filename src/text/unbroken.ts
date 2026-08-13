import type { MeasureAt } from "./fit.js";

/**
 * The largest size, no more than `ceiling`, at which every word fits on a line
 * of its own.
 *
 * Text that is being grown to fill a box is the one case where wrapping is
 * under pressure to break a word in half. `wrapText` breaks a word too wide for
 * its line, which is the right answer when the size is settled and the
 * alternative is a line running off the image, and the wrong one here: two
 * lines of a broken word are shorter than one whole one, so a search measuring
 * only the height it filled would happily settle on `Frontmatte` above `r`.
 *
 * So the search starts below the size where any breaking happens. A word that
 * cannot fit even at the floor is broken as it always was, since by then there
 * is nothing else to be done with it.
 *
 * Measuring at the ceiling and scaling is exact rather than a guess: widths are
 * held per em and multiplied by the size, and the estimate used for a font the
 * build cannot read is linear in the size too.
 */
export function largestUnbroken(
  text: string,
  measure: MeasureAt,
  maxWidth: number,
  ceiling: number,
): number {
  const words = text.split(/\s+/).filter((word) => word !== "");

  return words.reduce((size, word) => {
    const width = measure(word, ceiling);

    return width <= maxWidth
      ? size
      : Math.min(size, Math.floor((ceiling * maxWidth) / width));
  }, ceiling);
}
