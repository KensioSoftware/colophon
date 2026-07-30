import { readdir } from "node:fs/promises";
import path from "node:path";

import type { ContentFile, ContentOptions } from "../types.js";
import { defaultContentExtensions, readContentFile } from "./read.js";

/**
 * Options for {@link walkContent}: everything a project can say about reading
 * its own content, plus the directory to read it from. Only `dir` is required.
 */
export interface WalkOptions extends ContentOptions {
  /** Root directory to search recursively for content files. */
  readonly dir: string;
}

async function collectContentFiles(
  dir: string,
  extensions: readonly string[],
): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });

  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return collectContentFiles(entryPath, extensions);
      }

      if (
        entry.isFile() &&
        extensions.some((extension) => entry.name.endsWith(extension))
      ) {
        return [entryPath];
      }

      return [];
    }),
  );

  return nested.flat();
}

/**
 * Walk a content tree, read each file's frontmatter with `gray-matter`, and
 * return the files that image props can be built for. This is the host-project
 * concern of finding content and reading frontmatter, kept separate from
 * rendering.
 */
export async function walkContent(
  options: WalkOptions,
): Promise<ContentFile[]> {
  const extensions = options.extensions ?? defaultContentExtensions;
  const filePaths = await collectContentFiles(options.dir, extensions);

  const files = await Promise.all(
    filePaths.map(async (filePath) =>
      readContentFile(filePath, options.dir, options),
    ),
  );

  return files.filter((file): file is ContentFile => file !== undefined);
}
