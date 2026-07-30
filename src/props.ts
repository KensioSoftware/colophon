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

/**
 * Read a prop as a list of strings: a YAML sequence as it stands, and a single
 * value as a list of one.
 *
 * Taking the scalar too is what stops `tags: release` being a post with no
 * tags. Frontmatter is hand-written, the two forms are both ordinary YAML, and
 * a template asking for a list has nothing useful to do with the difference.
 * Entries that are not usable strings are dropped rather than rendered as
 * holes, which is {@link optionalString}'s rule applied item by item.
 */
export function stringList(value: unknown): readonly string[] {
  const items = Array.isArray(value) ? value : [value];

  return items
    .map((item) => optionalString(item))
    .filter((item): item is string => item !== undefined && item !== "");
}
