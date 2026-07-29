/**
 * The parsed command line.
 */
export interface CliArgs {
  readonly contentDir: string;
  readonly configPath: string | undefined;
  readonly overwrite: boolean;
  readonly concurrency: number | undefined;
}

/** Help text for `--help`, and for a run that asks for nothing else. */
export const usage = `colophon — generate social meta images from frontmatter

Usage:
  colophon [contentDir] [options]

Images carry a stamp of the props, config and size they came from, so a rebuild
renders only the ones that have actually changed.

Options:
  -c, --config <path>   Load a config module. Its default export is either a
                        ColophonConfig or a function (async or not) returning
                        one, for a config that has to compute something.
  -f, --force           Re-render every image, ignoring the stamps
  -o, --overwrite       Alias for --force
  --concurrency <n>     How many images to render at once
  -h, --help            Show this help

Defaults:
  contentDir            content
  --concurrency         one per available CPU`;

/** `--overwrite` is kept as an alias so existing build scripts keep working. */
const forceFlags = new Set(["-f", "--force", "-o", "--overwrite"]);

/** Flags that take the next argument as their value. */
const valueFlags = new Set(["-c", "--config", "--concurrency"]);

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

/** Read the command line into the options `generate` takes. */
export function parseCliArgs(argv: readonly string[]): CliArgs {
  let contentDir = "content";
  let configPath: string | undefined;
  let shouldOverwrite = false;
  let concurrency: number | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg !== undefined && valueFlags.has(arg)) {
      index += 1;
      const value = argv[index];
      if (value === undefined) {
        throw new Error(`Missing value for ${arg}`);
      }
      if (arg === "--concurrency") {
        concurrency = parseConcurrency(value);
      } else {
        configPath = value;
      }
    } else if (arg !== undefined && forceFlags.has(arg)) {
      shouldOverwrite = true;
    } else if (arg !== undefined && !arg.startsWith("-")) {
      contentDir = arg;
    }
  }

  return { contentDir, configPath, overwrite: shouldOverwrite, concurrency };
}
