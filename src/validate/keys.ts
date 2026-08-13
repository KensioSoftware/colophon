import type {
  Background,
  Badge,
  BrandColors,
  CodeChrome,
  CodeStyle,
  ColophonConfig,
  ContentOptions,
  ExtraImage,
  FontSource,
  GradientStop,
  ImageSource,
  MeshBlob,
  OutputFormat,
  OutputSize,
  Placement,
  Scrim,
  SlugStrategy,
  Texture,
} from "../types.js";

/**
 * The keys of one config object, as a list to check incoming keys against.
 *
 * Taking a `Record<keyof T, true>` rather than a plain array of strings is
 * what keeps the list honest: adding an option to `types.ts` without listing
 * it here fails the build, which is much better than the new option quietly
 * becoming an unknown one.
 */
function knownKeys<T>(shape: Record<keyof T, true>): readonly string[] {
  return Object.keys(shape);
}

type BesidePlacement = Extract<
  Placement,
  { readonly strategy: "beside-content" }
>;
type PublicDirPlacement = Extract<
  Placement,
  { readonly strategy: "public-dir" }
>;
type CustomPlacement = Extract<Placement, { readonly strategy: "custom" }>;
type SolidBackground = Extract<Background, { readonly type: "solid" }>;
type ImageBackground = Extract<Background, { readonly type: "image" }>;
type GradientBackground = Extract<Background, { readonly type: "gradient" }>;
type MeshBackground = Extract<Background, { readonly type: "mesh" }>;
type GrainTexture = Extract<Texture, { readonly type: "grain" }>;
type DotsTexture = Extract<Texture, { readonly type: "dots" }>;
type RulesTexture = Extract<Texture, { readonly type: "rules" }>;
type WavesTexture = Extract<Texture, { readonly type: "waves" }>;
type RaysTexture = Extract<Texture, { readonly type: "rays" }>;
type MoireTexture = Extract<Texture, { readonly type: "moire" }>;
type GridTexture = Extract<Texture, { readonly type: "grid" }>;
type CrossesTexture = Extract<Texture, { readonly type: "crosses" }>;
type GradientPoint = NonNullable<GradientBackground["from"]>;
type ImageByPath = Extract<ImageSource, { readonly path: string }>;
type ImageByData = Extract<ImageSource, { readonly data: Uint8Array }>;
type FontByPath = Extract<FontSource, { readonly path: string }>;
type FontByData = Extract<FontSource, { readonly data: Uint8Array }>;

/** Top-level config options. */
export const configKeys = knownKeys<ColophonConfig>({
  theme: true,
  colors: true,
  background: true,
  texture: true,
  fonts: true,
  systemFonts: true,
  fontFamily: true,
  footer: true,
  badge: true,
  logo: true,
  code: true,
  onWarning: true,
  sizes: true,
  templates: true,
  rasteriser: true,
  compressionLevel: true,
  quantise: true,
  format: true,
  quality: true,
  maxBytes: true,
  emitSvg: true,
  content: true,
  placement: true,
  manifest: true,
  extra: true,
});

/** Keys of a placement that writes each image beside its post. */
export const besideContentKeys = knownKeys<BesidePlacement>({
  strategy: true,
  urlBase: true,
  hash: true,
});

/** Keys of a placement that gathers images into one directory. */
export const publicDirKeys = knownKeys<PublicDirPlacement>({
  strategy: true,
  dir: true,
  urlBase: true,
  hash: true,
});

/** Keys of a placement that works both halves out for itself. */
export const customPlacementKeys = knownKeys<CustomPlacement>({
  strategy: true,
  path: true,
  url: true,
});

/**
 * The placement strategies, for the same reason as {@link backgroundTypes}: a
 * mistyped one would otherwise be reported as an unknown key on whichever
 * variant it was guessed to be.
 *
 * Two of the names are hyphenated because they are values a user writes in a
 * config rather than identifiers, and the casing rule is about identifiers.
 * Keeping them as keys is what keeps the list exhaustive, which is the whole
 * point of it.
 */
export const placementStrategies = knownKeys<
  Record<Placement["strategy"], unknown>
>({
  "beside-content": true,
  "public-dir": true,
  custom: true,
});

/** One ad hoc image declared in config. */
export const extraKeys = knownKeys<ExtraImage>({
  props: true,
  output: true,
  size: true,
});

/** Options for reading a project's own frontmatter. */
export const contentKeys = knownKeys<ContentOptions>({
  propsKey: true,
  templateField: true,
  defaultTemplate: true,
  props: true,
  slugField: true,
  slugStrategy: true,
  extensions: true,
});

/** Brand palette shades. */
export const colorKeys = knownKeys<BrandColors>({
  brand: true,
  brandDark: true,
  brandWarm: true,
  foreground: true,
});

/** Corner-badge options. */
export const badgeKeys = knownKeys<Badge>({
  text: true,
  color: true,
  background: true,
});

/** `code` template styling options. */
export const codeKeys = knownKeys<CodeStyle>({
  theme: true,
  fontFamily: true,
  lineHeight: true,
  tabSize: true,
  cornerScale: true,
  maxFontScale: true,
  minFontScale: true,
  lineNumbers: true,
  chrome: true,
  panelOpacity: true,
  borderColor: true,
  borderOpacity: true,
});

/**
 * The window chrome styles, as values, for the reason {@link backgroundTypes}
 * are: the template draws anything it does not recognise as a bar with the
 * neutral buttons, so a mistyped `macOS` would quietly lose the traffic lights.
 */
export const codeChromeStyles = knownKeys<Record<CodeChrome, unknown>>({
  none: true,
  mono: true,
  macos: true,
});

