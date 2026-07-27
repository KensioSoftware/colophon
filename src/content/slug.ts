import path from "node:path";

import type { SlugStrategy } from "../types.js";

/**
 * Derive a slug from a content file's path, relative to the root of the walk.
 *
 * `basename` gives the filename without extension, or the parent directory for
 * `index.*` — the page-bundle convention, where an image sits beside its post.
 * `route` keeps the directories, so a site addressed by route gets a slug that
 * matches the address rather than just its last segment.
 *
 * The path must be relative to the content root for `route` to mean anything;
 * `basename` reads the same either way.
 */
export function slugFromPath(
  contentPath: string,
  strategy: SlugStrategy = "basename",
): string {
  const extension = path.extname(contentPath);
  const base = path.basename(contentPath, extension);
  const directory = path.dirname(contentPath);

  if (strategy === "basename") {
    if (base !== "index") {
      return base;
    }

    // A root-level `index.*` has no parent inside the tree to be named after,
    // so it keeps its own name rather than borrowing the content directory's.
    const parent = path.basename(directory);
    return parent === "" || parent === "." ? base : parent;
  }

  const route = base === "index" ? directory : path.join(directory, base);
  // `path.dirname` of a root-level file is ".", which as a route is the site
  // root — and the one place there is no directory name to fall back on.
  const normalised = route === "." ? "index" : route.split(path.sep).join("/");
  return normalised;
}

/**
 * Reject a slug that would name a file outside the tree it came from.
 *
 * A slug is a filename, and may carry directories under the `route` strategy —
 * but a declared one is written by hand, and `slug: ../../../tmp/x` would have
 * `generate` create directories and write an image there. Nothing derived from
 * a path can look like this, so the check only ever fires on frontmatter.
 */
export function assertSlugStaysInside(slug: string, contentPath: string): void {
  // An empty segment catches a leading or doubled separator, so an absolute
  // slug is rejected by the same pass as a traversing one.
  const outside = new Set(["", ".", ".."]);
  const isEscaping =
    slug.split(/[/\\]/).some((segment) => outside.has(segment)) ||
    /^[A-Za-z]:/.test(slug);

  if (isEscaping) {
    throw new Error(
      `Invalid slug "${slug}" in ${contentPath}: a slug names an image inside` +
        ` the output tree, so it cannot be absolute or contain "." or ".."` +
        ` segments.`,
    );
  }
}
