import { createHash } from "node:crypto";
import { existsSync, statSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { FontSource } from "./types.js";

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

function label(index: number): string {
  return `fonts[${String(index)}]`;
}

/**
 * Validate one font source and make its path absolute.
 *
 * The rasteriser ignores a font file it cannot read and renders the text in
 * whatever else it has loaded — or, with system fonts off, renders no text at
 * all. A typo in a path would therefore show up as a blank image rather than
 * an error, so the path is checked here instead.
 */
function resolveFont(font: FontSource, index: number): FontSource {
  const source = font as {
    readonly family?: string;
    readonly path?: string;
    readonly data?: Uint8Array;
  };
  const hasPath = source.path !== undefined;
  const hasData = source.data !== undefined;

  if (hasPath && hasData) {
    throw new Error(
      `${label(index)} has both "path" and "data"; give one or the other.`,
    );
  }

  if (source.data !== undefined) {
    if (source.data.byteLength === 0) {
      throw new Error(`${label(index)} has empty font data.`);
    }

    return font;
  }

  if (source.path === undefined || source.path === "") {
    throw new Error(
      `${label(index)} needs a "path" to a font file, or its bytes as "data".`,
    );
  }

  const absolute = path.resolve(source.path);

  if (!existsSync(absolute) || !statSync(absolute).isFile()) {
    throw new Error(
      `${label(index)}: font file not found at ${absolute}` +
        ` (from "${source.path}"). Relative paths resolve from the working directory.`,
    );
  }

  return {
    ...(source.family !== undefined && { family: source.family }),
    path: absolute,
  };
}

/**
 * Validate the configured fonts and make their paths absolute. Safe to call
 * with no fonts, which is the default.
 */
export function resolveFonts(
  fonts: readonly FontSource[] | undefined,
): readonly FontSource[] {
  if (fonts === undefined || fonts.length === 0) {
    return [];
  }

  return fonts.map((font, index) => resolveFont(font, index));
}

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

/**
 * The family the rasteriser should fall back to when a `font-family` names
 * something it has not loaded — the first declared family, so the fallback is
 * the same wherever the build runs rather than whichever font loaded first.
 */
export function fallbackFamily(
  fonts: readonly FontSource[],
): string | undefined {
  return fonts.find((font) => font.family !== undefined)?.family;
}
