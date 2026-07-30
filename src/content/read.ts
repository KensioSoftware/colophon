import { readFile } from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

import type { ContentFile, ContentOptions } from "../types.js";
import { coerceString, extractProps } from "./props.js";
import { assertSlugStaysInside, slugFromPath } from "./slug.js";

/** File extensions a walk reads when a project names none of its own. */
export const defaultContentExtensions: readonly string[] = [".md", ".markdown"];

const defaultSlugField = "slug";
const defaultSlugStrategy = "basename";

/**
 * Read one content file's frontmatter and build the image props for it, or
 * return `undefined` where the file asks for no image.
 *
 * `dir` is the content root the returned path and slug are taken relative to,
 * which is what makes a `route` slug a route. It is separate from the file
 * itself because reading one post and walking a tree of them want the same
 * work done: `walkContent` maps this over what it found, and `preview` calls it
 * for the single file it was pointed at.
 */
export async function readContentFile(
  filePath: string,
  dir: string,
  options: ContentOptions = {},
): Promise<ContentFile | undefined> {
  const raw = await readFile(filePath, "utf8");
  const frontmatter: Record<string, unknown> = matter(raw).data;
  const props = extractProps(frontmatter, options);

  if (props === undefined) {
    return undefined;
  }

  const contentPath = path.relative(dir, filePath);
  const slugField = options.slugField ?? defaultSlugField;
  const declaredSlug = coerceString(frontmatter[slugField])?.trim();
  const slug =
    declaredSlug !== undefined && declaredSlug !== ""
      ? declaredSlug
      : slugFromPath(contentPath, options.slugStrategy ?? defaultSlugStrategy);

  assertSlugStaysInside(slug, contentPath);

  return { contentPath, absolutePath: filePath, slug, props };
}
