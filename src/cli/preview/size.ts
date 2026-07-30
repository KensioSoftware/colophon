import type { OutputSize } from "../../types.js";

/**
 * Which size to preview: the one `--size` names, or the first configured one,
 * which is what an `extra` image already defaults to.
 */
export function pickSize(
  sizes: readonly OutputSize[],
  name: string | undefined,
): OutputSize {
  const names = sizes.map((size) => size.name);
  const wanted = sizes.find((size) => size.name === (name ?? names[0]));

  if (wanted === undefined) {
    throw new Error(
      `Unknown size "${String(name)}". Configured sizes: ${names.join(", ")}.`,
    );
  }

  return wanted;
}
