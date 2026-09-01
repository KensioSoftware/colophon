/** What the CLI has been asked to do. */
export type CliCommand =
  | "generate"
  | "init"
  | "preview"
  | "playground"
  | "eject";

/**
 * The commands that are named on the command line. `generate` is not among
 * them because it is what a run with no command does.
 */
const named: Readonly<Record<string, CliCommand>> = {
  init: "init",
  preview: "preview",
  playground: "playground",
  eject: "eject",
};

/**
 * Read the command out of the first argument.
 *
 * It is a command only where it names one: `colophon content` has always meant
 * "build this tree", so a bare positional stays the content directory, and a
 * subcommand is an addition to that rather than a replacement for it. The cost
 * is that a content directory named after any command has to be written with
 * a relative path such as `./init`. The help text says so.
 */
export function commandOf(first: string | undefined): CliCommand {
  return (first === undefined ? undefined : named[first]) ?? "generate";
}
