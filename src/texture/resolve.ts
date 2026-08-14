import { DEFAULT_TEXTURE_SCALE } from "../config/defaults.js";
import type { BrandColors, Texture } from "../types.js";

/**
 * Fill in the colour a texture left open, from the palette it will be drawn
 * over.
 *
 * A dot grid, a set of rules or a set of rings has to be the foreground colour
 * by default, because that is the one colour known to contrast with the
 * background: a fixed white would disappear on a light theme, which is a
 * texture that silently does nothing.
 *
 * It happens here rather than while drawing so that the resolved config says
 * what will actually be drawn, which is also what the rebuild stamp hashes: a
 * palette change then re-renders the texture that follows it.
 */
export function resolveTexture(
  texture: Texture | undefined,
  colors: Required<BrandColors>,
): Texture | undefined {
  return texture === undefined
    ? undefined
    : { color: colors.foreground, ...texture };
}

/**
 * The texture scale a config asked for, or `1`.
 *
 * A scale of nothing, or of something that is not a positive number, is taken
 * as no scaling rather than as an error. Everything it could mean instead is
 * worse: zero would divide the image by nothing, and a negative would draw the
 * treatment backwards through the origin, so both are configs that would fail
 * as a blank image rather than as a message.
 */
export function resolveTextureScale(scale: number | undefined): number {
  return scale === undefined || !Number.isFinite(scale) || scale <= 0
    ? DEFAULT_TEXTURE_SCALE
    : scale;
}
