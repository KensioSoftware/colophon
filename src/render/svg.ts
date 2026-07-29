import { backgroundSvg } from "../background/index.js";
import { loadImages } from "../image/index.js";
import { createMeasurer } from "../measure/index.js";
import { textureSvg } from "../texture/index.js";
import type { Dimensions, MetaImageProps, ResolvedConfig } from "../types.js";
import { selectTemplate } from "./template.js";

const backgroundId = "colophon-bg";
const textureId = "colophon-texture";

/**
 * Build the complete SVG document for one image: the enclosing `<svg>` root,
 * the config-driven background, and the template's foreground content.
 *
 * Asynchronous because a template may need to load resources. The `code`
 * template fetches syntax grammars and themes on demand, the fonts the text is
 * measured against have to be read before a template can lay it out, and so do
 * the logo, the avatar and any background photo.
 */
export async function buildSvg(
  props: MetaImageProps,
  config: ResolvedConfig,
  dimensions: Dimensions,
): Promise<string> {
  const template = selectTemplate(config, props.template);
  const [measure, images] = await Promise.all([
    createMeasurer(config),
    loadImages(config, props),
  ]);

  const background = backgroundSvg(
    config.background,
    dimensions,
    backgroundId,
    images.background,
  );
  // Over the background and under the template, so that a treatment gives the
  // background some surface without ever coming between text and reader.
  const texture =
    config.texture === undefined
      ? ""
      : textureSvg(config.texture, dimensions, textureId);
  const body = await template.render({
    props,
    config,
    dimensions,
    measure,
    logo: images.logo,
    avatar: images.avatar,
  });
  const { width, height } = dimensions;

  return (
    `<svg width="${String(width)}" height="${String(height)}"` +
    ` viewBox="0 0 ${String(width)} ${String(height)}"` +
    ` xmlns="http://www.w3.org/2000/svg">${background}${texture}${body}</svg>`
  );
}
