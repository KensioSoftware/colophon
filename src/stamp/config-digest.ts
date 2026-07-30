import { readFile } from "node:fs/promises";

import type {
  Background,
  FontSource,
  ImageSource,
  ResolvedConfig,
} from "../types.js";
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
 * Digest an image by its contents, for the reason a font is digested that way:
 * a logo replaced at the same path is a different logo, and every image drawn
 * with it wants rendering again.
 */
async function imageDigest(source: ImageSource): Promise<string> {
  return sha256("data" in source ? source.data : await readFile(source.path));
}

/**
 * A background, with any image it draws replaced by a digest of that image's
 * bytes. Everything else about a background is already a value.
 */
async function backgroundDigest(background: Background): Promise<unknown> {
  return background.type === "image"
    ? { ...background, source: await imageDigest(background.source) }
    : background;
}

/**
 * Digest the config fields that affect what an image looks like.
 *
 * `onWarning` is left out because it cannot change a pixel. So are `sizes` and
 * `templates`: the one size and the one template an image actually uses go into
 * its own stamp, so adding a third size or an unrelated custom template does
 * not invalidate everything already on disk.
 *
 * The rasteriser is in, by its source, since swapping the backend is one of the
 * few config changes that alters every pixel of every image. It is hashed the
 * way a custom template is, with the same gap: source text cannot see a value
 * the function closed over, so a rasteriser configured by something outside
 * itself needs `--force`. For the default it adds nothing the package version
 * was not already saying, which is why there is no special case for it.
 */
export async function configDigest(config: ResolvedConfig): Promise<string> {
  const fonts = await Promise.all(
    config.fonts.map(async (font) => fontDigest(font)),
  );
  const logo =
    config.logo === undefined ? undefined : await imageDigest(config.logo);

  return sha256(
    stableStringify({
      version: await packageVersion(),
      colors: config.colors,
      background: await backgroundDigest(config.background),
      texture: config.texture,
      fonts,
      logo,
      systemFonts: config.systemFonts,
      fontFamily: config.fontFamily,
      footer: config.footer,
      badge: config.badge,
      code: config.code,
      rasteriser: config.rasteriser.toString(),
    }),
  );
}
