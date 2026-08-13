import type { ResvgRenderOptions } from "@resvg/resvg-js";
import { renderAsync } from "@resvg/resvg-js";

import {
  fallbackFamily,
  fontFilePaths,
  withBundledFonts,
} from "../fonts/index.js";
import type { Rasteriser, ResolvedConfig } from "../types.js";

/**
 * Font options for resvg: the configured font files, and whether to fall back
 * to the machine's own.
 */
async function fontOptions(
  config: ResolvedConfig,
): Promise<NonNullable<ResvgRenderOptions["font"]>> {
  // The bundled fonts count here too, so that a stack naming nothing loaded
  // falls back to Outfit rather than to whatever resvg would have chosen. That
  // is the family the measurer will have measured against, and the two have to
  // agree or the layout is right on a machine that happens to have the font
  // and wrong on one that does not.
  const fallback = fallbackFamily(withBundledFonts(config.fonts));

  return {
    loadSystemFonts: config.systemFonts,
    fontFiles: await fontFilePaths(withBundledFonts(config.fonts)),
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
