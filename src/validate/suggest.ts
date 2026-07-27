/**
 * Options that have been renamed, keyed by where the old name turns up.
 * Edit distance cannot connect a rename that changed the word — `dimensions`
 * became `sizes` — and a config carried over from an older version is exactly
 * where a bare "unknown option" helps least.
 */
const renamedOptions = new Map<string, string>([["dimensions", "sizes"]]);

/**
 * Levenshtein distance between two strings, used to work out which option a
 * typo was aiming at. Both strings are option names and the lists are a
 * handful of entries long, so the plain two-row dynamic program is ample.
 */
function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let row = 1; row <= a.length; row += 1) {
    const current = [row];

    for (let column = 1; column <= b.length; column += 1) {
      const cost = a[row - 1] === b[column - 1] ? 0 : 1;
      // Every index here is within the row by construction; the fallbacks are
      // there for `noUncheckedIndexedAccess` rather than for any real case.
      current.push(
        Math.min(
          (previous[column - 1] ?? 0) + cost,
          (previous[column] ?? 0) + 1,
          (current[column - 1] ?? 0) + 1,
        ),
      );
    }

    previous = current;
  }

  return previous[b.length] ?? 0;
}

/**
 * The known name a mistyped one was most likely meant to be, or `undefined`
 * when nothing is close enough. A confident suggestion of something unrelated
 * is worse than none, so the tolerance stays under the length of the name:
 * a slip of a key or two earns a suggestion, a different word does not.
 */
export function nearestName(
  name: string,
  known: readonly string[],
): string | undefined {
  const tolerance = Math.min(
    name.length - 1,
    Math.max(2, Math.ceil(name.length / 4)),
  );
  let nearest: string | undefined;
  let shortest = Infinity;

  for (const candidate of known) {
    // Case-insensitive: `tabsize` for `tabSize` is the same slip as a typo.
    const distance = editDistance(name.toLowerCase(), candidate.toLowerCase());

    if (distance < shortest) {
      nearest = candidate;
      shortest = distance;
    }
  }

  return shortest <= tolerance ? nearest : undefined;
}

/** Report one unknown option, naming the likeliest thing it was meant to be. */
export function describeUnknownOption(
  path: string,
  key: string,
  known: readonly string[],
): string {
  const suggestion = renamedOptions.get(path) ?? nearestName(key, known);

  if (suggestion !== undefined) {
    return `Unknown option "${path}". Did you mean "${suggestion}"?`;
  }

  return `Unknown option "${path}". Valid options here: ${known.join(", ")}.`;
}