/** One output size, including the overrides it may carry. */
export const sizeKeys = knownKeys<OutputSize>({
  name: true,
  width: true,
  height: true,
  theme: true,
  colors: true,
  background: true,
  texture: true,
  fontFamily: true,
  footer: true,
  badge: true,
  logo: true,
  code: true,
});

/**
 * Both font variants at once. Which of `path` and `data` a font may carry is
 * `fonts/resolve.ts`'s ruling to make, and it has a better message for it than
 * a list of keys could.
 */
export const fontKeys = [
  ...new Set([
    ...knownKeys<FontByPath>({ family: true, path: true }),
    ...knownKeys<FontByData>({ family: true, data: true }),
  ]),
];

/** Keys of a solid background. */
export const solidBackgroundKeys = knownKeys<SolidBackground>({
  type: true,
  color: true,
});

/** Keys of a background that draws a picture. */
export const imageBackgroundKeys = knownKeys<ImageBackground>({
  type: true,
  source: true,
  fit: true,
  color: true,
  scrim: true,
});

/**
 * The fits an image background accepts, as values rather than keys. `image`
 * draws anything that is not `cover` as `contain`, so a mistyped `crop` would
 * quietly change how every image in the build is cropped.
 */
export const backgroundFits = knownKeys<
  Record<NonNullable<ImageBackground["fit"]>, unknown>
>({
  cover: true,
  contain: true,
});

/** Keys of the wash over a background image. */
export const scrimKeys = knownKeys<Scrim>({
  color: true,
  from: true,
  to: true,
});

/**
 * Both image-source variants at once, for the same reason {@link fontKeys}
 * takes both: which of `path` and `data` a source may carry is a question
 * `image/resolve.ts` has a better message for than a key list does.
 */
export const imageSourceKeys = [
  ...new Set([
    ...knownKeys<ImageByPath>({ path: true }),
    ...knownKeys<ImageByData>({ data: true }),
  ]),
];

/** Keys of a gradient background. */
export const gradientBackgroundKeys = knownKeys<GradientBackground>({
  type: true,
  stops: true,
  from: true,
  to: true,
});

/** Keys of one gradient stop. */
export const gradientStopKeys = knownKeys<GradientStop>({
  offset: true,
  color: true,
});

/** Keys of a gradient's `from` and `to` points. */
export const gradientPointKeys = knownKeys<GradientPoint>({ x: true, y: true });

/** Keys of a mesh background. */
export const meshBackgroundKeys = knownKeys<MeshBackground>({
  type: true,
  color: true,
  blobs: true,
});

/** Keys of one blob of a mesh. */
export const meshBlobKeys = knownKeys<MeshBlob>({
  color: true,
  x: true,
  y: true,
  radius: true,
  opacity: true,
});

/**
 * The background variants, as values to check a declared `type` against. Typed
 * against the union for the same reason the key lists are: a variant added to
 * `Background` and not listed here would otherwise be reported as an unknown
 * type, rejecting a config that is perfectly valid.
 */
export const backgroundTypes = knownKeys<Record<Background["type"], unknown>>({
  solid: true,
  gradient: true,
  mesh: true,
  image: true,
});

/** Keys of film grain. */
export const grainTextureKeys = knownKeys<GrainTexture>({
  type: true,
  opacity: true,
  scale: true,
});

/** Keys of a dot grid. */
export const dotsTextureKeys = knownKeys<DotsTexture>({
  type: true,
  color: true,
  opacity: true,
  size: true,
  gap: true,
});

/** Keys of ruled lines. */
export const rulesTextureKeys = knownKeys<RulesTexture>({
  type: true,
  color: true,
  opacity: true,
  width: true,
  gap: true,
  angle: true,
  cross: true,
});

/** Keys of the rings drawn in from either side. */
export const wavesTextureKeys = knownKeys<WavesTexture>({
  type: true,
  color: true,
  opacity: true,
  width: true,
  gap: true,
});

/** Keys of the fan of straight lines. */
export const raysTextureKeys = knownKeys<RaysTexture>({
  type: true,
  color: true,
  opacity: true,
  width: true,
  count: true,
  x: true,
  y: true,
});

/** Keys of the two crossed grids. */
export const moireTextureKeys = knownKeys<MoireTexture>({
  type: true,
  color: true,
  opacity: true,
  width: true,
  gap: true,
  angle: true,
});

/** Keys of squared paper. */
export const gridTextureKeys = knownKeys<GridTexture>({
  type: true,
  color: true,
  opacity: true,
  width: true,
  gap: true,
  major: true,
});

/** Keys of the grid of crosses. */
export const crossesTextureKeys = knownKeys<CrossesTexture>({
  type: true,
  color: true,
  opacity: true,
  size: true,
  width: true,
  gap: true,
});

/**
 * The texture variants, as values, for the reason {@link backgroundTypes} are:
 * they have different keys, so a mistyped `type` has to be reported as itself
 * rather than as a list of keys that do not apply.
 */
export const textureTypes = knownKeys<Record<Texture["type"], unknown>>({
  grain: true,
  dots: true,
  rules: true,
  waves: true,
  rays: true,
  moire: true,
  grid: true,
  crosses: true,
});

/**
 * The output formats, as values, for the reason {@link backgroundTypes} are:
 * a mistyped `jpg` would otherwise reach the encoder, which has no better
 * message for it than this does and would find out one image too late.
 */
export const outputFormats = knownKeys<Record<OutputFormat, unknown>>({
  png: true,
  jpeg: true,
  webp: true,
  avif: true,
});

/**
 * The slug strategies, for the same reason as {@link backgroundTypes}:
 * `slugFromPath` treats anything that is not `basename` as a route, so a
 * mistyped `rout` would quietly re-slug a whole site rather than complain.
 */
export const slugStrategies = knownKeys<Record<SlugStrategy, unknown>>({
  basename: true,
  route: true,
});
