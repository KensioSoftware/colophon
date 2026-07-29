import type { BrandColors, ColophonConfig, ThemeName } from "../types.js";
import { THEMES } from "./presets.js";

export { themeNames } from "./presets.js";

/**
 * The palette a theme brings, or `undefined` where there is no theme.
 *
 * It is what a partial override merges over, so that a size asking for one
 * darker shade keeps the rest of the look rather than dropping back to the
 * neutral default palette.
 */
export function themePalette(
  theme: ThemeName | undefined,
): Required<BrandColors> | undefined {
  return theme === undefined ? undefined : THEMES[theme].colors;
}

/**
 * Fill in the fields a theme supplies and the config did not name.
 *
 * A theme is applied by merging rather than by resolving, so that everything
 * downstream sees an ordinary config and nothing else in the package has to
 * know that themes exist. Whatever the config sets wins, field by field: this
 * is `colors`, `background` and `texture` as defaults, not as a look that
 * cannot be argued with.
 *
 * The consequence worth knowing is that a config naming its own `colors`
 * alongside a theme keeps the theme's background as it was written, so the
 * accent colour changes and the picture behind it does not. That follows from
 * the merge, and it is the honest reading of a theme: the background is part
 * of the look rather than something derived from the palette.
 */
export function applyTheme(config: ColophonConfig): ColophonConfig {
  const theme = config.theme === undefined ? undefined : THEMES[config.theme];

  if (theme === undefined) {
    return config;
  }

  return {
    ...config,
    ...(config.colors === undefined && { colors: theme.colors }),
    ...(config.background === undefined && { background: theme.background }),
    ...(config.texture === undefined &&
      theme.texture !== undefined && { texture: theme.texture }),
  };
}
