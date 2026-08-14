import { themeNames } from "../theme/index.js";
import { isRecord } from "./check.js";
import { codeChromeStyles, outputFormats, slugStrategies } from "./keys.js";
import { nearestName } from "./suggest.js";

/**
 * Values that have gone, keyed by the field they were a value of and what to
 * say instead of suggesting a name.
 *
 * The reason `removedOptions` exists, one level down: a removal has nothing to
 * point at, so edit distance answers it with whichever survivor happens to
 * look similar, and "did you mean grid?" is not what somebody who wrote
 * `grain` needs to read.
 */
const removedValues = new Map<string, string>([
  [
    "texture type:grain",
    "per-pixel noise is the one thing PNG cannot compress, and film grain took" +
      " a 1200x1200 image from around 82KB to 1.7MB. Every other treatment is" +
      " a fraction of that; `halftone` is the nearest in look.",
  ],
]);

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
  const removed = removedValues.get(`${noun}:${value}`);

  if (removed !== undefined) {
    return `The ${noun} "${value}" has been removed: ${removed}`;
  }

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
 * Check the window chrome names one of the three there are. A name the
 * template does not know draws the neutral bar, so `macOS` would silently be
 * the wrong window rather than a build that says so.
 */
export function checkCodeChrome(code: unknown, problems: string[]): void {
  if (!isRecord(code)) {
    return;
  }

  const chrome = code["chrome"];

  if (typeof chrome !== "string" || codeChromeStyles.includes(chrome)) {
    return;
  }

  problems.push(
    describeUnknownValue("window chrome", "styles", chrome, codeChromeStyles),
  );
}

/**
 * Check the output format names one the encoder has. `jpg` is the spelling
 * people reach for, and the suggestion is what turns it into `jpeg` rather than
 * into a list to read.
 */
export function checkFormat(format: unknown, problems: string[]): void {
  if (typeof format !== "string" || outputFormats.includes(format)) {
    return;
  }

  problems.push(
    describeUnknownValue("output format", "formats", format, outputFormats),
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
