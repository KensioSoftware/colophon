import type { Font } from "fontkit";
import { create } from "fontkit";

import { readFileBytes } from "../platform/read-file.node.js";
import type { FontSource, WarningHandler } from "../types.js";

/**
 * One face loaded for measurement: the font itself, plus the family and weight
 * it declares. Both are read from the file rather than from config, for the
 * reason {@link FontSource} gives: the file is what the rasteriser matches on.
 */
export interface Face {
  readonly family: string;
  readonly weight: number;
  readonly font: Font;
}

/**
 * Parsed faces, keyed by the font file's path. A build renders many images
 * from one config, so without this every image would parse every font again.
 */
const byPath = new Map<string, Promise<readonly Face[]>>();

/**
 * The same for fonts supplied as bytes, keyed by the array itself. A config
 * holds one of these and hands it to every render, so identity is enough here
 * and hashing the bytes would cost more than the parse it saves.
 */
const byData = new WeakMap<Uint8Array, Promise<readonly Face[]>>();

/**
 * The family a face belongs to, as the rasteriser understands it.
 *
 * A font file carries two family names. The old one, name ID 1, has to put
 * every cut beyond regular and bold in a family of its own, because that is
 * all the four-slot model of the original format could express; the
 * typographic family, name ID 16, is the one that was added to say what the
 * file actually belongs to. Google's static cuts use both, so
 * `Outfit_800ExtraBold.ttf` is `Outfit ExtraBold` under the old name and
 * `Outfit` under the new one.
 *
 * resvg matches on the typographic family, so `font-family="Outfit"` at weight
 * 800 finds that file. fontkit's `familyName` is the old one, so taking it
 * here meant `selectFace` never matched anything but the regular cut: a bold
 * title was drawn in `Outfit ExtraBold` and measured in `Outfit` Regular,
 * which is narrower, so the line was under-measured and ran past the margin.
 * Preferring name ID 16 is what makes the two agree.
 *
 * Everything is read defensively because a font file is data. The types say
 * these are always there, and a file missing its name or its `OS/2` table
 * would otherwise take the build down inside `selectFace` rather than being
 * measured as well as it can be. A face with no family name matches no stack,
 * so it is only ever reached as the fallback the first configured font is.
 */
function toFace(font: Font): Face {
  const declared = font as {
    readonly familyName?: string;
    readonly name?: {
      readonly records?: {
        readonly preferredFamily?: Readonly<Record<string, string>> | string;
      };
    };
    // The table is named by the format, not by us.
    readonly "OS/2"?: { readonly usWeightClass?: number };
  };
  const preferred = declared.name?.records?.preferredFamily;
  // Name records are keyed by language, and fontkit hands back either the map
  // or a bare string depending on the file. English is what a stack is written
  // in, and the first entry is the best guess for a file that has no English.
  const typographic =
    typeof preferred === "string"
      ? preferred
      : (preferred?.["en"] ?? Object.values(preferred ?? {})[0]);

  return {
    family: typographic ?? declared.familyName ?? "",
    weight: declared["OS/2"]?.usWeightClass ?? 400,
    font,
  };
}

/** A collection file holds several faces; a plain font file holds one. */
function facesOf(loaded: Font | { readonly fonts: Font[] }): readonly Face[] {
  return "fonts" in loaded
    ? loaded.fonts.map((font) => toFace(font))
    : [toFace(loaded)];
}

/**
 * Parse one configured font for measurement, or report that it could not be.
 *
 * A file the rasteriser accepts and this cannot is rare, but it is not fatal:
 * the image still renders, and its text is laid out from estimates instead. It
 * is worth saying so, because wrapping that is quietly approximate is exactly
 * what supplying a font file was meant to stop. The warning goes through the
 * cache below, so a build says it once per file rather than once per image.
 */
async function load(
  font: FontSource,
  onWarning: WarningHandler,
): Promise<readonly Face[]> {
  try {
    // `fontkit.open` reads the path itself, which would be a second way into
    // the filesystem. Reading the bytes first leaves one.
    const bytes = "data" in font ? font.data : await readFileBytes(font.path);

    // A plain `Uint8Array`, not a `Buffer`: fontkit reads either, and `Buffer`
    // is Node's, which this has to run without.
    return facesOf(create(bytes as Parameters<typeof create>[0]));
  } catch (error) {
    const name = "data" in font ? (font.family ?? "font data") : font.path;
    const reason = error instanceof Error ? error.message : String(error);
    onWarning(
      `could not read ${name} for text measurement, so text drawn in it is` +
        ` wrapped from estimates instead: ${reason}`,
    );
    return [];
  }
}

function cached(
  font: FontSource,
  onWarning: WarningHandler,
): Promise<readonly Face[]> {
  if ("data" in font) {
    const pending = byData.get(font.data) ?? load(font, onWarning);
    byData.set(font.data, pending);
    return pending;
  }

  const pending = byPath.get(font.path) ?? load(font, onWarning);
  byPath.set(font.path, pending);
  return pending;
}

/** Every face the configured fonts hold, in the order they were configured. */
export async function loadFaces(
  fonts: readonly FontSource[],
  onWarning: WarningHandler,
): Promise<readonly Face[]> {
  const loaded = await Promise.all(
    fonts.map(async (font) => cached(font, onWarning)),
  );

  return loaded.flat();
}
