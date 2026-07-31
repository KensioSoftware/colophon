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
 * Build the function that places every image of a build.
 *
 * The strategies differ only in the root an image is placed under and whether
 * it keeps the directories its post sits in: `beside-content` keeps them,
 * which is the page-bundle convention, and `public-dir` drops them so that a
 * flat directory can be served as one. Either way the same relative path
 * makes the disk path and the URL, so the two cannot drift apart.
 *
 * `format` is what the two name-building strategies end a filename with. It
 * defaults to PNG for a caller placing images without having resolved a config,
 * which is the only way there is to be holding a placement and not a format.
 * A `custom` placement builds its own names and is not told.
 */
export function createPlacer(
  placement: Placement | undefined,
  contentDir: string,
  format: OutputFormat = DEFAULT_FORMAT,
): Placer {
  if (placement !== undefined) {
    assertPlacement(placement);
  }

  if (placement === undefined || placement.strategy === "beside-content") {
    const urlBase = placement?.urlBase;
    const isHashes = placement?.hash === true;

    return (file, size, stamp) => {
      const relative = besideContent(
        file,
        size,
        isHashes ? stamp : undefined,
        format,
      );
      return {
        path: under(contentDir, relative),
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
