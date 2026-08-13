import type { Texture } from "../types.js";
import { checkKeys, isRecord } from "./check.js";
import { textureKeysByType, textureTypes } from "./keys.js";
import { describeUnknownValue } from "./values.js";

/** Whether a declared type is one of the treatments there are. */
function isTextureType(type: unknown): type is Texture["type"] {
  return typeof type === "string" && type in textureKeysByType;
}

/**
 * Check a texture against the keys of whichever treatment it declares.
 *
 * The same reasoning as a background's: a mistyped `type` has to be reported
 * as itself rather than as a list of keys that do not apply. A texture with no
 * `type` is left to the type checker, since without one there is no telling
 * which keys were meant.
 */
export function checkTexture(
  texture: unknown,
  path: string,
  problems: string[],
): void {
  if (!isRecord(texture)) {
    return;
  }

  const { type } = texture;

  if (isTextureType(type)) {
    checkKeys(texture, path, textureKeysByType[type], problems);
    return;
  }

  if (typeof type === "string") {
    problems.push(
      describeUnknownValue("texture type", "types", type, textureTypes),
    );
  }
}
