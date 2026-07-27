export type {
  Background,
  Badge,
  BrandColors,
  CodeStyle,
  ColophonConfig,
  ContentOptions,
  Dimensions,
  FontSource,
  GradientStop,
  MetaImageProps,
  OutputSize,
  PropsFromFrontmatter,
  RenderedMetaImage,
  SlugStrategy,
  SizeOverrides,
  ResolvedConfig,
  Template,
  TemplateContext,
  WarningHandler,
} from "./types.js";

export {
  DEFAULT_CODE_FONT_FAMILY,
  DEFAULT_CODE_STYLE,
  DEFAULT_COLORS,
  DEFAULT_FONT_FAMILY,
  DEFAULT_SIZES,
  defineConfig,
  resolveConfig,
  resolveConfigForSize,
  SIZE_PRESETS,
} from "./config.js";

export { backgroundSvg } from "./background.js";
export { buildSvg, renderMetaImages, renderSvgToPng } from "./render.js";
export {
  bannerTemplate,
  builtinTemplates,
  cardTemplate,
  codeTemplate,
} from "./templates/index.js";

export {
  dedent,
  expandTabs,
  highlightCode,
  resolveLanguage,
} from "./highlight.js";
export type {
  CodeToken,
  HighlightedCode,
  HighlightOptions,
} from "./highlight.js";

export { defaultOutputPath, generate } from "./generate.js";
export type { GeneratedImage, GenerateOptions } from "./generate.js";

export { createStamper, readPngStamp, stampPng } from "./stamp.js";
export type { Stamper } from "./stamp.js";

export { escapeXml, wrapText } from "./text.js";

export { extractProps, slugFromPath, walkContent } from "./content/index.js";
export type { ContentFile, WalkOptions } from "./content/index.js";
