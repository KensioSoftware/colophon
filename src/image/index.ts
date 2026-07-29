import type {
  ImageAsset,
  ImageSource,
  MetaImageProps,
  ResolvedConfig,
} from "../types.js";
import { loadImage } from "./load.js";
import { resolveImageSource } from "./resolve.js";
import { bytesFromDataUri } from "./uri.js";

export { loadImage } from "./load.js";
export { resolveImageSource, resolveOptionalImage } from "./resolve.js";

/** Every image one rendering needs, loaded and ready to draw. */
export interface LoadedImages {
  readonly logo: ImageAsset | undefined;
  readonly avatar: ImageAsset | undefined;
  readonly background: ImageAsset | undefined;
}

/**
 * Load an image named by a prop, which is a `data:` URI or a path to a file.
 *
 * A path is resolved from the working directory, as `fonts` and `logo` are.
 * Resolving it against the post instead would be friendlier for a page bundle
 * and wrong for everything else, and a build has one working directory but
 * many content directories.
 */
async function loadProp(
  value: string | undefined,
  label: string,
): Promise<ImageAsset | undefined> {
  if (value === undefined || value === "") {
    return undefined;
  }

  const source: ImageSource = value.startsWith("data:")
    ? { data: bytesFromDataUri(value, label) }
    : resolveImageSource({ path: value }, label);

  return loadImage(source, label);
}

async function loadOptional(
  source: ImageSource | undefined,
  label: string,
): Promise<ImageAsset | undefined> {
  return source === undefined ? undefined : loadImage(source, label);
}

/**
 * Load the logo, the background photo and the post's avatar for one image.
 *
 * Reading files is the renderer's job rather than the template's. A template
 * stays a synchronous function over values it was handed, and the bytes of a
 * logo are read once for a whole build rather than once per image.
 */
export async function loadImages(
  config: ResolvedConfig,
  props: MetaImageProps,
): Promise<LoadedImages> {
  const background =
    config.background.type === "image" ? config.background.source : undefined;

  const [logo, avatar, backgroundImage] = await Promise.all([
    loadOptional(config.logo, "logo"),
    loadProp(props.avatar, "props.avatar"),
    loadOptional(background, "background.source"),
  ]);

  return { logo, avatar, background: backgroundImage };
}
