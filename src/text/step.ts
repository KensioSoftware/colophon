/** How much of the size is given up each time the text does not fit. */
const shrinkRatio = 0.94;

/**
 * The next size down to try, for a search that is shrinking text into a space.
 *
 * Both terms are here to guarantee progress: the proportional step is what
 * makes the search short, and the whole pixel is what stops it stalling once
 * the sizes are small enough for rounding to swallow the step.
 *
 * It is shared by the two searches rather than written out in each, since a
 * step that differed between them would mean two layouts settling on different
 * sizes for the same words with no reason a reader could name.
 */
export function nextSize(fontSize: number, minFontSize: number): number {
  return Math.max(
    minFontSize,
    Math.min(fontSize - 1, Math.floor(fontSize * shrinkRatio)),
  );
}
