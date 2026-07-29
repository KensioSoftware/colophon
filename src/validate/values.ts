import { themeNames } from "../theme/index.js";
import { isRecord } from "./check.js";
import { slugStrategies } from "./keys.js";
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

/**
 * Check a theme names one of the curated set.
 *
 * A theme that does not exist is nothing at all: the config resolves as though
 * it had never been named and the images come out in the neutral default
 * palette. Every unknown value here is worth reporting, but this one more than
 * most, because a theme is the one field whose whole purpose is to be the
 * look.
 */
export function checkTheme(theme: unknown, problems: string[]): void {
  // Widened on the way in: the names are typed as the union everywhere else,
  // and what is being checked here is a string that may well not be one.
  const known: readonly string[] = themeNames;

  if (typeof theme !== "string" || known.includes(theme)) {
    return;
  }

  problems.push(describeUnknownValue("theme", "themes", theme, known));
}
