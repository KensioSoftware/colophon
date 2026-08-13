import { fileURLToPath } from "node:url";

import type { BundledFont } from "../fonts/bundled.js";

/**
 * The font files that ship with the package, as absolute paths.
 *
 * Two families, and only the cuts the built-in templates draw: Outfit at 400
 * through 800 for everything that is words, and JetBrains Mono at 400 and 700
 * for the code templates. The whole of either family would be most of a
 * megabyte to install for cuts nothing asks for, and a weight that is not here
 * is drawn in the nearest one that is, by resvg and by `selectFace` alike.
 *
 * Static cuts rather than the variable fonts, because resvg draws a variable
 * font at its default instance and a single file would then be one weight.
 *
 * They are named from `import.meta.url` rather than resolved from the working
 * directory, since the working directory belongs to the project being built
 * and these live wherever the package was installed. Two levels up from
 * `dist/platform/` is the package root.
 */
const files: readonly (readonly [family: string, file: string])[] = [
  ["Outfit", "Outfit_400Regular.ttf"],
  ["Outfit", "Outfit_500Medium.ttf"],
  ["Outfit", "Outfit_600SemiBold.ttf"],
  ["Outfit", "Outfit_700Bold.ttf"],
  ["Outfit", "Outfit_800ExtraBold.ttf"],
  ["JetBrains Mono", "JetBrainsMono_400Regular.ttf"],
  ["JetBrains Mono", "JetBrainsMono_700Bold.ttf"],
];

/**
 * The bundled fonts, in the order they are loaded.
 *
 * The family is declared as well as being in the file, which is a fact written
 * down twice and worth the duplication for one reason: `fallbackFamily` reads
 * declared families and nothing else, and it is what tells resvg which family
 * to draw a stack in when the stack names nothing that was loaded. Without a
 * declared family here, a project setting `fontFamily` to something it has not
 * supplied would have its text measured against Outfit and drawn in whatever
 * resvg falls back to on its own, which is how a layout comes out wrong on one
 * machine and right on another. Nothing else reads these: matching a
 * `font-family` to a file is done from the file's own name table, by the
 * rasteriser and by `measure/faces.ts` alike. `fonts.test.ts` checks the two
 * against each other so they cannot drift.
 */
export function bundledFonts(): readonly BundledFont[] {
  return files.map(([family, file]) => ({
    family,
    path: fileURLToPath(new URL(`../../fonts/${file}`, import.meta.url)),
  }));
}
