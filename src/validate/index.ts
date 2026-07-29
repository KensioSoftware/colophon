import type { ColophonConfig } from "../types.js";
import { collectProblems } from "./collect.js";

/**
 * Reject a config carrying options Colophon does not know.
 *
 * An unrecognised key is otherwise ignored in silence: the build succeeds, the
 * option does nothing, and the images come out with the defaults in its place.
 * That is at its worst across an upgrade, where a config that still reads
 * correctly is describing images nobody is rendering.
 *
 * Only the closed parts of the config are checked. The names in `templates`
 * are the project's own, and a post's props are open by design, so a template
 * reads whatever fields it understands.
 */
export function validateConfig(config: ColophonConfig): void {
  const problems = collectProblems(config);
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
