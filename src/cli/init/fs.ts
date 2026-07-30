import type { Stats } from "node:fs";
import { stat } from "node:fs/promises";

/** Anything unreadable counts as absent, which is all these callers need. */
async function statMatches(
  target: string,
  isWanted: (stats: Stats) => boolean,
): Promise<boolean> {
  try {
    return isWanted(await stat(target));
  } catch {
    return false;
  }
}

/** Whether a file is there to be read. */
export async function isFile(target: string): Promise<boolean> {
  return statMatches(target, (stats) => stats.isFile());
}

/** Whether a directory is there to be walked. */
export async function isDirectory(target: string): Promise<boolean> {
  return statMatches(target, (stats) => stats.isDirectory());
}
