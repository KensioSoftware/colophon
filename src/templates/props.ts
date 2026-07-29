/**
 * Read a prop as a string, coercing the scalar types YAML frontmatter yields
 * (numbers, booleans) and returning `undefined` for anything else, since
 * templates treat "not a usable string" and "absent" the same way.
 */
export function optionalString(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }

  return undefined;
}
