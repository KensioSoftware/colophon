import { builtinTemplates } from "./templates/index.js";
import type {
  Background,
  BrandColors,
  ColophonConfig,
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

/** Default font stack. Override via `config.fontFamily` for branded fonts. */
export const DEFAULT_FONT_FAMILY = "Arial, Helvetica, sans-serif";

/** Neutral default palette, used when no `colors.brand` is supplied. */
export const DEFAULT_COLORS: Required<BrandColors> = {
  brand: "#4f46e5",
  brandDark: "#3730a3",
  brandWarm: "#db2777",
  foreground: "#ffffff",
};

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
 * Apply defaults to a user config. Safe to call with no argument.
 */
export function resolveConfig(config: ColophonConfig = {}): ResolvedConfig {
  const colors = resolveColors(config.colors);

  return {
    colors,
    background: config.background ?? defaultBackground(colors),
    fontFamily: config.fontFamily ?? DEFAULT_FONT_FAMILY,
    footer: config.footer,
    badge: config.badge,
    sizes: resolveSizes(config.sizes),
    templates: { ...builtinTemplates, ...config.templates },
  };
}
