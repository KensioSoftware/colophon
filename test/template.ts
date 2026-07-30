/**
 * Rendering one template the way the renderer would, for the tests that are
 * about a layout rather than about a build.
 *
 * `buildSvg` would do this too, and would wrap the result in a document with a
 * background on it. What a template test wants is the foreground on its own,
 * so the assertions can count the elements the template drew.
 */
import path from "node:path";

import { resolveConfig } from "../src/config/index.js";
import { loadImages } from "../src/image/index.js";
import { createMeasurer } from "../src/measure/index.js";
import type {
  ColophonConfig,
  Dimensions,
  MetaImageProps,
  Template,
} from "../src/types.js";

/** The square every template is laid out for first. */
export const square: Dimensions = { width: 1200, height: 1200 };

/** The Open Graph landscape, where the same layout has half the height. */
export const wide: Dimensions = { width: 1200, height: 630 };

/** A real font file, for the tests that need text measured rather than guessed. */
export const sansFont = path.join(
  process.cwd(),
  "node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf",
);

/** A real 1200x630 PNG, so a logo has proportions worth laying out. */
export const samplePng = path.join(
  process.cwd(),
  "docs/samples/card-wide-solid.png",
);

/** Render one template's foreground content. */
export async function renderTemplate(
  template: Template,
  props: MetaImageProps,
  config: ColophonConfig = {},
  dimensions: Dimensions = square,
): Promise<string> {
  const resolved = resolveConfig(config);
  const images = await loadImages(resolved, props);

  return template.render({
    props,
    config: resolved,
    dimensions,
    measure: await createMeasurer(resolved),
    logo: images.logo,
    avatar: images.avatar,
    picture: images.picture,
  });
}

/** The size the first line of text is drawn at. */
export function titleSize(svg: string): number {
  return Number(/font-size="(\d+)"/.exec(svg)?.[1] ?? 0);
}

/** The baseline of the one `<text>` element a pattern matches. */
export function baselineOf(svg: string, pattern: RegExp): number {
  return Number(pattern.exec(svg)?.[1] ?? 0);
}

/** Every `y` a line of text is drawn at, in the order they appear. */
export function baselines(svg: string): readonly number[] {
  return Array.from(svg.matchAll(/<text x="\d+" y="(\d+)"/g), (match) =>
    Number(match[1]),
  );
}
