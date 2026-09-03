import path from "node:path";

import { DEFAULT_FORMAT } from "../config/defaults.js";
import type {
  ContentFile,
  OutputFormat,
  OutputSize,
  Placement,
} from "../types.js";
import { assertPlacement } from "./check.js";
import { besideContent, imageName } from "./relative.js";

export { besideContent, imageName } from "./relative.js";

/**
 * Where one image ends up: the path its bytes are written to, and the URL it
 * is served at, if the placement knows one.
 */
export interface PlacedImage {
  readonly path: string;
  readonly url: string | undefined;
}

/**
 * Places each image of a build.
 *
 * The stamp is handed over whether or not the placement wants it: it is what a
 * hashed filename is built from, and a placement that does not hash simply
 * ignores it.
 */
export type Placer = (
  file: ContentFile,
  size: OutputSize,
  stamp: string,
) => PlacedImage;

/**
 * Prefix a `urlBase` onto an image's path under the root that placed it.
 *
 * No base, no URL: a directory on disk does not say how, or whether, it is
 * served, and a URL Colophon invented would be worse than the gap it fills,
 * since the whole point of writing one down is that a site can trust it.
 */
function toUrl(
  urlBase: string | undefined,
  relative: string,
): string | undefined {
  if (urlBase === undefined) {
    return undefined;
  }

  return `${urlBase.replace(/\/+$/, "")}/${relative}`;
}

/** Join a path that uses URL separators back into a platform path. */
function under(root: string, relative: string): string {
  return path.join(root, ...relative.split("/"));
}

/**
 * The content root `beside-content` places under, or a refusal.
 *
 * A build whose content came from `generate`'s `contentFiles` need not have a
 * directory at all, and beside content is the one placement that cannot be
 * worked out without one: it writes each image next to its post, and there is
 * no post on disk to be next to. Placing them under the working directory
 * instead would scatter images through a project that never asked for them.
 */
function contentRoot(contentDir: string | undefined): string {
  if (contentDir === undefined) {
    throw new Error(
      `The "beside-content" placement writes each image next to its post, and` +
        ` this build has no content directory to place them under. Pass a` +
        ` contentDir, or say where the images go without one: the` +
        ` "public-dir" or "custom" placement, or generate's outputPath.`,
    );
  }

  return contentDir;
}

/**
 * Build the function that places every image of a build.
 *
 * The strategies differ only in the root an image is placed under and whether
 * it keeps the directories its post sits in: `beside-content` keeps them,
 * which is the page-bundle convention, and `public-dir` drops them so that a
 * flat directory can be served as one. Either way the same relative path
 * makes the disk path and the URL, so the two cannot drift apart.
 *
 * `contentDir` is what `beside-content` places under, and the one strategy
 * that needs it: a build handed its content rather than walking for it may
 * have no directory to give, and is refused here rather than left to invent
 * one.
 *
 * `format` is what the two name-building strategies end a filename with. It
 * defaults to PNG for a caller placing images without having resolved a config,
 * which is the only way there is to be holding a placement and not a format.
 * A `custom` placement builds its own names and is not told.
 */
export function createPlacer(
  placement: Placement | undefined,
  contentDir: string | undefined,
  format: OutputFormat = DEFAULT_FORMAT,
): Placer {
  if (placement !== undefined) {
    assertPlacement(placement);
  }

  if (placement === undefined || placement.strategy === "beside-content") {
    const urlBase = placement?.urlBase;
    const isHashes = placement?.hash === true;
    // Refused while the placer is built rather than while it places, so a
    // build without a root stops before it renders anything.
    const root = contentRoot(contentDir);

    return (file, size, stamp) => {
      const relative = besideContent(
        file,
        size,
        isHashes ? stamp : undefined,
        format,
      );
      return {
        path: under(root, relative),
        url: toUrl(urlBase, relative),
      };
    };
  }

  if (placement.strategy === "public-dir") {
    const isHashes = placement.hash === true;

    return (file, size, stamp) => {
      const relative = imageName(
        file,
        size,
        isHashes ? stamp : undefined,
        format,
      );
      return {
        path: under(placement.dir, relative),
        url: toUrl(placement.urlBase, relative),
      };
    };
  }

  return (file, size) => ({
    path: placement.path(file, size),
    url: placement.url?.(file, size),
  });
}
