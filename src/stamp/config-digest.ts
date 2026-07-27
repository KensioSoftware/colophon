import { readFile } from "node:fs/promises";

import type { FontSource, ResolvedConfig } from "../types.js";
import { sha256, stableStringify } from "./digest.js";

/**
 * The installed Colophon version. The built-in templates ship in this package,
 * so an upgrade can change what an image looks like without anything in the
 * project changing; folding the version into the stamp makes that upgrade
 * re-render rather than leave the old images in place.
 */
async function packageVersion(): Promise<string> {
  const manifest = await readFile(
    new URL("../../package.json", import.meta.url),
    "utf8",
  );
  return (JSON.parse(manifest) as { version: string }).version;
}

/**
 * Digest one configured font by its contents, not its path: replacing the file
 * at the same path changes every image drawn with it.
 */
async function fontDigest(font: FontSource): Promise<string> {
  const bytes = "data" in font ? font.data : await readFile(font.path);
  return sha256(stableStringify({ family: font.family, bytes: sha256(bytes) }));
}

/**
 * Digest the config fields that affect what an image looks like.
 *
 * `onWarning` is left out because it cannot change a pixel. So are `sizes` and
 * `templates`: the one size and the one template an image actually uses go into
 * its own stamp, so adding a third size or an unrelated custom template does
 * not invalidate everything already on disk.
 */
export async function configDigest(config: ResolvedConfig): Promise<string> {
  const fonts = await Promise.all(
    config.fonts.map(async (font) => fontDigest(font)),
  );

  return sha256(
    stableStringify({
      version: await packageVersion(),
      colors: config.colors,
      background: config.background,
      fonts,
      systemFonts: config.systemFonts,
      fontFamily: config.fontFamily,
      footer: config.footer,
      badge: config.badge,
      code: config.code,
    }),
  );
}
