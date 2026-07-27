import { createHash } from "node:crypto";
import type { FileHandle } from "node:fs/promises";
import { open, readFile } from "node:fs/promises";
import { crc32 } from "node:zlib";

import type {
  FontSource,
  MetaImageProps,
  OutputSize,
  ResolvedConfig,
} from "./types.js";

/**
 * PNG `tEXt` keyword the stamp is stored under. Keeping it in the image means
 * there is no sidecar file to fall out of sync, and deleting an image deletes
 * its stamp with it.
 */
const stampKeyword = "colophon";

/**
 * How much of a PNG to read when looking for a stamp. The stamp goes in
 * immediately after `IHDR`, so this only has to cover the header — reading
 * whole images just to compare a hash would defeat the point of skipping them.
 */
const headBytes = 4096;

const pngSignature = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

/** Signature + the whole `IHDR` chunk: length, type, 13 bytes of data, CRC. */
const afterHeader = pngSignature.length + 4 + 4 + 13 + 4;

function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * `JSON.stringify` with object keys sorted, so that reordering frontmatter
 * without changing it does not look like a change.
 */
function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, raw: unknown) =>
    isRecord(raw)
      ? Object.fromEntries(
          Object.keys(raw)
            .toSorted((a, b) => a.localeCompare(b))
            .map((key) => [key, raw[key]]),
        )
      : raw,
  );
}

/**
 * The installed Colophon version. The built-in templates ship in this package,
 * so an upgrade can change what an image looks like without anything in the
 * project changing; folding the version into the stamp makes that upgrade
 * re-render rather than leave the old images in place.
 */
async function packageVersion(): Promise<string> {
  const manifest = await readFile(
    new URL("../package.json", import.meta.url),
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
async function configDigest(config: ResolvedConfig): Promise<string> {
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

/**
 * Computes stamps for the images rendered from one resolved config.
 */
export interface Stamper {
  /**
   * The stamp for one image: a digest of the props, the config and the size it
   * was rendered from. Equal stamps mean re-rendering would produce the same
   * image.
   */
  stamp(props: MetaImageProps, size: OutputSize): string;
}

/**
 * Build a {@link Stamper} for a resolved config. Asynchronous because it reads
 * the configured font files; do it once per run rather than once per image.
 */
export async function createStamper(config: ResolvedConfig): Promise<Stamper> {
  const base = await configDigest(config);
  const templateDigests = new Map<string, string>();

  // A custom template is config the project controls, so its source counts as
  // part of the input. Built-in templates are covered by the package version.
  // Source text is all there is to go on: a template that reads something its
  // own code does not name — a closed-over value, a file — can change without
  // the stamp noticing, and needs `overwrite` to pick it up.
  const templateDigest = (name: string): string => {
    const cached = templateDigests.get(name);

    if (cached !== undefined) {
      return cached;
    }

    const template = config.templates[name];
    const digest =
      template === undefined ? "" : sha256(template.render.toString());
    templateDigests.set(name, digest);
    return digest;
  };

  return {
    stamp(props, size): string {
      return sha256(
        stableStringify([
          base,
          templateDigest(props.template),
          // The whole size, not just its dimensions: a size carries its own
          // config overrides, and changing one has to re-render that image.
          size,
          props,
        ]),
      );
    },
  };
}

/**
 * A PNG `tEXt` chunk: length, type, `keyword\0text`, CRC over type and data.
 */
function textChunk(keyword: string, text: string): Buffer {
  const data = Buffer.concat([
    Buffer.from(keyword, "latin1"),
    Buffer.from([0]),
    Buffer.from(text, "latin1"),
  ]);
  const chunk = Buffer.alloc(4 + 4 + data.length + 4);

  chunk.writeUInt32BE(data.length, 0);
  chunk.write("tEXt", 4, "latin1");
  data.copy(chunk, 8);
  chunk.writeUInt32BE(
    crc32(chunk.subarray(4, 8 + data.length)),
    8 + data.length,
  );

  return chunk;
}

/**
 * Return `png` with the stamp embedded as a `tEXt` chunk, inserted straight
 * after the header so it can be read back without decoding the image.
 */
export function stampPng(png: Buffer, stamp: string): Buffer {
  if (
    png.length < afterHeader ||
    !png.subarray(0, pngSignature.length).equals(pngSignature) ||
    png.toString("latin1", 12, 16) !== "IHDR"
  ) {
    throw new Error("Cannot stamp: not a PNG image.");
  }

  return Buffer.concat([
    png.subarray(0, afterHeader),
    textChunk(stampKeyword, stamp),
    png.subarray(afterHeader),
  ]);
}

/**
 * Find the stamp in the leading bytes of a PNG, or `undefined` if there is
 * none — the image was written by something else, or by a Colophon that did
 * not stamp yet.
 */
function findStamp(head: Buffer): string | undefined {
  if (!head.subarray(0, pngSignature.length).equals(pngSignature)) {
    return undefined;
  }

  let offset = pngSignature.length;

  while (offset + 8 <= head.length) {
    const length = head.readUInt32BE(offset);
    const type = head.toString("latin1", offset + 4, offset + 8);
    const start = offset + 8;
    const end = start + length;

    // Image data starts here; anything past it is not worth reading for a hash.
    if (type === "IDAT" || type === "IEND" || end > head.length) {
      return undefined;
    }

    if (type === "tEXt") {
      const data = head.subarray(start, end);
      const separator = data.indexOf(0);

      if (
        separator !== -1 &&
        data.toString("latin1", 0, separator) === stampKeyword
      ) {
        return data.toString("latin1", separator + 1);
      }
    }

    offset = end + 4;
  }

  return undefined;
}

/**
 * Read the stamp out of a PNG file. Returns `undefined` when the file is
 * missing, unreadable, not a PNG, or carries no stamp — all of which mean the
 * image cannot be shown to be up to date, so it should be rendered again.
 */
export async function readPngStamp(file: string): Promise<string | undefined> {
  let handle: FileHandle;

  try {
    handle = await open(file, "r");
  } catch {
    return undefined;
  }

  try {
    const buffer = Buffer.alloc(headBytes);
    const { bytesRead } = await handle.read(buffer, 0, headBytes, 0);
    return findStamp(buffer.subarray(0, bytesRead));
  } finally {
    await handle.close();
  }
}
