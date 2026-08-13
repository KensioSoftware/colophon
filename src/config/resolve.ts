import type {
  Background,
  BrandColors,
  CodeStyle,
  FontSource,
  OutputSize,
} from "../types.js";
import { resolveImageSource } from "../image/index.js";
import {
  DEFAULT_CODE_STYLE,
  DEFAULT_COLORS,
  DEFAULT_COMPRESSION_LEVEL,
  DEFAULT_SIZES,
} from "./defaults.js";

/**
 * Fill in the palette a project did not name.
 *
 * When a project supplies only `brand`, use it for the whole gradient rather
 * than mixing in the neutral defaults, which would clash.
 */
export function resolveColors(
  colors: BrandColors | undefined,
): Required<BrandColors> {
  if (colors === undefined) {
    return DEFAULT_COLORS;
  }

  return {
    brand: colors.brand,
    brandDark: colors.brandDark ?? colors.brand,
    brandWarm: colors.brandWarm ?? colors.brand,
    foreground: colors.foreground ?? DEFAULT_COLORS.foreground,
  };
}

/**
 * Check a background's image up front, the way `fonts` and `logo` are checked.
 * A background that cannot be read is every image in the build rendered as a
 * flat colour, which is a failure worth hearing about before the build runs
 * rather than after looking at the output.
 */
export function resolveBackground(
  background: Background | undefined,
): Background | undefined {
  if (background?.type !== "image") {
    return background;
  }

  return {
    ...background,
    source: resolveImageSource(background.source, "background.source"),
  };
}

/** The gradient a config with no background of its own is drawn on. */
export function defaultBackground(colors: Required<BrandColors>): Background {
  return {
    type: "gradient",
    stops: [
      { offset: "0%", color: colors.brandDark },
      { offset: "55%", color: colors.brand },
      { offset: "100%", color: colors.brandWarm },
    ],
  };
}

/** Fill in the `code` styling a project did not name. */
export function resolveCode(code: CodeStyle | undefined): Required<CodeStyle> {
  return { ...DEFAULT_CODE_STYLE, ...code };
}

/**
 * The sizes to render, rejecting a duplicate name: each size names a file, so
 * two sizes sharing a name would have one overwrite the other.
 */
export function resolveSizes(
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
 * How hard to compress the rendered PNG, checked here rather than in
 * `validate/`, which checks keys and the names of closed sets.
 *
 * Out of range is rejected rather than clamped: zlib takes 0 to 9 and nothing
 * else, so a config asking for 10 has a number in mind that this cannot give it,
 * and quietly rendering at 9 would leave someone believing they had asked for
 * more than they had.
 */
export function resolveCompressionLevel(level: number | undefined): number {
  if (level === undefined) {
    return DEFAULT_COMPRESSION_LEVEL;
  }

  if (!Number.isSafeInteger(level) || level < 0 || level > 9) {
    throw new Error(
      `Invalid compressionLevel ${String(level)}; expected a whole number from` +
        ` 0 (write the rasteriser's own bytes) to 9 (compress hardest).`,
    );
  }

  return level;
}

/**
 * Whether to load the machine's own fonts. Configured fonts are meant to make
 * the output the same everywhere, so supplying any turns system fonts off
 * unless the project asks for them back.
 *
 * A project that configures none still gets them, even though the package now
 * bundles fonts of its own. What the bundled ones give is a Latin face that is
 * the same everywhere, and they cover nothing else: a Japanese or Arabic title
 * on a project that has configured no fonts has only the machine's own to be
 * drawn in, and turning them off by default would render it as nothing at all.
 * So the rule is unchanged and the bundled fonts sit in front of the system
 * ones rather than in place of them.
 *
 * `systemFonts: false` with no fonts configured used to be an error, on the
 * grounds that it left nothing to render with. The bundled fonts are what it
 * leaves now, and that pairing is the whole way to ask for a build that does
 * not depend on the machine without supplying font files, so it is allowed.
 */
export function shouldLoadSystemFonts(
  systemFonts: boolean | undefined,
  fonts: readonly FontSource[],
): boolean {
  return systemFonts ?? fonts.length === 0;
}
