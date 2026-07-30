import type { ResvgRenderOptions } from "@resvg/resvg-js";
import { renderAsync } from "@resvg/resvg-js";

import { fallbackFamily, fontFilePaths } from "../fonts/index.js";
import type { Rasteriser, ResolvedConfig } from "../types.js";

/**
 * Font options for resvg: the configured font files, and whether to fall back
 * to the machine's own.
 */
async function fontOptions(
  config: ResolvedConfig,
): Promise<NonNullable<ResvgRenderOptions["font"]>> {
  const fallback = fallbackFamily(config.fonts);

  return {
    loadSystemFonts: config.systemFonts,
    fontFiles: await fontFilePaths(config.fonts),
    ...(fallback !== undefined && { defaultFontFamily: fallback }),
  };
}

/**
 * The default rasteriser: resvg, scaled to `dimensions.width`.
 *
 * Text is drawn with the fonts named by `config`, which is what keeps the
 * output the same on a laptop, in CI and in a container. Height follows the
 * SVG's own aspect ratio; `buildSvg` sizes it to match.
 *
 * It lives here rather than in `png.ts` so that `resolveConfig` can name it as
 * the default without importing the module that dispatches to it. Nothing here
 * reads config beyond the fonts, which is the whole of what a rasteriser is
 * given to work with.
 */
export const resvgRasteriser: Rasteriser = async (svg, dimensions, config) => {
  const rendered = await renderAsync(svg, {
    fitTo: { mode: "width", value: dimensions.width },
    font: await fontOptions(config),
  });

  return rendered.asPng();
};
