import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Manifest } from "../types.js";

import type { RenderJob } from "../generate/job.js";
import { buildManifest } from "./build.js";

export { buildManifest } from "./build.js";

/**
 * A manifest and where it goes, or nothing when the config asked for none.
 */
export interface PlannedManifest {
  readonly path: string;
  readonly data: Manifest;
}

/**
 * Work out the manifest a build will write, if any.
 *
 * Built while planning rather than from the results, so that a site with two
 * pages sharing a slug hears about it before rendering the tree rather than
 * after. That is the same reason the output paths are checked up front.
 */
export function planManifest(
  manifestPath: string | undefined,
  jobs: readonly RenderJob[],
): PlannedManifest | undefined {
  return manifestPath === undefined
    ? undefined
    : { path: manifestPath, data: buildManifest(jobs) };
}

/**
 * Write the manifest, creating whatever directories its path needs.
 *
 * Indented, with a trailing newline: it is written into a site's data
 * directory, where it is read by people as well as by templates, and a diff of
 * one long line says nothing about what changed.
 */
export async function writeManifest(
  manifest: PlannedManifest | undefined,
): Promise<void> {
  if (manifest === undefined) {
    return;
  }

  await mkdir(path.dirname(manifest.path), { recursive: true });
  await writeFile(
    manifest.path,
    `${JSON.stringify(manifest.data, undefined, 2)}\n`,
  );
}
