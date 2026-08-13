import type { Dimensions, Texture } from "../../types.js";
import { fallbackColor } from "../color.js";
import { contourAt } from "./contours.js";

const contourDefaults = {
  opacity: 0.1,
  width: 1.5,
  gap: 34,
  relief: 5,
  seed: 1,
};

/**
 * How finely the ground is sampled, as a fraction of the gap between contours.
 *
 * The cells have to be smaller than the features the field has, or the lines
 * come out as polygons. Below about a third of the gap the picture stops
 * changing and only the markup grows.
 */
const sampleScale = 0.5;

/**
 * Contour lines, the look of a map: the height of a made-up landscape, drawn
 * every `gap` pixels of it.
 *
 * These are the real thing rather than rings pretending: the field is sampled
 * on a grid and each contour is the line where the ground passes through one
 * height, so the shapes close where the ground has a summit, run off the edge
 * where it keeps rising, and never cross each other. An earlier attempt drew
 * circles pushed in and out by the same field, and no amount of pushing made
 * it read as anything but a wobbly bullseye: what makes a map is that the
 * shapes owe nothing to a centre.
 */
export function topographicSvg(
  texture: Extract<Texture, { readonly type: "topographic" }>,
  dimensions: Dimensions,
): string {
  const gap = texture.gap ?? contourDefaults.gap;
  const relief = gap * (texture.relief ?? contourDefaults.relief);
  const seed = texture.seed ?? contourDefaults.seed;
  const step = Math.max(2, Math.round(gap * sampleScale));

  let lines = "";

  // The field runs from -relief to relief, so the levels either side of nought
  // are what fits in it. One at nought as well would draw the coastline twice
  // over, since the sum of the waves sits there more often than anywhere else.
  for (let level = gap / 2; level < relief; level += gap) {
    lines += contourAt(level, step, dimensions, seed, relief);
    lines += contourAt(-level, step, dimensions, seed, relief);
  }

  return (
    `<path d="${lines}" fill="none"` +
    ` stroke="${texture.color ?? fallbackColor}"` +
    ` stroke-width="${String(texture.width ?? contourDefaults.width)}"` +
    ` opacity="${String(texture.opacity ?? contourDefaults.opacity)}"/>`
  );
}
