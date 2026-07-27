import path from "node:path";

import type { ContentFile } from "../content/index.js";
import type { OutputSize } from "../types.js";

/**
 * Default output path: named `<slug>-<size>.png`, alongside the content file.
 * The slug carries the post's keywords into the filename and the size name
 * keeps every image distinct (e.g. `my-post-og.png`, `my-post-square.png`).
 *
 * A slug carrying directories of its own — what the `route` strategy produces,
 * and what a frontmatter `slug` of `docs/intro` means — is written from the
 * content root instead, so its path mirrors the route. Resolving it beside the
 * file would repeat the directories that are already in the slug, putting
 * `services/iam` under `content/services/iam/`.
 */
export function defaultOutputPath(file: ContentFile, size: OutputSize): string {
  const name = `${file.slug}-${size.name}.png`;

  if (!file.slug.includes("/")) {
    return path.join(path.dirname(file.absolutePath), name);
  }

  // `absolutePath` ends with `contentPath` by construction, so dropping it
  // leaves the directory the walk started from.
  const root = file.absolutePath.slice(
    0,
    file.absolutePath.length - file.contentPath.length,
  );
  return path.join(root, name);
}
