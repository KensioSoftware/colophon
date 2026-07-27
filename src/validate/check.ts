import { describeUnknownOption } from "./suggest.js";

/** Whether a value is a plain object, and so has keys worth checking. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Whether a value is a list, and so has entries worth checking. */
export function isList(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

/**
 * Report every key of one config object that is not a known option. Anything
 * that is not an object is left alone: the shape of a value is the type
 * checker's business, and there are no keys to judge either way.
 */
export function checkKeys(
  value: unknown,
  path: string,
  known: readonly string[],
  problems: string[],
): void {
  if (!isRecord(value)) {
    return;
  }

  for (const key of Object.keys(value)) {
    if (!known.includes(key)) {
      problems.push(
        describeUnknownOption(path === "" ? key : `${path}.${key}`, key, known),
      );
    }
  }
}

/** Check every entry of a list, naming each by its index. */
export function checkEach(
  values: unknown,
  path: string,
  known: readonly string[],
  problems: string[],
): void {
  if (!isList(values)) {
    return;
  }

  for (const [index, value] of values.entries()) {
    checkKeys(value, `${path}[${String(index)}]`, known, problems);
  }
}
