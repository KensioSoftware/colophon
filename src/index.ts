export type {
  Background,
  Badge,
  BrandColors,
  CodeStyle,
  ColophonConfig,
  ContentOptions,
  Dimensions,
  ExtraImage,
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
  SIZE_PRESETS,
} from "./config/index.js";
export { resolveConfigForSize } from "./config/size.js";

export { backgroundSvg } from "./background.js";
export { buildSvg, renderMetaImages, renderSvgToPng } from "./render/index.js";
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
} from "./highlight/index.js";
export type {
  CodeToken,
  HighlightedCode,
  HighlightOptions,
} from "./highlight/index.js";

export { defaultOutputPath, generate } from "./generate/index.js";
export type { GeneratedImage, GenerateOptions } from "./generate/index.js";

export { createStamper, readPngStamp, stampPng } from "./stamp/index.js";
export type { Stamper } from "./stamp/index.js";

export { escapeXml, wrapText } from "./text/index.js";

export { extractProps, slugFromPath, walkContent } from "./content/index.js";
export type { ContentFile, WalkOptions } from "./content/index.js";
