import type { Align, Extent, Placed, Span } from "./types.js";

/**
 * Lay a group of items out along one axis.
 *
 * Stacking rows of text down an image and setting a badge beside a title are
 * the same sum with the coordinates renamed, so both `stack` and
 * `row` are this function. It is the only arithmetic in the toolkit that
 * is worth getting right once.
 *
 * A group taller or wider than the space it was given starts at `span.start`
 * and runs over rather than being squeezed, since a template that has
 * overflowed wants to see it rather than have it hidden.
 */
export function distribute(
  items: readonly Extent[],
  span: Span,
  align: Align = "centre",
): readonly Placed[] {
  const advances = items.map((item) => (item.gapBefore ?? 0) + item.size);
  const total = advances.reduce((sum, advance) => sum + advance, 0);
  const spare = Math.max(0, span.end - span.start - total);

  let cursor = span.start + offset(spare, align);

  return items.map((item, index) => {
    const start = cursor + (item.gapBefore ?? 0);
    cursor += advances[index] ?? 0;
    return { start, index };
  });
}

function offset(spare: number, align: Align): number {
  if (align === "start") {
    return 0;
  }

  return align === "end" ? spare : spare / 2;
}
