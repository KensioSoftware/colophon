import type { ColophonConfig } from "../types.js";
import { checkBackground } from "./background.js";
import { checkEach, checkKeys } from "./check.js";
import {
  badgeKeys,
  codeKeys,
  colorKeys,
  configKeys,
  contentKeys,
  fontKeys,
  imageSourceKeys,
} from "./keys.js";
import { checkExtras, checkSizes } from "./overrides.js";
import { checkPlacement } from "./placement.js";
import { checkTexture } from "./texture.js";
import { checkSlugStrategy, checkTheme } from "./values.js";

/**
 * Everything wrong with a config, in the order the config declares it.
 *
 * Collecting rather than throwing at the first problem is the point: a config
 * with three typos in it should take one run to fix rather than three.
 */
export function collectProblems(config: ColophonConfig): string[] {
  // The types say what should be here; validation exists for when it is not.
  const raw = config as {
    readonly theme?: unknown;
    readonly colors?: unknown;
    readonly content?: unknown;
    readonly background?: unknown;
    readonly texture?: unknown;
    readonly badge?: unknown;
    readonly logo?: unknown;
    readonly code?: unknown;
    readonly sizes?: unknown;
    readonly fonts?: unknown;
    readonly extra?: unknown;
    readonly placement?: unknown;
  };
  const problems: string[] = [];

  checkKeys(config, "", configKeys, problems);
  checkKeys(raw.colors, "colors", colorKeys, problems);
  checkKeys(raw.badge, "badge", badgeKeys, problems);
  checkKeys(raw.logo, "logo", imageSourceKeys, problems);
  checkKeys(raw.code, "code", codeKeys, problems);
  checkKeys(raw.content, "content", contentKeys, problems);
  checkSlugStrategy(raw.content, problems);
  checkSizes(raw.sizes, problems);
  checkExtras(raw.extra, problems);
  checkEach(raw.fonts, "fonts", fontKeys, problems);
  checkTheme(raw.theme, problems);
  checkBackground(raw.background, "background", problems);
  checkTexture(raw.texture, "texture", problems);
  checkPlacement(raw.placement, problems);

  return problems;
}
