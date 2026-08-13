/**
 * Tracking: the space added between the characters of a line, so that a line
 * set small can be stretched to the width of a line set large above it.
 *
 * It is what a typesetter does by hand to make a wordmark and the strapline
 * under it share an edge on both sides. The alternative is choosing a font
 * size that happens to come out the right width, which lasts until the words
 * change.
 *
 * The arithmetic is exact rather than approximate because of how the renderer
 * applies it. SVG's `letter-spacing` goes between characters and not after the
 * last one, checked by rendering rather than read from a specification: four
 * characters at a spacing of 20 come out exactly 60 wider, and an end-anchored
 * run keeps its right edge. So a line of `n` characters has `n - 1` gaps, the
 * width lands on the target, and `middle` and `end` anchors stay where they
 * were put.
 */

/** The gaps a line of text has between its characters. */
function gaps(text: string): number {
  // Code points rather than UTF-16 units, so an emoji or an astral character
  // counts once and the spacing does not come out short.
  return Array.from(text).length - 1;
}

/**
 * The spacing that takes a line from the width it has to the width it wants,
 * or nothing at all where it cannot get there.
 *
 * Two cases give nothing back. A line already at or past the target would need
 * negative tracking, and letters pulled together read as a mistake where
 * letters pushed apart read as a decision. A line of one character has no gaps
 * to put the space in.
 */
export function trackingFor(
  text: string,
  naturalWidth: number,
  targetWidth: number,
): number {
  const count = gaps(text);

  if (count < 1 || targetWidth <= naturalWidth) {
    return 0;
  }

  return (targetWidth - naturalWidth) / count;
}

/** The width a line takes once its tracking is applied. */
export function trackedWidth(
  text: string,
  naturalWidth: number,
  tracking: number,
): number {
  return naturalWidth + Math.max(0, gaps(text)) * tracking;
}
