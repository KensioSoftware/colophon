import type { Face } from "./faces.js";

/**
 * A stretch of text and the face that will draw it, or no face where nothing
 * loaded covers it and the width has to be estimated.
 */
export interface TextRun {
  readonly text: string;
  readonly face: Face | undefined;
}

/** Advance width of `text` in `face` as the font itself will shape it. */
function shapedWidth(text: string, face: Face): number | undefined {
  try {
    return face.font.layout(text).advanceWidth;
  } catch {
    return undefined;
  }
}

/** Advance width of `text` in `face` from the characters taken one by one. */
function glyphWidth(text: string, face: Face): number | undefined {
  let units = 0;

  try {
    for (const character of text) {
      const point = character.codePointAt(0) ?? 0;
      units += face.font.glyphForCodePoint(point).advanceWidth;
    }
  } catch {
    return undefined;
  }

  return units;
}

/**
 * Advance width of `text` in `face`, as a multiple of the font size, or
 * nothing where the face cannot give one and the width has to be estimated.
 *
 * Shaping the whole string is what accounts for kerning and ligatures, and it
 * is also what can fail: a font file is data, and fontkit reads more of it
 * than an advance needs. JetBrains Mono shapes `--` to a ligature followed by
 * an empty spacer, that spacer is the last glyph in the file, and fontkit
 * reads its bounding box off the end of the outline table and throws. Taking
 * the characters one at a time is the answer when that happens, and it is
 * exact for a monospace face and close for the rest.
 */
export function emWidth(text: string, face: Face): number | undefined {
  const units = shapedWidth(text, face) ?? glyphWidth(text, face);

  return units === undefined ? undefined : units / face.font.unitsPerEm;
}

/**
 * The face that will draw one character: the one the style resolved to, or the
 * first other loaded face holding a glyph for it. This is what the rasteriser
 * does with a missing glyph, and measuring a Japanese title against a Latin
 * face that has none of it would be worse than not measuring at all.
 */
function coveringFace(
  character: string,
  primary: Face | undefined,
  faces: readonly Face[],
): Face | undefined {
  const point = character.codePointAt(0);

  if (point === undefined) {
    return primary;
  }

  if (primary?.font.hasGlyphForCodePoint(point) === true) {
    return primary;
  }

  return faces.find((face) => face.font.hasGlyphForCodePoint(point));
}

/**
 * Split `text` into the longest runs that one face can draw. Text a build has
 * supplied fonts for comes back as a single run, which is the common case.
 */
export function coverageRuns(
  text: string,
  primary: Face | undefined,
  faces: readonly Face[],
): readonly TextRun[] {
  const runs: TextRun[] = [];

  for (const character of text) {
    const face = coveringFace(character, primary, faces);
    const last = runs.at(-1);

    if (last === undefined || last.face !== face) {
      runs.push({ text: character, face });
    } else {
      runs[runs.length - 1] = { text: last.text + character, face };
    }
  }

  return runs;
}
