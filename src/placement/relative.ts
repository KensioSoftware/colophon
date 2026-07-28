import path from "node:path";

import type { ContentFile, OutputSize } from "../types.js";

/**
 * The filename one image is written under: `<slug>-<size>.png`. The slug
 * carries the post's keywords, and the size name keeps every image of a post
 * distinct (`my-post-og.png`, `my-post-square.png`).
 *
 * A slug carrying directories of its own — what the `route` strategy produces,
 * and what a frontmatter `slug` of `docs/intro` means — puts them in the name,
 * so the image's path mirrors the route wherever it is placed.
 */
export function imageName(file: ContentFile, size: OutputSize): string {
  return `${file.slug}-${size.name}.png`;
}

/**
 * Where an image goes relative to the content root, in URL form.
 *
 * Slashes rather than the platform's separator, because this is also what a
 * URL is built from: a Windows build must not serve `posts\my-post\a.png`.
 * The disk path is joined back up per platform by whoever places it.
 *
 * A slug with directories of its own is placed from the content root, so its
 * path mirrors the route. Resolving it beside the file would repeat the
 * directories already in the slug, putting `services/iam` under
 * `content/services/iam/`.
 */
export function besideContent(file: ContentFile, size: OutputSize): string {
  const name = imageName(file, size);

  if (file.slug.includes("/")) {
    return name;
  }

  const directory = path.dirname(file.contentPath);

  return directory === "." || directory === ""
    ? name
    : `${directory.split(path.sep).join("/")}/${name}`;
}
