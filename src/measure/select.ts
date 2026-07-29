import type { Face } from "./faces.js";

/**
 * The families named by a CSS-style stack, in order and unquoted, so that
 * `'"JetBrains Mono", Menlo, monospace'` becomes three names to try.
 */
export function familyNames(stack: string): readonly string[] {
  return stack
    .split(",")
    .map((name) =>
      name
        .trim()
        .replaceAll(/^["']|["']$/g, "")
        .trim(),
    )
    .filter((name) => name !== "");
}

/** Faces belonging to one family, matched as the rasteriser matches them. */
function inFamily(faces: readonly Face[], family: string): readonly Face[] {
  const wanted = family.toLowerCase();
  return faces.filter((face) => face.family.toLowerCase() === wanted);
}

/**
 * The face nearest the requested weight. A family supplying only a regular cut
 * is drawn in that cut by the rasteriser rather than being emboldened, so
 * measuring the nearest weight is measuring what will actually appear.
 */
function nearestWeight(
  faces: readonly [Face, ...Face[]],
  weight: number,
): Face {
  let best = faces[0];

  for (const face of faces) {
    if (Math.abs(face.weight - weight) < Math.abs(best.weight - weight)) {
      best = face;
    }
  }

  return best;
}

/**
 * The face a style resolves to, or `undefined` when the stack names nothing
 * that was loaded. Families are tried in the order the stack lists them, which
 * is what a stack means.
 */
export function selectFace(
  faces: readonly Face[],
  stack: string,
  weight: number,
): Face | undefined {
  for (const family of familyNames(stack)) {
    const [first, ...rest] = inFamily(faces, family);

    if (first !== undefined) {
      return nearestWeight([first, ...rest], weight);
    }
  }

  return undefined;
}
