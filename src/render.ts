import type { ResvgRenderOptions } from "@resvg/resvg-js";
import { renderAsync } from "@resvg/resvg-js";

import { backgroundSvg } from "./background.js";
import { resolveConfig } from "./config.js";
import { fallbackFamily, fontFilePaths } from "./fonts.js";
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
 *
 * Asynchronous because a template may need to load resources — the `code`
 * template fetches syntax grammars and themes on demand.
 */
export async function buildSvg(
  props: MetaImageProps,
  config: ResolvedConfig,
  dimensions: Dimensions,
): Promise<string> {
  const template = selectTemplate(config, props.template);
  const background = backgroundSvg(config.background, dimensions, backgroundId);
  const body = await template.render({ props, config, dimensions });
  const { width, height } = dimensions;

  return (
    `<svg width="${String(width)}" height="${String(height)}"` +
    ` viewBox="0 0 ${String(width)} ${String(height)}"` +
    ` xmlns="http://www.w3.org/2000/svg">${background}${body}</svg>`
  );
}

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
 * SVG's own aspect ratio; {@link buildSvg} sizes it to match.
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
      const svg = await buildSvg(props, resolved, dimensions);
      const png = await renderSvgToPng(svg, dimensions, resolved);
      return { name: size.name, dimensions, svg, png };
    }),
  );
}
