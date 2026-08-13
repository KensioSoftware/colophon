export type {
  Background,
  Badge,
  BrandColors,
  CodeStyle,
  ColophonConfig,
  ColophonConfigFactory,
  ColophonConfigInput,
  ContentFile,
  ContentOptions,
  Dimensions,
  ExtraImage,
  FontSource,
  GradientStop,
  Manifest,
  ManifestImage,
  ManifestPage,
  MeshBlob,
  MetaImageProps,
  MeasureText,
  MetaTag,
  MetaTagOptions,
  OutputFormat,
  OutputSize,
  Placement,
  PropsFromFrontmatter,
  Rasteriser,
  RenderedMetaImage,
  SafeArea,
  SlugStrategy,
  SizeOverrides,
  ResolvedConfig,
  Template,
  TemplateContext,
  Texture,
  TextStyle,
  ThemeName,
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

export { backgroundSvg } from "./background/index.js";
export { textureSvg } from "./texture/index.js";
export {
  buildSvg,
  renderMetaImages,
  renderSvgToImage,
  resvgRasteriser,
} from "./render/index.js";
// For a script placing images itself: the extension has to follow the format,
// and this is what a build names its own files with.
export { extensionFor } from "./encode/index.js";
// Exported for a rasteriser that takes file paths: a font may be configured as
// bytes, and this is what writes those somewhere a backend can open them.
export { fontFilePaths } from "./fonts/index.js";
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

export { createStamper, readImageStamp, stampImage } from "./stamp/index.js";
export type { Stamper } from "./stamp/index.js";

export { createMeasurer } from "./measure/index.js";

export { escapeXml, fitText, textElement, wrapText } from "./text/index.js";
export type {
  FitOptions,
  FittedText,
  MeasureAt,
  MeasureLine,
  TextAttributes,
} from "./text/index.js";

// The layout toolkit, which also has its own `@kensio/colophon/layout` subpath
// for a template that would rather not pull the rasteriser in with it.
export {
  blockLines,
  box,
  distribute,
  drawLines,
  image,
  inset,
  measureIn,
  optionalString,
  panel,
  placeLines,
  row,
  scrim,
  stack,
} from "./layout/index.js";
export type {
  Align,
  BoxStyle,
  Extent,
  ImageOptions,
  LinesStyle,
  Placed,
  PlacedLine,
  PanelStyle,
  Rect,
  RowRect,
  ScrimOptions,
  Span,
  StackedRect,
  StyledBlock,
  TextBlock,
  TextLine,
} from "./layout/index.js";

export {
  defaultContentExtensions,
  extractProps,
  readContentFile,
  slugFromPath,
  walkContent,
} from "./content/index.js";
export type { WalkOptions } from "./content/index.js";

// `resolveConfig` validates what it is given and throws, which is what a build
// wants. These are for a caller that would rather show the problems than stop.
export { configProblems, validateConfig } from "./validate/index.js";

export { metaTags, metaTagsHtml } from "./meta/index.js";

export {
  signatureParam,
  signParams,
  signedQuery,
  verifyParams,
  verifySignedQuery,
} from "./sign/index.js";
export type { SignedParams } from "./sign/index.js";

export { createPlacer } from "./placement/index.js";
export type { PlacedImage, Placer } from "./placement/index.js";
