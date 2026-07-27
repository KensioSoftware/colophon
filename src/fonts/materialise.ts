import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { FontSource } from "../types.js";

/**
 * Directory in-memory fonts are written to. The rasteriser takes file paths
 * only, so a font supplied as bytes has to land on disk somewhere; the temp
 * directory keeps it out of the user's project.
 */
const materialisedDir = path.join(os.tmpdir(), "colophon-fonts");

/**
 * In-flight and completed writes of in-memory fonts, keyed by content hash.
 * A build renders many images from one config, so the same bytes would
 * otherwise be written once per image.
 */
const materialised = new Map<string, Promise<string>>();

/**
 * Write font bytes to a temp file and return its path, reusing the file for
 * identical bytes. The name is the content hash, so a rebuild reuses whatever
 * an earlier run left behind and nothing has to be cleaned up.
 */
async function materialise(data: Uint8Array): Promise<string> {
  const hash = createHash("sha256").update(data).digest("hex").slice(0, 32);
  const pending = materialised.get(hash);

  if (pending !== undefined) {
    return pending;
  }

  const write = (async (): Promise<string> => {
    const file = path.join(materialisedDir, `${hash}.font`);

    if (!existsSync(file)) {
      await mkdir(materialisedDir, { recursive: true });
      await writeFile(file, data);
    }

    return file;
  })();

  materialised.set(hash, write);
  return write;
}

/**
 * File paths for the configured fonts, in order, writing any supplied as
 * bytes to a temp file first.
 */
export async function fontFilePaths(
  fonts: readonly FontSource[],
): Promise<string[]> {
  return Promise.all(
    fonts.map(async (font) =>
      "data" in font ? materialise(font.data) : font.path,
    ),
  );
}
