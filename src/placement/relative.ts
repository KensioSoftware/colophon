import path from "node:path";

import type { ContentFile, OutputSize } from "../types.js";

/**
 * How much of an image's digest goes in its filename.
 *
 * Eight hex characters is what the asset pipelines settle on, and it is the
 * length at which a site would need tens of thousands of images before two of
 * them were likely to collide.
 */
const hashLength = 8;

/**
 * The filename one image is written under: `<slug>-<size>.png`, or
 * `<slug>-<size>.<hash>.png` where the placement asks for a hash. The slug
 * carries the post's keywords, and the size name keeps every image of a post
 * distinct (`my-post-og.png`, `my-post-square.png`).
 *
 * A slug carrying directories of its own — what the `route` strategy produces,
 * and what a frontmatter `slug` of `docs/intro` means — puts them in the name,
 * so the image's path mirrors the route wherever it is placed.
 *
 * The digest is the image's rebuild stamp: the props, the config and the size
 * it is drawn from. Hashing the rendered bytes would be a truer name, but they
 * are not known until the image has been rendered, and the point of the stamp
 * is not rendering the ones that have not changed.
 */
export function imageName(
  file: ContentFile,
  size: OutputSize,
  hash: string | undefined,
): string {
  const stem = `${file.slug}-${size.name}`;

  return hash === undefined
    ? `${stem}.png`
    : `${stem}.${hash.slice(0, hashLength)}.png`;
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
export function besideContent(
  file: ContentFile,
  size: OutputSize,
  hash: string | undefined,
): string {
  const name = imageName(file, size, hash);

  if (file.slug.includes("/")) {
    return name;
  }

  const directory = path.dirname(file.contentPath);

  return directory === "." || directory === ""
    ? name
    : `${directory.split(path.sep).join("/")}/${name}`;
}
