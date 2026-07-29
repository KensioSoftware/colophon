import type {
  BrandColors,
  ColophonConfig,
  OutputSize,
  ResolvedConfig,
  ThemeName,
} from "../types.js";
import { themePalette } from "../theme/index.js";
import { DEFAULT_COLORS } from "./defaults.js";
import { resolveConfig } from "./index.js";

/**
 * Merge a size's colour overrides onto the config's.
 *
 * A size may name any single shade, so the merge starts from a full palette:
 * the config's, else the theme in force, else the neutral default. Starting
 * from nothing instead would hand `resolveColors` a lone `foreground`, and its
 * rule that a bare `brand` colours the whole gradient would then flatten the
 * default gradient, so a size asking only for darker text would silently lose
 * it. Taking the theme's palette matters for the same reason: without it a
 * size changing one shade of a themed config would drop the other three back
 * to the default indigo.
 */
function mergeColors(
  base: BrandColors | undefined,
  theme: ThemeName | undefined,
  overrides: Partial<BrandColors>,
): BrandColors {
  return { ...(base ?? themePalette(theme) ?? DEFAULT_COLORS), ...overrides };
}

/**
 * Apply a size's own overrides to a config and resolve the result: the config
 * one image is actually rendered with.
 *
 * The overrides are folded into the user config and the whole thing resolved
 * again, rather than patched onto an already-resolved config, so that anything
 * derived stays consistent. A size that overrides `colors.brand` gets the
 * default gradient rebuilt around its brand, exactly as a config setting the
 * same colour at the top level would.
 *
 * `colors` and `code` merge over their config-level counterparts, because both
 * are bags of independent settings and the point of the feature is to change
 * one of them. The rest replace: a `background` is a union whose variants have
 * different keys, so half of one over half of another is not a background at
 * all, and `badge` carries a required `text` that a partial override could not
 * supply.
 *
 * A size's `theme` replaces the config's, and then applies exactly as it would
 * at the top level: as defaults, under anything the config names outright. So
 * a config with its own `background` keeps it whatever theme a size asks for,
 * and a size wanting the whole look of one has the same answer a config does,
 * which is to stop naming the fields it wants the theme to fill in.
 */
export function resolveConfigForSize(
  config: ColophonConfig | undefined,
  size: OutputSize,
): ResolvedConfig {
  const base = config ?? {};

  return resolveConfig({
    ...base,
    ...(size.theme !== undefined && { theme: size.theme }),
    ...(size.colors !== undefined && {
      colors: mergeColors(base.colors, size.theme ?? base.theme, size.colors),
    }),
    ...(size.texture !== undefined && { texture: size.texture }),
    ...(size.code !== undefined && { code: { ...base.code, ...size.code } }),
    ...(size.background !== undefined && { background: size.background }),
    ...(size.fontFamily !== undefined && { fontFamily: size.fontFamily }),
    ...(size.footer !== undefined && { footer: size.footer }),
    ...(size.badge !== undefined && { badge: size.badge }),
    ...(size.logo !== undefined && { logo: size.logo }),
  });
}
