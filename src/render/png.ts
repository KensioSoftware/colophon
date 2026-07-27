import type { ResvgRenderOptions } from "@resvg/resvg-js";
import { renderAsync } from "@resvg/resvg-js";

import { resolveConfig } from "../config/index.js";
import { fallbackFamily, fontFilePaths } from "../fonts/index.js";
import type { Dimensions, ResolvedConfig } from "../types.js";

/**
 * Font options for the rasteriser: the configured font files, and whether to
 * fall back to the machine's own.
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
 * Rasterise an SVG string to a PNG buffer, scaled to `dimensions.width`.
 *
 * Text is drawn with the fonts named by `config`, which is what keeps the
 * output the same on a laptop, in CI and in a container. Height follows the
 * SVG's own aspect ratio; `buildSvg` sizes it to match.
 */
export async function renderSvgToPng(
  svg: string,
  dimensions: Dimensions,
  config: ResolvedConfig = resolveConfig(),
): Promise<Buffer> {
  const rendered = await renderAsync(svg, {
    fitTo: { mode: "width", value: dimensions.width },
    font: await fontOptions(config),
  });

  return rendered.asPng();
}
