import { existsSync, statSync } from "node:fs";
import path from "node:path";

import type { FontSource } from "../types.js";

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
