import type { ColophonConfig } from "../types.js";
import { checkEach, checkKeys } from "./check.js";
import {
  badgeKeys,
  codeKeys,
  colorKeys,
  configKeys,
  contentKeys,
  fontKeys,
} from "./keys.js";
import { checkSizes } from "./sizes.js";
import { checkBackground, checkSlugStrategy } from "./values.js";

/**
 * Reject a config carrying options Colophon does not know.
 *
 * An unrecognised key is otherwise ignored in silence: the build succeeds, the
 * option does nothing, and the images come out with the defaults in its place.
 * That is at its worst across an upgrade, where a config that still reads
 * correctly is describing images nobody is rendering.
 *
 * Only the closed parts of the config are checked. The names in `templates`
 * are the project's own, and a post's props are open by design — a template
 * reads whatever fields it understands.
 */
export function validateConfig(config: ColophonConfig): void {
  // The types say what should be here; validation exists for when it is not.
  const raw = config as {
    readonly colors?: unknown;
    readonly content?: unknown;
    readonly background?: unknown;
    readonly badge?: unknown;
    readonly code?: unknown;
    readonly sizes?: unknown;
    readonly fonts?: unknown;
  };
  const problems: string[] = [];

  checkKeys(config, "", configKeys, problems);
  checkKeys(raw.colors, "colors", colorKeys, problems);
  checkKeys(raw.badge, "badge", badgeKeys, problems);
  checkKeys(raw.code, "code", codeKeys, problems);
  checkKeys(raw.content, "content", contentKeys, problems);
  checkSlugStrategy(raw.content, problems);
  checkSizes(raw.sizes, problems);
  checkEach(raw.fonts, "fonts", fontKeys, problems);
  checkBackground(raw.background, "background", problems);

  const [first, ...rest] = problems;

  if (first === undefined) {
    return;
  }

  throw new Error(
    rest.length === 0
      ? first
      : `Invalid config:\n${problems.map((problem) => `  - ${problem}`).join("\n")}`,
  );
}
