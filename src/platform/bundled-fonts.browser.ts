import type { BundledFont } from "../fonts/bundled.js";

/**
 * The bundled fonts in the browser and at the edge, which is to say none.
 *
 * A bundler picks this up through `package.json`'s `browser` field. The fonts
 * that ship with the package are files, and a file path means nothing here, so
 * offering them would be offering something `readFileBytes` is about to refuse.
 * Inlining the bytes instead would put half a megabyte of font into every
 * bundle that imports the core, whether or not it draws any text.
 *
 * So text in a browser is measured by estimate and drawn in whatever the host
 * has, exactly as it was before there were bundled fonts. A page that wants
 * them supplies them itself, as bytes, which is what `FontSource.data` is for.
 */
export function bundledFonts(): readonly BundledFont[] {
  return [];
}
