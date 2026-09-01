import type { Background, OutputSize } from "../../types.js";

/** Drop a background image, whose source the browser cannot load. */
export function browserBackground(
  background: Background | undefined,
  label: string,
  omitted: string[],
): Background | undefined {
  if (background?.type === "image") {
    omitted.push(label);
    return undefined;
  }

  return background;
}

/** Drop an image background from one size override. */
export function browserSize(size: OutputSize, omitted: string[]): OutputSize {
  const { background, ...rest } = size;
  const kept = browserBackground(
    background,
    `sizes.${size.name}.background`,
    omitted,
  );

  return { ...rest, ...(kept === undefined ? {} : { background: kept }) };
}
