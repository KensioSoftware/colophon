import path from "node:path";

import { DEFAULT_FORMAT } from "../config/defaults.js";
import { besideContent } from "../placement/index.js";
import type { ContentFile, OutputFormat, OutputSize } from "../types.js";

/**
 * Default output path: named `<slug>-<size>.png`, alongside the content file.
 *
 * This is the `beside-content` placement reached without a content root to
 * place from, so it takes the root off the file itself. It stays its own
 * export because it is what `generate`'s `outputPath` callback replaces, and
 * a caller wrapping the default has to be able to call it. It never hashes:
 * a hash names one rendering of an image, and this has no way to know which.
 *
 * `format` is optional, and PNG without it, because the signature is one a
 * caller wrapping this already wrote against. A caller that has a config to
 * hand should pass its format, or the extension will not match the bytes.
 */
export function defaultOutputPath(
  file: ContentFile,
  size: OutputSize,
  format: OutputFormat = DEFAULT_FORMAT,
): string {
  // `absolutePath` ends with `contentPath` by construction, so dropping it
  // leaves the directory the walk started from.
  const root = file.absolutePath.slice(
    0,
    file.absolutePath.length - file.contentPath.length,
  );

  return path.join(
    root,
    ...besideContent(file, size, undefined, format).split("/"),
  );
}
