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
 * 360 and 170, so a dot grid at its default 44px spacing arrives at the reader
 * about 10px apart, which is not a texture any more but a slightly dirty
 * background. Three is the factor for the largest of those, and it is the
 * conservative choice: a treatment that is a little too coarse still reads as
 * a treatment, where one that is too fine reads as nothing at all.
 */
export const DEFAULT_THUMBNAIL_TEXTURE_SCALE = 3;

/**
 * The texture scale everything else is drawn at, which is to say, unchanged.
 */
export const DEFAULT_TEXTURE_SCALE = 1;

/**
 * Named output-size presets covering the common social-image standards. Each
 * `name` becomes the filename suffix (e.g. `my-post-og.png`).
 *
 * - `og`: 1.91:1, the Open Graph standard (`og:image`). Facebook, LinkedIn,
 *   Slack, Discord, WhatsApp, Mastodon, and the usual `twitter:image` reuse.
 * - `square`: 1:1, X/Twitter `summary` card and a universal fallback.
 * - `twitter`: 2:1, X/Twitter `summary_large_image` card.
 * - `pinterest`: 2:3 tall pin.
 * - `thumbnail`: 16:9, the size YouTube asks video thumbnails to be uploaded
 *   at. It is the one preset carrying an override of its own, for the reason
 *   {@link SizeOverrides.textureScale} gives.
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
 * Default font stack, used when no fonts are configured. It names families and
 * hopes the machine has them, which is exactly what `config.fonts` exists to
 * avoid: supply a font file and the output stops depending on the machine.
 */
export const DEFAULT_FONT_FAMILY = "Arial, Helvetica, sans-serif";

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
