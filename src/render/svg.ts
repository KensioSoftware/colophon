import { backgroundSvg } from "../background.js";
import type { Dimensions, MetaImageProps, ResolvedConfig } from "../types.js";
import { selectTemplate } from "./template.js";

const backgroundId = "colophon-bg";

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
