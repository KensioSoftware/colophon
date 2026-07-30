/**
 * A perceptual signature of an image, and the comparison of two of them.
 *
 * The image is reduced to a fixed grid of average colour, one mean per channel
 * per cell, and two images are compared cell by cell. That is the same idea as
 * an average hash, without the last step of collapsing it to a bit string: 64
 * bits would not notice a footer changing, and noticing that is the whole
 * point of the check. Keeping the means also gives a failure something to say
 * beyond "different", which is what a threshold needs to be arguable.
 *
 * What the reduction buys is tolerance of the rasteriser: a cell averages
 * dozens of pixels, so a glyph edge landing a fraction of a pixel over barely
 * moves it, while anything a reviewer would call a change to the design moves
 * it by a lot.
 */
import type { Bitmap } from "./png.js";

/**
 * Cells per axis, square regardless of the image's proportions, since both
 * images being compared have the same ones and the cells correspond either way.
 *
 * The count is what sets how small a change registers, and it was measured
 * rather than guessed. At 24 a footer nudged three pixels at document scale
 * moved the worst cell of only two samples past the threshold, because a cell
 * that size averages away text as small as a footer. At 48 the same nudge moves
 * seventeen of them, and a one-pixel nudge still moves fourteen.
 */
const cells = 48;

/** The three channels a signature holds, composited over white. */
const channels = 3;

/** Mean colour per cell: `cells * cells * channels` values, in 0..255. */
export type Signature = Float64Array;

/** How far apart two signatures are, per cell and channel, in 0..255. */
export interface Difference {
  /** The worst single cell, which is what a threshold is set against. */
  readonly max: number;
  /** The mean across every cell, which says how widespread the change is. */
  readonly mean: number;
}

/**
 * Reduce an image to its signature.
 *
 * Colour is composited over white rather than kept with its alpha, because
 * what is being compared is the image as somebody looks at it. A template that
 * stopped covering the background would show up as the white coming through.
 */
export function signature(bitmap: Bitmap): Signature {
  const totals = new Float64Array(cells * cells * channels);
  const counts = new Float64Array(cells * cells);
  const { width, height, pixels } = bitmap;

  for (let y = 0; y < height; y++) {
    const row = Math.min(cells - 1, Math.floor((y * cells) / height));

    for (let x = 0; x < width; x++) {
      const column = Math.min(cells - 1, Math.floor((x * cells) / width));
      const cell = row * cells + column;
      const at = (y * width + x) * 4;
      const alpha = (pixels[at + 3] ?? 0) / 255;

      for (let channel = 0; channel < channels; channel++) {
        const slot = cell * channels + channel;
        const value = pixels[at + channel] ?? 0;
        totals[slot] = (totals[slot] ?? 0) + value * alpha + 255 * (1 - alpha);
      }

      counts[cell] = (counts[cell] ?? 0) + 1;
    }
  }

  return totals.map(
    (total, index) =>
      total / Math.max(1, counts[Math.floor(index / channels)] ?? 1),
  );
}

/**
 * Compare two signatures. They come from images of the same dimensions, so the
 * grids line up and this is a straight per-cell difference.
 */
export function compare(a: Signature, b: Signature): Difference {
  let max = 0;
  let total = 0;

  for (const [index, value] of a.entries()) {
    const difference = Math.abs(value - (b[index] ?? 0));
    max = Math.max(max, difference);
    total += difference;
  }

  return { max, mean: total / a.length };
}
