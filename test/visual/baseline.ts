/**
 * The committed baseline images: where they live, and how they are read,
 * written and reported on.
 *
 * They are PNGs rather than a file of hashes because the point of the check is
 * that a template change gets looked at. A hash tells a reviewer the image
 * moved; the image tells them whether it moved the right way, and a pull
 * request that regenerates one shows both versions side by side on its own.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/** Committed, one PNG per sample. */
const baselineDir = path.join(here, "..", "baselines");

/** Not committed: where a failing render is written so it can be looked at. */
const failureDir = path.join(here, "..", ".visual");

/** Where one sample's baseline lives. */
function baselinePath(name: string): string {
  return path.join(baselineDir, `${name}.png`);
}

/**
 * Whether this run is recording baselines rather than checking against them,
 * which is what `pnpm baselines` sets. Recording is a mode of the check rather
 * than a script of its own, so that a baseline can only ever be written by the
 * code that compares against it.
 */
export const isRecording = process.env["COLOPHON_UPDATE_BASELINES"] === "1";

/** Record a baseline, creating the directory on a first run. */
export async function writeBaseline(name: string, png: Buffer): Promise<void> {
  await mkdir(baselineDir, { recursive: true });
  await writeFile(baselinePath(name), png);
}

/** Whether a failed read failed because the file was not there. */
function isMissing(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

/**
 * Read a baseline, or `undefined` where there is none, which means a sample was
 * added without recording one rather than that anything is wrong with it.
 *
 * Only a missing file is `undefined`. `stamp/read.ts` and `cli/init/fs.ts` both
 * treat anything unreadable as absent, but they can afford to: what follows
 * either is safe work, rendering the image again or writing the config. What
 * follows this one is a failure telling the reader to run `pnpm baselines`, and
 * that is the wrong instruction for a file that is there and cannot be read.
 */
export async function readBaseline(name: string): Promise<Buffer | undefined> {
  try {
    return await readFile(baselinePath(name));
  } catch (error) {
    if (isMissing(error)) {
      return undefined;
    }

    throw error;
  }
}

/**
 * Write what was actually rendered somewhere a person can open it, and return
 * the path to put in the failure message. Nothing else reads it, so a stale one
 * left behind from an earlier run does no harm.
 */
export async function writeFailure(name: string, png: Buffer): Promise<string> {
  await mkdir(failureDir, { recursive: true });
  const file = path.join(failureDir, `${name}.png`);
  await writeFile(file, png);

  return path.relative(process.cwd(), file);
}
