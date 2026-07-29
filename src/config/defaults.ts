import type { BrandColors, CodeStyle, OutputSize } from "../types.js";

/**
 * Named output-size presets covering the common social-image standards. Each
 * `name` becomes the filename suffix (e.g. `my-post-og.png`).
 *
 * - `og`: 1.91:1, the Open Graph standard (`og:image`). Facebook, LinkedIn,
 *   Slack, Discord, WhatsApp, Mastodon, and the usual `twitter:image` reuse.
 * - `square`: 1:1, X/Twitter `summary` card and a universal fallback.
 * - `twitter`: 2:1, X/Twitter `summary_large_image` card.
 * - `pinterest`: 2:3 tall pin.
 */
export const SIZE_PRESETS = {
  og: { name: "og", width: 1200, height: 630 },
  square: { name: "square", width: 1200, height: 1200 },
  twitter: { name: "twitter", width: 1200, height: 600 },
  pinterest: { name: "pinterest", width: 1000, height: 1500 },
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
};
