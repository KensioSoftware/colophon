import type {
  BrandColors,
  CodeStyle,
  OutputFormat,
  OutputSize,
} from "../types.js";

/**
 * How much larger a texture is drawn on the `thumbnail` preset.
 *
 * A thumbnail is uploaded at 1280 wide and shown at somewhere between about
 * 360 and 170, so a dot grid at its default 66px spacing arrives at the reader
 * about 15px apart, which is not a texture any more but a slightly dirty
 * background. Two is the factor for the largest of those, and it is the
 * conservative choice: a treatment that is a little too coarse still reads as
 * a treatment, where one that is too fine reads as nothing at all.
 *
 * It was three while the treatments themselves were half again finer. What it
 * corrects for is the display size, so when the base geometry grew this came
 * down by the same factor and the finished thumbnail is unchanged.
 */
export const DEFAULT_THUMBNAIL_TEXTURE_SCALE = 2;

/**
 * The texture scale everything else is drawn at, which is to say, unchanged.
 */
export const DEFAULT_TEXTURE_SCALE = 1;

/**
 * YouTube's safe area, as insets of the banner it is uploaded on.
 *
 * This is the one platform that publishes the figure rather than leaving it to
 * be worked out: 1546x423 centred on a 2560x1440 upload, so the insets are
 * `(2560 - 1546) / 2 / 2560` and `(1440 - 423) / 2 / 1440`. They are written
 * out because the arithmetic is the evidence. The same fractions turn up as
 * 1235x338 on the 2048x1152 minimum upload, which is what says a safe area
 * belongs in fractions rather than pixels.
 */
const YOUTUBE_SAFE_X = (2560 - 1546) / 2 / 2560;
const YOUTUBE_SAFE_Y = (1440 - 423) / 2 / 1440;

/**
 * Named output-size presets covering the common social-image standards. Each
 * `name` becomes the filename suffix (e.g. `my-post-og.png`).
 *
 * The first group are share images, made once per post:
 *
 * - `og`: 1.91:1, the Open Graph standard (`og:image`). Facebook, LinkedIn,
 *   Slack, Discord, WhatsApp, Mastodon, and the usual `twitter:image` reuse.
 * - `square`: 1:1, X/Twitter `summary` card and a universal fallback.
 * - `twitter`: 2:1, X/Twitter `summary_large_image` card.
 * - `pinterest`: 2:3 tall pin.
 * - `thumbnail`: 16:9, the size YouTube asks video thumbnails to be uploaded
 *   at, carrying a {@link SizeOverrides.textureScale} for the reason that
 *   field gives.
 *
 * The rest are profile covers, made once for a site rather than once per post,
 * so `config.extra` is the usual way to declare one. Each carries the
 * {@link SafeArea} for the platform it is named after, which is what keeps the
 * text out of the avatar and out of whatever that platform crops. Where those
 * numbers come from, and how much to trust each of them, is in
 * `docs/configuration/cover-images`.
 *
 * None of the covers is in `DEFAULT_SIZES`: a cover is not something a build
 * should start making for every post because the package was upgraded.
 */
export const SIZE_PRESETS = {
  og: { name: "og", width: 1200, height: 630 },
  square: { name: "square", width: 1200, height: 1200 },
  twitter: { name: "twitter", width: 1200, height: 600 },
  pinterest: { name: "pinterest", width: 1000, height: 1500 },
  thumbnail: {
    name: "thumbnail",
    width: 1280,
    height: 720,
    textureScale: DEFAULT_THUMBNAIL_TEXTURE_SCALE,
  },
  xCover: {
    name: "x-cover",
    width: 1500,
    height: 500,
    safeArea: { top: 0.12, right: 0.06, bottom: 0.12, left: 0.25 },
  },
  linkedinCover: {
    name: "linkedin-cover",
    width: 1584,
    height: 396,
    safeArea: { top: 0.1, right: 0.2, bottom: 0.1, left: 0.28 },
  },
  linkedinPageCover: {
    name: "linkedin-page-cover",
    width: 4200,
    height: 700,
    safeArea: { top: 0.14, right: 0.12, bottom: 0.14, left: 0.22 },
  },
  blueskyCover: {
    name: "bluesky-cover",
    width: 3000,
    height: 1000,
    safeArea: { top: 0.15, right: 0.1, bottom: 0.15, left: 0.22 },
  },
  youtubeCover: {
    name: "youtube-cover",
    width: 2560,
    height: 1440,
    safeArea: {
      top: YOUTUBE_SAFE_Y,
      right: YOUTUBE_SAFE_X,
      bottom: YOUTUBE_SAFE_Y,
      left: YOUTUBE_SAFE_X,
    },
  },
} as const satisfies Record<string, OutputSize>;

