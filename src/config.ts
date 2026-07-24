import { builtinTemplates } from "./templates/index.js";
import type {
  Background,
  BrandColors,
  ColophonConfig,
  Dimensions,
  ResolvedConfig,
} from "./types.js";

/** Default output sizes: a 1:1 square plus a 1.91:1 landscape (Open Graph). */
export const DEFAULT_DIMENSIONS: readonly Dimensions[] = [
  { width: 1200, height: 1200 },
  { width: 1200, height: 630 },
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

/**
 * Apply defaults to a user config. Safe to call with no argument.
 */
export function resolveConfig(config: ColophonConfig = {}): ResolvedConfig {
  const colors = resolveColors(config.colors);
  const dimensions =
    config.dimensions && config.dimensions.length > 0
      ? config.dimensions
      : DEFAULT_DIMENSIONS;

  return {
    colors,
    background: config.background ?? defaultBackground(colors),
    fontFamily: config.fontFamily ?? DEFAULT_FONT_FAMILY,
    footer: config.footer,
    badge: config.badge,
    dimensions,
    templates: { ...builtinTemplates, ...config.templates },
  };
}
