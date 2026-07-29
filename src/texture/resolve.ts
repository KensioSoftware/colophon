import type { BrandColors, Texture } from "../types.js";

/**
 * Fill in the colour a texture left open, from the palette it will be drawn
 * over.
 *
 * A dot grid or a set of rules has to be the foreground colour by default,
 * because that is the one colour known to contrast with the background: a
 * fixed white would disappear on a light theme, which is a texture that
 * silently does nothing. Grain has no colour to fill in, being noise.
 *
 * It happens here rather than while drawing so that the resolved config says
 * what will actually be drawn, which is also what the rebuild stamp hashes: a
 * palette change then re-renders the texture that follows it.
 */
export function resolveTexture(
  texture: Texture | undefined,
  colors: Required<BrandColors>,
): Texture | undefined {
  if (texture === undefined || texture.type === "grain") {
    return texture;
  }

  return { color: colors.foreground, ...texture };
}
