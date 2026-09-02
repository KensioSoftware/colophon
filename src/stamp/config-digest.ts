import { readFile } from "node:fs/promises";

import type {
  Background,
  FontSource,
  ImageSource,
  ResolvedConfig,
} from "../types.js";
import { sha256, stableStringify } from "./digest.js";
import { RENDER_DIGEST } from "./render-digest.js";

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
 * `RENDER_DIGEST` goes in ahead of any of them. The package draws with code no
 * project supplies, and a release that changes that code has to re-render what
 * it changed. The package version stood here before it, and moved on every
 * release, including the ones that touched no drawing at all.
 * `test/render-digest.ts` says what goes into the replacement.
 *
 * `onWarning` is left out because it cannot change a pixel. So are `sizes` and
 * `templates`: the one size and the one template an image actually uses go into
 * its own stamp, so adding a third size or an unrelated custom template does
 * not invalidate everything already on disk.
 *
 * `compressionLevel` is in even though it cannot change a pixel, which is the
 * rule `onWarning` is left out under. What it changes is every byte of every
 * file, and a project turning it up wants the images it already has rewritten:
 * without this the setting would appear to do nothing until each post next
 * changed, which is the sort of gap that gets reported as a bug.
 *
 * `quantise` is in for a stronger version of that reason again, since it does
 * change the pixels, and a project turning it off wants its gradients back
 * rather than only on the posts it happens to edit next.
 *
 * `format`, `quality` and `maxBytes` are in for the same reason, and `emitSvg`
 * for a version of it: turning it on has to write the documents for images that
 * are already on disk, and without this it would write them only for the posts
 * that happened to change next.
 *
 * The rasteriser is in, by its source, since swapping the backend is one of the
 * few config changes that alters every pixel of every image. It is hashed the
 * way a custom template is, with the same gap: source text cannot see a value
 * the function closed over, so a rasteriser configured by something outside
 * itself needs `--force`. `RENDER_DIGEST` already covers the default, down to
 * the version of resvg the package was built against, and there is no special
 * case for it here.
 */
export async function configDigest(config: ResolvedConfig): Promise<string> {
  const fonts = await Promise.all(
    config.fonts.map(async (font) => fontDigest(font)),
  );
  const logo =
    config.logo === undefined ? undefined : await imageDigest(config.logo);

  return sha256(
    stableStringify({
      renderDigest: RENDER_DIGEST,
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
      compressionLevel: config.compressionLevel,
      quantise: config.quantise,
      format: config.format,
      quality: config.quality,
      maxBytes: config.maxBytes,
      emitSvg: config.emitSvg,
    }),
  );
}
