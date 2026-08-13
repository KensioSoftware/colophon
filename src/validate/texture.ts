import { checkKeys, isRecord } from "./check.js";
import {
  dotsTextureKeys,
  grainTextureKeys,
  moireTextureKeys,
  raysTextureKeys,
  rulesTextureKeys,
  textureTypes,
  wavesTextureKeys,
} from "./keys.js";
import { describeUnknownValue } from "./values.js";

/**
 * Check a texture against the keys of whichever treatment it declares.
 *
 * The same reasoning as a background's: `textureSvg` draws anything it does
 * not recognise as the last variant it checks for, so an unknown `type` would
 * come out as a set of ruled lines nobody asked for. A texture with no `type`
 * is left to the type checker, since without one there is no telling which
 * keys were meant.
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

  if (type === "grain") {
    checkKeys(texture, path, grainTextureKeys, problems);
    return;
  }

  if (type === "dots") {
    checkKeys(texture, path, dotsTextureKeys, problems);
    return;
  }

  if (type === "rules") {
    checkKeys(texture, path, rulesTextureKeys, problems);
    return;
  }

  if (type === "waves") {
    checkKeys(texture, path, wavesTextureKeys, problems);
    return;
  }

  if (type === "rays") {
    checkKeys(texture, path, raysTextureKeys, problems);
    return;
  }

  if (type === "moire") {
    checkKeys(texture, path, moireTextureKeys, problems);
    return;
  }

  if (typeof type === "string") {
    problems.push(
      describeUnknownValue("texture type", "types", type, textureTypes),
    );
  }
}
