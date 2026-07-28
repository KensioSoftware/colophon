import { checkKeys, isList, isRecord } from "./check.js";
import { badgeKeys, codeKeys, colorKeys, extraKeys, sizeKeys } from "./keys.js";
import { checkBackground } from "./values.js";

/**
 * Check one output size, and the overrides it carries.
 *
 * A size is the one place the same option names appear twice over, so the paths
 * matter more here than anywhere else: `sizes[1].code.minFontScal` has to say
 * which size it is talking about to be worth reading at all.
 */
function checkSize(size: unknown, path: string, problems: string[]): void {
  checkKeys(size, path, sizeKeys, problems);

  if (!isRecord(size)) {
    return;
  }

  checkKeys(size["colors"], `${path}.colors`, colorKeys, problems);
  checkKeys(size["badge"], `${path}.badge`, badgeKeys, problems);
  checkKeys(size["code"], `${path}.code`, codeKeys, problems);
  checkBackground(size["background"], `${path}.background`, problems);
}

/** Check each output size, and the overrides it carries. */
export function checkSizes(sizes: unknown, problems: string[]): void {
  if (!isList(sizes)) {
    return;
  }

  for (const [index, size] of sizes.entries()) {
    checkSize(size, `sizes[${String(index)}]`, problems);
  }
}

/** Check each extra image, and the size it renders at. */
export function checkExtras(extras: unknown, problems: string[]): void {
  if (!isList(extras)) {
    return;
  }

  for (const [index, extra] of extras.entries()) {
    const path = `extra[${String(index)}]`;
    checkKeys(extra, path, extraKeys, problems);

    if (isRecord(extra)) {
      checkSize(extra["size"], `${path}.size`, problems);
    }
  }
}
