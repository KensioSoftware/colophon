import type {
  BrandColors,
  ColophonConfig,
  OutputSize,
  ResolvedConfig,
} from "../types.js";
import { DEFAULT_COLORS } from "./defaults.js";
import { resolveConfig } from "./index.js";

/**
 * Merge a size's colour overrides onto the config's.
 *
 * A size may name any single shade, so the merge starts from the full default
 * palette when the config sets no colours of its own. Starting from nothing
 * instead would hand `resolveColors` a lone `foreground`, and its rule that a
 * bare `brand` colours the whole gradient would then flatten the default
 * gradient, so a size asking only for darker text would silently lose it.
 */
function mergeColors(
  base: BrandColors | undefined,
  overrides: Partial<BrandColors>,
): BrandColors {
  return { ...(base ?? DEFAULT_COLORS), ...overrides };
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
 */
export function resolveConfigForSize(
  config: ColophonConfig | undefined,
  size: OutputSize,
): ResolvedConfig {
  const base = config ?? {};

  return resolveConfig({
    ...base,
    ...(size.colors !== undefined && {
      colors: mergeColors(base.colors, size.colors),
    }),
    ...(size.code !== undefined && { code: { ...base.code, ...size.code } }),
    ...(size.background !== undefined && { background: size.background }),
    ...(size.fontFamily !== undefined && { fontFamily: size.fontFamily }),
    ...(size.footer !== undefined && { footer: size.footer }),
    ...(size.badge !== undefined && { badge: size.badge }),
  });
}
