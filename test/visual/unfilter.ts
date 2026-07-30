/**
 * PNG row filters, reversed. Every scanline in the image data carries a filter
 * byte naming how it was encoded against its left and upper neighbours, so a
 * decoder has to undo all five to get back to pixels.
 *
 * Spec: https://www.w3.org/TR/png-3/#9Filter-types
 */

/** Bytes per pixel in the one colour type these images use: 8-bit RGBA. */
const bytesPerPixel = 4;

/**
 * Read a byte, treating anything off the left edge or above the first row as
 * zero, which is what the spec says a filter does at the boundary. It also
 * settles `noUncheckedIndexedAccess`, which has every index return
 * `number | undefined`.
 */
function byte(row: Uint8Array | undefined, index: number): number {
  return row === undefined || index < 0 ? 0 : (row[index] ?? 0);
}

/**
 * The Paeth predictor: whichever of left, above and upper-left is closest to
 * their linear estimate. Written out rather than expressed with `Math.min`,
 * because the spec's tie-breaking order is part of the definition.
 */
function paeth(left: number, above: number, upperLeft: number): number {
  const estimate = left + above - upperLeft;
  const toLeft = Math.abs(estimate - left);
  const toAbove = Math.abs(estimate - above);
  const toUpperLeft = Math.abs(estimate - upperLeft);

  if (toLeft <= toAbove && toLeft <= toUpperLeft) {
    return left;
  }

  return toAbove <= toUpperLeft ? above : upperLeft;
}

/** The predicted value a filter type subtracted when the row was encoded. */
function predict(
  filter: number,
  left: number,
  above: number,
  upperLeft: number,
): number {
  switch (filter) {
    case 0: {
      return 0;
    }
    case 1: {
      return left;
    }
    case 2: {
      return above;
    }
    case 3: {
      return (left + above) >> 1;
    }
    case 4: {
      return paeth(left, above, upperLeft);
    }
    default: {
      throw new Error(`Unsupported PNG row filter ${String(filter)}.`);
    }
  }
}

/**
 * Undo one row's filter in place. `previous` is the already-unfiltered row
 * above, or `undefined` for the first row.
 */
export function unfilterRow(
  filter: number,
  row: Uint8Array,
  previous: Uint8Array | undefined,
): void {
  for (let index = 0; index < row.length; index++) {
    const predicted = predict(
      filter,
      byte(row, index - bytesPerPixel),
      byte(previous, index),
      byte(previous, index - bytesPerPixel),
    );

    row[index] = (byte(row, index) + predicted) & 0xff;
  }
}
