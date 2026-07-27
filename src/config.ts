import { resolveFonts } from "./fonts.js";
import { builtinTemplates } from "./templates/index.js";
import { validateConfig } from "./validate.js";
import type {
  Background,
  BrandColors,
  CodeStyle,
  ColophonConfig,
  FontSource,
  OutputSize,
  ResolvedConfig,
} from "./types.js";

/**
 * Named output-size presets covering the common social-image standards. Each
 * `name` becomes the filename suffix (e.g. `my-post-og.png`).
 *
 * - `og` — 1.91:1, the Open Graph standard (`og:image`): Facebook, LinkedIn,
 *   Slack, Discord, WhatsApp, Mastodon, and the usual `twitter:image` reuse.
 * - `square` — 1:1, X/Twitter `summary` card and a universal fallback.
 * - `twitter` — 2:1, X/Twitter `summary_large_image` card.
 * - `pinterest` — 2:3 tall pin.
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
 * Default `code` template styling. `charWidthRatio` and `lineHeight` drive the
 * monospace grid the snippet is laid out on; the font-size bounds are
 * fractions of the image width so they hold at every output size.
 *
 * `minFontScale` of `0.025` is roughly 30px on a 1200px-wide image, which
 * still reads when a feed shows that image at half size. A snippet too long to
 * fit at that size is truncated rather than shrunk, so a long sample loses
 * lines on the shorter landscape formats.
 */
export const DEFAULT_CODE_STYLE: Required<CodeStyle> = {
  theme: "github-dark",
  fontFamily: DEFAULT_CODE_FONT_FAMILY,
  charWidthRatio: 0.6,
  lineHeight: 1.55,
  tabSize: 2,
  cornerScale: 0.025,
  maxFontScale: 0.075,
  minFontScale: 0.025,
};

/**
 * Default warning handler. Colophon runs at build time, so a compromise the
 * renderer had to make belongs in the build log by default — silence is opt-in
 * via `config.onWarning`.
 */
function warnToConsole(message: string): void {
  // The console is the point: this is the default sink, replaced wholesale by
  // a caller-supplied `onWarning`.
  // eslint-disable-next-line no-console
  console.warn(`colophon: ${message}`);
}

/**
 * Identity helper that returns its argument typed as {@link ColophonConfig}.
 * Use it in a config module to get editor completion and type-checking.
 */
export function defineConfig(config: ColophonConfig): ColophonConfig {
  return config;
}

function resolveColors(colors: BrandColors | undefined): Required<BrandColors> {
  if (colors === undefined) {
    return DEFAULT_COLORS;
  }

  // When a project supplies only `brand`, use it for the whole gradient rather
  // than mixing in the neutral defaults, which would clash.
  return {
    brand: colors.brand,
    brandDark: colors.brandDark ?? colors.brand,
    brandWarm: colors.brandWarm ?? colors.brand,
    foreground: colors.foreground ?? DEFAULT_COLORS.foreground,
  };
}

function defaultBackground(colors: Required<BrandColors>): Background {
  return {
    type: "gradient",
    stops: [
      { offset: "0%", color: colors.brandDark },
      { offset: "55%", color: colors.brand },
      { offset: "100%", color: colors.brandWarm },
    ],
  };
}

function resolveCode(code: CodeStyle | undefined): Required<CodeStyle> {
  return { ...DEFAULT_CODE_STYLE, ...code };
}

function resolveSizes(
  sizes: readonly OutputSize[] | undefined,
): readonly OutputSize[] {
  if (sizes === undefined || sizes.length === 0) {
    return DEFAULT_SIZES;
  }

  const seen = new Set<string>();
  for (const size of sizes) {
    if (seen.has(size.name)) {
      throw new Error(
        `Duplicate output size name "${size.name}"; names must be unique so each image gets a distinct filename.`,
      );
    }
    seen.add(size.name);
  }

  return sizes;
}

/**
 * Whether to load the machine's own fonts. Configured fonts are meant to make
 * the output the same everywhere, so supplying any turns system fonts off
 * unless the project asks for them back.
 */
function shouldLoadSystemFonts(
  systemFonts: boolean | undefined,
  fonts: readonly FontSource[],
): boolean {
  if (systemFonts === undefined) {
    return fonts.length === 0;
  }

  if (!systemFonts && fonts.length === 0) {
    throw new Error(
      "systemFonts is false and no fonts are configured, so no text could be" +
        " rendered. Add fonts, or leave systemFonts unset.",
    );
  }

  return systemFonts;
}

/**
 * Apply defaults to a user config. Safe to call with no argument.
 *
 * Unknown options are rejected before anything is resolved, so a config
 * written against a different version of the package is a build error rather
 * than a set of images quietly rendered with the defaults.
 */
export function resolveConfig(config: ColophonConfig = {}): ResolvedConfig {
  validateConfig(config);

  const colors = resolveColors(config.colors);
  const fonts = resolveFonts(config.fonts);

  return {
    colors,
    background: config.background ?? defaultBackground(colors),
    fonts,
    systemFonts: shouldLoadSystemFonts(config.systemFonts, fonts),
    // A project that supplies one font should not have to name it twice.
    fontFamily: config.fontFamily ?? fonts[0]?.family ?? DEFAULT_FONT_FAMILY,
    footer: config.footer,
    badge: config.badge,
    code: resolveCode(config.code),
    onWarning: config.onWarning ?? warnToConsole,
    sizes: resolveSizes(config.sizes),
    templates: { ...builtinTemplates, ...config.templates },
  };
}

/**
 * Apply a size's own overrides to a config and resolve the result: the config
 * one image is actually rendered with.
 *
 * The overrides are folded into the user config and the whole thing resolved
 * again, rather than patched onto an already-resolved config, so that anything
 * derived stays consistent — a size that overrides `colors.brand` gets the
 * default gradient rebuilt around its brand, exactly as a config setting the
 * same colour at the top level would.
 *
 * `colors` and `code` merge over their config-level counterparts, because both
 * are bags of independent settings and the point of the feature is to change
 * one of them. The rest replace: a `background` is a union whose variants have
 * different keys, so half of one over half of another is not a background at
 * all, and `badge` carries a required `text` that a partial override could not
 * supply.
 */
export function resolveConfigForSize(
  config: ColophonConfig | undefined,
  size: OutputSize,
): ResolvedConfig {
  const base = config ?? {};

  return resolveConfig({
    ...base,
    ...(size.colors !== undefined && {
      colors: { ...base.colors, ...size.colors },
    }),
    ...(size.code !== undefined && { code: { ...base.code, ...size.code } }),
    ...(size.background !== undefined && { background: size.background }),
    ...(size.fontFamily !== undefined && { fontFamily: size.fontFamily }),
    ...(size.footer !== undefined && { footer: size.footer }),
    ...(size.badge !== undefined && { badge: size.badge }),
  });
}
