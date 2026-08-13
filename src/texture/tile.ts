import type { Dimensions } from "../types.js";

/**
 * A tiled pattern over the whole image: the `<pattern>` under the given `id`,
 * and the rect that fills with it.
 *
 * A tile is what makes a treatment cheap to store as well as to draw. PNG
 * compresses along a row, and a repeating tile means a row that repeats, which
 * is the difference between the dot grid's 20KB and the half a megabyte a
 * pattern that never repeats costs.
 */
export function tile(
  id: string,
  /** The repeat: one number for a square tile, or both sides where it is not. */
  gap: number | Dimensions,
  contents: string,
  transform: string,
  dimensions: Dimensions,
  opacity: number,
): string {
  const { width, height } = dimensions;
  const repeat =
    typeof gap === "number" ? { width: gap, height: gap } : { ...gap };

  return (
    `<defs>` +
    `<pattern id="${id}" width="${String(repeat.width)}"` +
    ` height="${String(repeat.height)}"` +
    ` patternUnits="userSpaceOnUse"${transform}>${contents}</pattern>` +
    `</defs>` +
    `<rect width="${String(width)}" height="${String(height)}"` +
    ` fill="url(#${id})" opacity="${String(opacity)}"/>`
  );
}
