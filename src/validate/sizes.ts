import { checkKeys, isList, isRecord } from "./check.js";
import { badgeKeys, codeKeys, colorKeys, sizeKeys } from "./keys.js";
import { checkBackground } from "./values.js";

/**
 * Check each output size, and the overrides it carries.
 *
 * A size is the one place the same option names appear twice over, so the paths
 * matter more here than anywhere else: `sizes[1].code.minFontScal` has to say
 * which size it is talking about to be worth reading at all.
 */
export function checkSizes(sizes: unknown, problems: string[]): void {
  if (!isList(sizes)) {
    return;
  }

  for (const [index, size] of sizes.entries()) {
    const path = `sizes[${String(index)}]`;
    checkKeys(size, path, sizeKeys, problems);

    if (!isRecord(size)) {
      continue;
    }

    checkKeys(size["colors"], `${path}.colors`, colorKeys, problems);
    checkKeys(size["badge"], `${path}.badge`, badgeKeys, problems);
    checkKeys(size["code"], `${path}.code`, codeKeys, problems);
    checkBackground(size["background"], `${path}.background`, problems);
  }
}
