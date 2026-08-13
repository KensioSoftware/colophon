import { bundledFonts } from "../platform/bundled-fonts.node.js";
import type { FontSource } from "../types.js";

/**
 * One font that ships with the package: always a file, and always with its
 * family declared. Narrower than {@link FontSource} because both of those are
 * true of every one of them, and a caller that has to prove a `path` is there
 * before reading it would be proving something this module already knows.
 */
export type BundledFont = Extract<FontSource, { readonly path: string }> & {
  readonly family: string;
};

export { bundledFonts } from "../platform/bundled-fonts.node.js";

/**
 * The fonts a build actually renders with: the project's own, and the ones
 * that ship with the package behind them.
 *
 * The bundled fonts go last so that a project supplying its own is never
 * argued with. Two things read the order and both keep the behaviour they had:
 * `fallbackFamily` takes the first declared family, and the bundled fonts
 * declare none, so a project's own font is still what resvg falls back to;
 * and `faceFor` measures against the first face when system fonts are off,
 * which is still the project's own where there is one and Outfit where there
 * is not.
 *
 * This is deliberately not folded into `ResolvedConfig.fonts`. That field
 * means what the project supplied, which is what makes it worth showing in an
 * error message, and three things read it on that understanding: the rebuild
 * stamp hashes it, `shouldLoadSystemFonts` counts it, and `fontFamily` takes
 * its default from it. The bundled fonts change only when the package version
 * does, and the version is in the stamp already.
 *
 * A custom {@link Rasteriser} that resolves font files itself wants this
 * rather than `config.fonts`, or it will draw without the fonts the measurer
 * measured with.
 */
export function withBundledFonts(
  fonts: readonly FontSource[],
): readonly FontSource[] {
  return [...fonts, ...bundledFonts()];
}
