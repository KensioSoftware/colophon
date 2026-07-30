import { resolveConfig } from "../config/index.js";
import { resolveConfigForSize } from "../config/size.js";
import type {
  ColophonConfig,
  MetaImageProps,
  RenderedMetaImage,
} from "../types.js";
import { renderSvgToPng } from "./png.js";
import { buildSvg } from "./svg.js";
import { selectTemplate } from "./template.js";

export { buildSvg } from "./svg.js";
export { renderSvgToPng } from "./png.js";
export { resvgRasteriser } from "./rasterise.js";

/**
 * Render an image for every configured output size from a single set of props.
 * This is the reusable core: it takes props and config and returns rendered
 * bytes, with no filesystem or content-discovery concerns.
 */
export async function renderMetaImages(
  props: MetaImageProps,
  config?: ColophonConfig,
): Promise<RenderedMetaImage[]> {
  const resolved = resolveConfig(config);

  // Validate the template once up front so a bad name fails fast.
  selectTemplate(resolved, props.template);

  return Promise.all(
    resolved.sizes.map(async (size) => {
      // Each size renders with its own overrides folded in, so one size wanting
      // a smaller minimum font does not mean a second pass over everything.
      const sizeConfig = resolveConfigForSize(config, size);
      const dimensions = { width: size.width, height: size.height };
      const svg = await buildSvg(props, sizeConfig, dimensions);
      const png = await renderSvgToPng(svg, dimensions, sizeConfig);
      return { name: size.name, dimensions, svg, png };
    }),
  );
}
