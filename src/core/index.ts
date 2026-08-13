/**
 * The template layer, with nothing in it that needs Node.
 *
 * `buildSvg` is string building: it takes props, a config and a size, and
 * returns an SVG document. Everything Node-shaped in this package is either
 * side of that. Finding content and reading frontmatter comes before it, and
 * turning the document into pixels comes after, so the middle can run in a
 * browser or at the edge.
 *
 * Two things follow from that and are worth knowing before importing this.
 *
 * Fonts and images have to be supplied as bytes rather than as paths, since
 * there is no filesystem to resolve a path against. A config naming one is an
 * error when it is resolved rather than a blank corner later.
 *
 * There is no rasteriser. resvg is a native module, so a build for this entry
 * point does not include it, and asking for pixels without setting
 * `config.rasteriser` says so. Set it to a wasm build to have them here, or
 * take the SVG and rasterise it somewhere else.
 *
 * The swap is `package.json`'s `browser` field, which every bundler in scope
 * honours. Importing this entry point from Node gets the Node halves and works
 * as the root entry point does.
 */
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
  ImageSource,
  MeasureText,
  MetaImageProps,
  MeshBlob,
  OutputFormat,
  OutputSize,
  Rasteriser,
  RenderedMetaImage,
  ResolvedConfig,
  SafeArea,
  Template,
  TemplateContext,
  Texture,
  TextStyle,
  ThemeName,
  WarningHandler,
} from "../types.js";

export {
  DEFAULT_CODE_FONT_FAMILY,
  DEFAULT_CODE_STYLE,
  DEFAULT_COLORS,
  DEFAULT_FONT_FAMILY,
  DEFAULT_SIZES,
  defineConfig,
  resolveConfig,
  SIZE_PRESETS,
} from "../config/index.js";
export { resolveConfigForSize } from "../config/size.js";

export { buildSvg } from "../render/svg.js";
export { backgroundSvg } from "../background/index.js";
export { textureSvg } from "../texture/index.js";
export {
  bannerTemplate,
  builtinTemplates,
  cardTemplate,
  codeTemplate,
} from "../templates/index.js";

// Imported from `content/props.js` rather than from `content/index.js`, whose
// other exports walk and read a content tree. `extractProps` is pure, and a
// bundle for the browser should not have to pull `node:fs` in behind it.
export { extractProps } from "../content/props.js";

// The problems in a config, rather than an exception carrying them. A build
// wants the throw; an editor rendering a config as it is typed wants the list.
export { configProblems } from "../validate/index.js";

export { createMeasurer } from "../measure/index.js";
export { escapeXml, fitText, textElement, wrapText } from "../text/index.js";
export {
  dedent,
  expandTabs,
  highlightCode,
  resolveLanguage,
} from "../highlight/index.js";

// For an endpoint that renders on demand, which is what a browser-safe core is
// for. See `sign/index.ts` for why an unsigned one is a bad idea.
export {
  signatureParam,
  signParams,
  signedQuery,
  verifyParams,
  verifySignedQuery,
} from "../sign/index.js";
export type { SignedParams } from "../sign/index.js";
