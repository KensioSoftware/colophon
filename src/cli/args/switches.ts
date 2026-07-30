import { nearestName } from "../../validate/suggest.js";
import { valueFlags } from "./values.js";

/** The flags that carry no value, each of which sets one boolean. */
export interface Switches {
  readonly overwrite: boolean;
  readonly dryRun: boolean;
  readonly watch: boolean;
}

/** `--overwrite` is kept as an alias so existing build scripts keep working. */
const forceFlags = ["-f", "--force", "-o", "--overwrite"];
const dryRunFlags = ["-n", "--dry-run"];
const watchFlags = ["-w", "--watch"];
const helpFlags = ["-h", "--help"];

const knownFlags = new Set([
  ...forceFlags,
  ...dryRunFlags,
  ...watchFlags,
  ...helpFlags,
  ...valueFlags,
]);

/**
 * Reject an option the CLI does not have, suggesting what it looks like.
 *
 * Ignoring it silently is worse than it sounds: `--dry-runs` would then render
 * and write a whole tree, which is the one thing the run was asking it not to
 * do. The suggestion comes from the same edit distance the config validation
 * uses, since a mistyped flag is the same slip as a mistyped option.
 */
export function assertKnownFlag(flag: string): void {
  if (knownFlags.has(flag)) {
    return;
  }

  const suggestion = nearestName(flag, [...knownFlags]);
  const advice =
    suggestion === undefined
      ? "Run colophon --help for the options."
      : `Did you mean "${suggestion}"?`;

  throw new Error(`Unknown option "${flag}". ${advice}`);
}

/** Read the switches out of the flags a command line carried. */
export function switchesFrom(flags: ReadonlySet<string>): Switches {
  const hasAnyOf = (group: readonly string[]): boolean =>
    group.some((flag) => flags.has(flag));

  return {
    overwrite: hasAnyOf(forceFlags),
    dryRun: hasAnyOf(dryRunFlags),
    watch: hasAnyOf(watchFlags),
  };
}
