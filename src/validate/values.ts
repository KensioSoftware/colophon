import { checkEach, checkKeys, isRecord } from "./check.js";
import {
  backgroundTypes,
  gradientBackgroundKeys,
  gradientPointKeys,
  backgroundFits,
  gradientStopKeys,
  imageBackgroundKeys,
  imageSourceKeys,
  scrimKeys,
  slugStrategies,
  solidBackgroundKeys,
} from "./keys.js";
import { nearestName } from "./suggest.js";

/**
 * Report a value that is not one of the names a field accepts. `noun` names
 * the field, `plural` heads the list of what it does accept.
 */
export function describeUnknownValue(
  noun: string,
  plural: string,
  value: string,
  known: readonly string[],
): string {
  const suggestion = nearestName(value, known);

  return suggestion === undefined
    ? `Unknown ${noun} "${value}". Valid ${plural}: ${known.join(", ")}.`
    : `Unknown ${noun} "${value}". Did you mean "${suggestion}"?`;
}

/**
 * Check a background against the keys of whichever variant it declares.
 *
 * A misspelt `type` is worth reporting on its own: `backgroundSvg` treats
 * anything that is not `solid` as a gradient, so `gradiant` silently becomes
 * one and then falls over on the stops it does not have. A background with no
 * `type` at all is left alone, since the type is what says which keys apply,
 * and guessing would report the keys rather than the omission.
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
 * Check the slug strategy names a real one. Only a string can be a strategy;
 * anything else is a shape the type checker already covers, as elsewhere here.
 */
export function checkSlugStrategy(content: unknown, problems: string[]): void {
  if (!isRecord(content)) {
    return;
  }

  const strategy = content["slugStrategy"];

  if (typeof strategy !== "string" || slugStrategies.includes(strategy)) {
    return;
  }

  problems.push(
    describeUnknownValue(
      "slug strategy",
      "strategies",
      strategy,
      slugStrategies,
    ),
  );
}
