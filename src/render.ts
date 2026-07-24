import sharp from "sharp";

import { backgroundSvg } from "./background.js";
import { resolveConfig } from "./config.js";
import type {
  ColophonConfig,
  Dimensions,
  MetaImageProps,
  RenderedMetaImage,
  ResolvedConfig,
  Template,
} from "./types.js";

const backgroundId = "colophon-bg";

function selectTemplate(config: ResolvedConfig, name: string): Template {
  const template = config.templates[name];

  if (template === undefined) {
    const available = Object.keys(config.templates)
      .toSorted((a, b) => a.localeCompare(b))
      .join(", ");
    throw new Error(
      `Unknown template "${name}". Available templates: ${available}.`,
    );
  }

  return template;
}

/**
 * Build the complete SVG document for one image: the enclosing `<svg>` root,
 * the config-driven background, and the template's foreground content.
 */
export function buildSvg(
  props: MetaImageProps,
  config: ResolvedConfig,
  dimensions: Dimensions,
): string {
  const template = selectTemplate(config, props.template);
  const background = backgroundSvg(config.background, dimensions, backgroundId);
  const body = template.render({ props, config, dimensions });
  const { width, height } = dimensions;

  return (
    `<svg width="${String(width)}" height="${String(height)}"` +
    ` viewBox="0 0 ${String(width)} ${String(height)}"` +
    ` xmlns="http://www.w3.org/2000/svg">${background}${body}</svg>`
  );
}

/**
 * Rasterise an SVG string to a PNG buffer at the given dimensions.
 */
export async function renderSvgToPng(
  svg: string,
  dimensions: Dimensions,
): Promise<Buffer> {
  return sharp(Buffer.from(svg))
    .resize(dimensions.width, dimensions.height, { fit: "fill" })
    .png()
    .toBuffer();
}

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
      const dimensions = { width: size.width, height: size.height };
      const svg = buildSvg(props, resolved, dimensions);
      const png = await renderSvgToPng(svg, dimensions);
      return { name: size.name, dimensions, svg, png };
    }),
  );
}
