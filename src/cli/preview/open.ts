import { spawn } from "node:child_process";

/** The command that hands a file to whatever the desktop opens it with. */
interface Opener {
  readonly command: string;
  readonly args: readonly string[];
}

function opener(): Opener {
  if (process.platform === "darwin") {
    return { command: "open", args: [] };
  }

  if (process.platform === "win32") {
    // `start` takes a window title first, and an empty one keeps a path with
    // spaces in it from being read as the title.
    return { command: "cmd", args: ["/c", "start", ""] };
  }

  return { command: "xdg-open", args: [] };
}

/**
 * Open a file in whatever the desktop uses for it, detached so that the CLI
 * exits rather than waiting for a picture viewer to be closed.
 *
 * A failure is reported and no more. The path has already been printed, and a
 * machine with nothing to open an image with, such as a build server, is not a
 * mistake worth failing the command over.
 */
export function openFile(file: string): void {
  const { command, args } = opener();
  const child = spawn(command, [...args, file], {
    detached: true,
    stdio: "ignore",
  });

  child.on("error", () => {
    console.log(`Could not open ${file}; open it yourself.`);
  });

  child.unref();
}
