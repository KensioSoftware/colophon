/** The options whose value is the argument after them. */
export interface FlagValues {
  readonly configPath?: string;
  readonly concurrency?: number;
  readonly size?: string;
}

/** Flags that take the next argument as their value. */
export const valueFlags = new Set([
  "-c",
  "--config",
  "--concurrency",
  "--size",
]);

/**
 * A mistyped count would otherwise reach `generate` as `NaN` and be reported
 * without naming the flag it came from, so it is rejected here instead.
 */
function parseConcurrency(value: string): number {
  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(
      `Invalid value for --concurrency: "${value}"; expected a positive integer.`,
    );
  }

  return parsed;
}

/** The one field a value flag sets, ready to be folded into the rest. */
export function valueOf(flag: string, value: string): FlagValues {
  if (flag === "--concurrency") {
    return { concurrency: parseConcurrency(value) };
  }

  if (flag === "--size") {
    return { size: value };
  }

  return { configPath: value };
}
