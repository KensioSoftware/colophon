/** What the CLI has been asked to do. */
export type CliCommand = "generate" | "init" | "preview";

/**
 * The commands that are named on the command line. `generate` is not among
 * them because it is what a run with no command does.
 */
const named: Readonly<Record<string, CliCommand>> = {
  init: "init",
  preview: "preview",
};

/**
 * Read the command out of the first argument.
 *
 * It is a command only where it names one: `colophon content` has always meant
 * "build this tree", so a bare positional stays the content directory, and a
 * subcommand is an addition to that rather than a replacement for it. The cost
 * is that a content directory called `init` or `preview` has to be written as
 * `./init`, which is worth saying in the help text and no more.
 */
export function commandOf(first: string | undefined): CliCommand {
  return (first === undefined ? undefined : named[first]) ?? "generate";
}
