import type { Dimensions, Texture } from "../types.js";

const defaultOpacity = 0.1;
const defaultScale = 1.4;

/**
 * Film grain, from one turbulence filter.
 *
 * `scale` is roughly the size of a speck in pixels, which is what someone
 * tuning this actually wants to think about; the filter wants the reciprocal
 * of that, so the two are inverses of each other. Three octaves is enough to
 * stop the noise looking regular and cheap enough not to notice.
 *
 * The noise is desaturated to grey, since coloured specks over a brand colour
 * read as a rendering fault rather than as grain. Grey does lighten what is
 * under it a little, which is why the default opacity is as low as it is.
 */
export function grainSvg(
  texture: Extract<Texture, { readonly type: "grain" }>,
  dimensions: Dimensions,
  id: string,
): string {
  const { width, height } = dimensions;
  const frequency = 1 / (texture.scale ?? defaultScale);

  return (
    `<defs>` +
    `<filter id="${id}" x="0" y="0" width="100%" height="100%">` +
    `<feTurbulence type="fractalNoise" baseFrequency="${frequency.toFixed(3)}"` +
    ` numOctaves="3" stitchTiles="stitch"/>` +
    `<feColorMatrix type="saturate" values="0"/>` +
    `</filter>` +
    `</defs>` +
    `<rect width="${String(width)}" height="${String(height)}"` +
    ` filter="url(#${id})"` +
    ` opacity="${String(texture.opacity ?? defaultOpacity)}"/>`
  );
}
