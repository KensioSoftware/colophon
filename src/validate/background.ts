import { checkEach, checkKeys, isRecord } from "./check.js";
import {
  backgroundFits,
  backgroundTypes,
  gradientBackgroundKeys,
  gradientPointKeys,
  gradientStopKeys,
  imageBackgroundKeys,
  imageSourceKeys,
  meshBackgroundKeys,
  meshBlobKeys,
  scrimKeys,
  solidBackgroundKeys,
} from "./keys.js";
import { describeUnknownValue } from "./values.js";

/** Check a background image's fit names one of the two there are. */
function checkFit(fit: unknown, problems: string[]): void {
  if (typeof fit !== "string" || backgroundFits.includes(fit)) {
    return;
  }

  problems.push(
    describeUnknownValue("background fit", "fits", fit, backgroundFits),
  );
}

/**
 * Check a background against the keys of whichever variant it declares.
 *
 * A misspelt `type` is worth reporting on its own: `backgroundSvg` treats
 * anything that is not one of the names it knows as a gradient, so `gradiant`
 * silently becomes one and then falls over on the stops it does not have. A
 * background with no `type` at all is left alone, since the type is what says
 * which keys apply, and guessing would report the keys rather than the
 * omission.
 */
export function checkBackground(
  background: unknown,
  path: string,
  problems: string[],
): void {
  if (!isRecord(background)) {
    return;
  }

  const { type, stops, from, to } = background;

  if (type === "solid") {
    checkKeys(background, path, solidBackgroundKeys, problems);
    return;
  }

  if (type === "image") {
    checkKeys(background, path, imageBackgroundKeys, problems);
    checkKeys(
      background["source"],
      `${path}.source`,
      imageSourceKeys,
      problems,
    );
    checkKeys(background["scrim"], `${path}.scrim`, scrimKeys, problems);
    checkFit(background["fit"], problems);
    return;
  }

  if (type === "mesh") {
    checkKeys(background, path, meshBackgroundKeys, problems);
    checkEach(background["blobs"], `${path}.blobs`, meshBlobKeys, problems);
    return;
  }

  if (type === "gradient") {
    checkKeys(background, path, gradientBackgroundKeys, problems);
    checkEach(stops, `${path}.stops`, gradientStopKeys, problems);
    checkKeys(from, `${path}.from`, gradientPointKeys, problems);
    checkKeys(to, `${path}.to`, gradientPointKeys, problems);
    return;
  }

  if (typeof type === "string") {
    problems.push(
      describeUnknownValue("background type", "types", type, backgroundTypes),
    );
  }
}
