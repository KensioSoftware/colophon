/**
 * A single line to place in a vertical stack.
 */
export interface StackLine {
  readonly fontSize: number;
  /** Multiplier applied to `fontSize` for this line's total advance. */
  readonly lineHeight?: number;
  /** Extra space, in pixels, inserted before this line. Defaults to `0`. */
  readonly gapBefore?: number;
}

/**
 * A stack line with its computed text baseline `y` coordinate.
 */
export interface PlacedLine {
  readonly y: number;
  readonly index: number;
}

/**
 * Vertically centre a stack of lines within `[top, bottom]` and return the
 * text baseline for each. The block is centred as a whole; if it is taller
 * than the available area it simply starts at `top`.
 */
export function layoutStack(
  lines: readonly StackLine[],
  top: number,
  bottom: number,
): PlacedLine[] {
  const advances = lines.map(
    (line) => (line.gapBefore ?? 0) + line.fontSize * (line.lineHeight ?? 1.2),
  );
  const total = advances.reduce((sum, advance) => sum + advance, 0);

  let cursor = top + Math.max(0, (bottom - top - total) / 2);

  return lines.map((line, index) => {
    // Approximate the ascent as 80% of the font size to sit the baseline
    // sensibly within each line's advance box, after any leading gap.
    const baseline = cursor + (line.gapBefore ?? 0) + line.fontSize * 0.8;
    cursor += advances[index] ?? 0;
    return { y: Math.round(baseline), index };
  });
}
