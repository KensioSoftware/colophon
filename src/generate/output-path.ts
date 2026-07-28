import path from "node:path";

import { besideContent } from "../placement/index.js";
import type { ContentFile, OutputSize } from "../types.js";

/**
 * Default output path: named `<slug>-<size>.png`, alongside the content file.
 *
 * This is the `beside-content` placement reached without a content root to
 * place from, so it takes the root off the file itself. It stays its own
 * export because it is what `generate`'s `outputPath` callback replaces, and
 * a caller wrapping the default has to be able to call it.
 */
export function defaultOutputPath(file: ContentFile, size: OutputSize): string {
  // `absolutePath` ends with `contentPath` by construction, so dropping it
  // leaves the directory the walk started from.
  const root = file.absolutePath.slice(
    0,
    file.absolutePath.length - file.contentPath.length,
  );

  return path.join(root, ...besideContent(file, size).split("/"));
}