/**
 * Default output sizes: the Open Graph landscape plus a square. Between them
 * they satisfy `og:image` and both `twitter:image` card types.
 */
export const DEFAULT_SIZES: readonly OutputSize[] = [
  SIZE_PRESETS.og,
  SIZE_PRESETS.square,
];

/**
 * Default font stack, used when no fonts are configured.
 *
 * Outfit ships with the package, so this resolves to a real file rather than
 * to whatever the machine happens to have: the same words come out the same
 * width on a laptop, in CI and in a container, without a project configuring
 * anything. The families behind it are the fallback for a character Outfit
 * does not cover, which is most of what is not Latin.
 */
export const DEFAULT_FONT_FAMILY =
  'Outfit, "Helvetica Neue", Helvetica, Arial, sans-serif';

/**
 * Default zlib level for the rendered PNG: the strongest there is.
 *
 * A meta image is written once and then served for as long as the post is up,
 * so the trade is a hundred milliseconds of build time against bytes every
 * reader pays for. The stamps mean even that time is paid once per image rather
 * than once per build. See `png/recompress.ts` for what the level does and does
 * not change.
 */
export const DEFAULT_COMPRESSION_LEVEL = 9;

/**
 * Default output format: PNG, which is what Colophon wrote before there was a
 * choice and what every platform has always accepted.
 */
export const DEFAULT_FORMAT: OutputFormat = "png";

/**
 * Default encoding quality for the lossy formats.
 *
 * `80` is where JPEG, WebP and AVIF are conventionally set, and on a meta image
 * it is hard to tell from the original. Gradients are what these pictures are
 * mostly made of and they are the first thing to band, so this is deliberately
 * not lower.
 */
export const DEFAULT_QUALITY = 80;

/**
 * The lowest quality `maxBytes` will step down to.
 *
 * Below this the banding is obvious enough that the image is no longer doing
 * its job, and an unreadable image under the cap is not what a cap was for.
 */
export const MINIMUM_QUALITY = 30;

/**
 * How far quality drops on each attempt at `maxBytes`.
 *
 * Ten points is a step a reader can predict from the setting they wrote, and
 * from 80 it reaches the floor in five encodings.
 */
export const QUALITY_STEP = 10;

/** Neutral default palette, used when no `colors.brand` is supplied. */
export const DEFAULT_COLORS: Required<BrandColors> = {
  brand: "#4f46e5",
  brandDark: "#3730a3",
  brandWarm: "#db2777",
  foreground: "#ffffff",
};

/**
 * Default monospace stack for the `code` template. It ends in the generic
 * `monospace` family so it always resolves to something, whatever fonts the
 * machine running the build happens to have.
 */
export const DEFAULT_CODE_FONT_FAMILY =
  '"JetBrains Mono", "Source Code Pro", "DejaVu Sans Mono", Menlo, Consolas, monospace';

/**
 * Default `code` template styling. `lineHeight` sets the monospace grid the
 * snippet is laid out on, along with the character width, which is measured
 * from the font rather than configured. The font-size bounds are fractions of
 * the image width so they hold at every output size.
 *
 * `minFontScale` of `0.025` is roughly 30px on a 1200px-wide image, which
 * still reads when a feed shows that image at half size. A snippet too long to
 * fit at that size is truncated rather than shrunk, so a long sample loses
 * lines on the shorter landscape formats.
 */
export const DEFAULT_CODE_STYLE: Required<CodeStyle> = {
  theme: "github-dark",
  fontFamily: DEFAULT_CODE_FONT_FAMILY,
  lineHeight: 1.55,
  tabSize: 2,
  cornerScale: 0.025,
  maxFontScale: 0.075,
  minFontScale: 0.025,
  lineNumbers: false,
  chrome: "none",
  panelOpacity: 1,
  borderColor: "#ffffff",
  borderOpacity: 0.12,
};
