import path from "node:path";

/**
 * The content root to read a previewed post against, which is what its slug is
 * derived from, and so what the preview file ends up called.
 *
 * The working directory, for a file underneath it: that is what the path on the
 * command line was relative to, and it keeps the page-bundle convention
 * working, where `hello/index.md` is named after its directory instead of being
 * one more `index`. A file from somewhere else falls back to its own directory,
 * since a root it is not under cannot describe it, and a relative path full of
 * `..` segments is not a slug at all.
 *
 * The slug only ever names a file in the temp directory here, so the point is
 * that two posts do not collide, rather than matching what a build would call
 * the real image.
 */
export function contentRootFor(file: string): string {
  const absolute = path.resolve(file);
  const cwd = process.cwd();

  return absolute.startsWith(cwd + path.sep) ? cwd : path.dirname(absolute);
}
