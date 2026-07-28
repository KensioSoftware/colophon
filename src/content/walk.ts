import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

import type { ContentFile, ContentOptions } from "../types.js";
import { coerceString, extractProps } from "./props.js";
import { assertSlugStaysInside, slugFromPath } from "./slug.js";

const defaultSlugField = "slug";
const defaultSlugStrategy = "basename";
const defaultExtensions: readonly string[] = [".md", ".markdown"];

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
 * concern — finding content and reading frontmatter — kept separate from
 * rendering.
 */
export async function walkContent(
  options: WalkOptions,
): Promise<ContentFile[]> {
  const extensions = options.extensions ?? defaultExtensions;
  const filePaths = await collectContentFiles(options.dir, extensions);

  const slugField = options.slugField ?? defaultSlugField;
  const slugStrategy = options.slugStrategy ?? defaultSlugStrategy;

  const files = await Promise.all(
    filePaths.map(async (filePath) => {
      const raw = await readFile(filePath, "utf8");
      const frontmatter: Record<string, unknown> = matter(raw).data;
      const props = extractProps(frontmatter, options);

      if (props === undefined) {
        return;
      }

      const contentPath = path.relative(options.dir, filePath);
      const declaredSlug = coerceString(frontmatter[slugField])?.trim();
      const slug =
        declaredSlug !== undefined && declaredSlug !== ""
          ? declaredSlug
          : slugFromPath(contentPath, slugStrategy);

      assertSlugStaysInside(slug, contentPath);

      return {
        contentPath,
        absolutePath: filePath,
        slug,
        props,
      };
    }),
  );

  return files.filter((file): file is ContentFile => file !== undefined);
}
