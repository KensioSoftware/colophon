import type { CliCommand } from "./command.js";
import { commandOf } from "./command.js";
import { assertKnownFlag, switchesFrom } from "./switches.js";
import type { FlagValues } from "./values.js";
import { valueFlags, valueOf } from "./values.js";

export type { CliCommand } from "./command.js";
export { usage } from "./usage.js";

/**
 * The parsed command line.
 */
export interface CliArgs {
  readonly command: CliCommand;
  /**
   * The content tree to build. `undefined` where the run named none, which
   * `generate` reads as the default and `init` as an invitation to guess.
   */
  readonly contentDir: string | undefined;
  /** The post `preview` renders or `playground` includes. */
  readonly file: string | undefined;
  /** What `eject` writes, naming the generator it is for. */
  readonly adapter: string | undefined;
  readonly configPath: string | undefined;
  readonly overwrite: boolean;
  readonly dryRun: boolean;
  readonly watch: boolean;
  readonly concurrency: number | undefined;
  /** Which configured size `preview` renders or `playground` opens. */
  readonly size: string | undefined;
}

/** Where each command's one positional goes: a path, or a generator's name. */
function target(
  command: CliCommand,
  positionals: readonly string[],
): Pick<CliArgs, "contentDir" | "file" | "adapter"> {
  const extra = positionals[1];

  // Two positionals is a mistake worth naming rather than quietly resolving:
  // taking the last would build a tree the run did not mean to name.
  if (extra !== undefined) {
    throw new Error(`Unexpected argument "${extra}".`);
  }

  const first = positionals[0];
  const empty = { contentDir: undefined, file: undefined, adapter: undefined };

  switch (command) {
    case "preview":
    case "playground": {
      return { ...empty, file: first };
    }
    case "eject": {
      return { ...empty, adapter: first };
    }
    case "generate":
    case "init": {
      return { ...empty, contentDir: first };
    }
  }
}

/**
 * One argument split at its first `=`, so that `--config=x` and `--config x`
 * are the same thing. A path is free to contain an `=` because the split is
 * only believed where the part before it is a flag that takes a value.
 */
function splitInline(arg: string): [string, string | undefined] {
  const at = arg.indexOf("=");

  return at === -1 ? [arg, undefined] : [arg.slice(0, at), arg.slice(at + 1)];
}

/** Read the command line into the options each command takes. */
export function parseCliArgs(argv: readonly string[]): CliArgs {
  const command = commandOf(argv[0]);
  const rest = command === "generate" ? argv : argv.slice(1);

  const positionals: string[] = [];
  const flags = new Set<string>();
  let values: FlagValues = {};

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index] ?? "";
    const [flag, inline] = splitInline(arg);

    if (valueFlags.has(flag)) {
      let value = inline;

      if (value === undefined) {
        index += 1;
        value = rest[index];
      }

      if (value === undefined) {
        throw new Error(`Missing value for ${flag}`);
      }

      values = { ...values, ...valueOf(flag, value) };
    } else if (arg.startsWith("-")) {
      assertKnownFlag(flag);
      flags.add(flag);
    } else {
      positionals.push(arg);
    }
  }

  return {
    command,
    ...target(command, positionals),
    configPath: values.configPath,
    concurrency: values.concurrency,
    size: values.size,
    ...switchesFrom(flags),
  };
}
