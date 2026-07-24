export type {
  Background,
  Badge,
  BrandColors,
  ColophonConfig,
  Dimensions,
  GradientStop,
  MetaImageProps,
  RenderedMetaImage,
  ResolvedConfig,
  Template,
  TemplateContext,
} from "./types.js";

export {
  DEFAULT_COLORS,
  DEFAULT_DIMENSIONS,
  DEFAULT_FONT_FAMILY,
  defineConfig,
  resolveConfig,
} from "./config.js";

export { backgroundSvg } from "./background.js";
export { buildSvg, renderMetaImages, renderSvgToPng } from "./render.js";
export {
  bannerTemplate,
  builtinTemplates,
  cardTemplate,
} from "./templates/index.js";

export { defaultOutputPath, generate } from "./generate.js";
export type { GeneratedImage, GenerateOptions } from "./generate.js";

export { escapeXml, wrapText } from "./text.js";

export { extractProps, walkContent } from "./content/index.js";
export type { ContentFile, WalkOptions } from "./content/index.js";
