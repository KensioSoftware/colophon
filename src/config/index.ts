import { resolveFonts } from "../fonts/index.js";
import { builtinTemplates } from "../templates/index.js";
import type {
  ColophonConfig,
  ColophonConfigFactory,
  ColophonConfigInput,
  ResolvedConfig,
} from "../types.js";
import { validateConfig } from "../validate/index.js";
import { DEFAULT_FONT_FAMILY } from "./defaults.js";
import {
  defaultBackground,
  resolveCode,
  resolveColors,
  resolveSizes,
  shouldLoadSystemFonts,
} from "./resolve.js";

export {
  DEFAULT_CODE_FONT_FAMILY,
  DEFAULT_CODE_STYLE,
  DEFAULT_COLORS,
  DEFAULT_FONT_FAMILY,
  DEFAULT_SIZES,
  SIZE_PRESETS,
} from "./defaults.js";

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
export function defineConfig(config: ColophonConfig): ColophonConfig;
/**
 * Overload for a config module that computes its config rather than declaring
 * it. The function is typed, not called: this is still just an identity
 * helper, and whoever loads the module is the one who runs it.
 */
export function defineConfig(
  factory: ColophonConfigFactory,
): ColophonConfigFactory;
/**
 * Implementation signature. Two overloads rather than one union parameter, so
 * an object literal is still checked against {@link ColophonConfig} for
 * misspelled keys before it ever reaches `validateConfig`.
 */
export function defineConfig(config: ColophonConfigInput): ColophonConfigInput {
  return config;
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
