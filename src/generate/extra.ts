import { SIZE_PRESETS } from "../config/defaults.js";
import { resolveConfigForSize } from "../config/size.js";
import type { Stamper } from "../stamp/index.js";
import type { ColophonConfig, ExtraImage, ResolvedConfig } from "../types.js";
import { isRecord } from "../validate/check.js";
import type { RenderJob } from "./job.js";

/**
 * Reject an extra image that says too little to be rendered or written.
 *
 * The type requires both fields, but a CLI user's config module is plain
 * JavaScript with nothing checking it, and neither omission fails anywhere
 * near the config: a missing `output` surfaces as a complaint about an
 * argument to `path`, and missing props as a property read on `undefined`.
 * Key validation is no help either — it is the option that is not there.
 */
function checkImage(image: ExtraImage, index: number): void {
  // The types say what should be here; this exists for when it is not.
  const declared = image as {
    readonly props?: unknown;
    readonly output?: unknown;
  };
  const label = `extra[${String(index)}]`;

  if (typeof declared.output !== "string" || declared.output === "") {
    throw new Error(`${label} needs an "output" path to write the image to.`);
  }

  if (!isRecord(declared.props)) {
    throw new Error(`${label} needs a "props" object describing the image.`);
  }
}

/**
 * The jobs for the images a config declares outright, rather than finding in
 * the content tree.
 *
 * An extra image is a size like any other as far as the renderer is concerned,
 * so it goes through `resolveConfigForSize` too and gets the same override
 * rules rather than a second set that would have to agree with the first.
 * Each resolves its own: there are a handful of these at most, and one
 * carrying overrides is the normal case rather than the exception, so caching
 * them by name the way the content jobs do would save nothing.
 */
export function extraJobs(
  config: ColophonConfig | undefined,
  resolved: ResolvedConfig,
  stamper: Stamper,
): RenderJob[] {
  // `resolveSizes` never returns an empty list; the default is for the type.
  const [firstSize = SIZE_PRESETS.og] = resolved.sizes;

  return (config?.extra ?? []).map((image, index) => {
    checkImage(image, index);
    const size = image.size ?? firstSize;

    return {
      contentPath: undefined,
      // Not a page, so not something the manifest can key by.
      slug: undefined,
      props: image.props,
      size,
      // Left as written rather than made absolute: the file system resolves a
      // relative path against the working directory anyway, and the build log
      // reads better saying what the config said.
      outputPath: image.output,
      // An extra names its own path, so the placement — which maps posts to
      // paths — has nothing to say about where this one is served, nor about
      // hashing a filename it did not choose.
      url: undefined,
      stamp: stamper.stamp(image.props, size),
      config: resolveConfigForSize(config, size),
    };
  });
}
