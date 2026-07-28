import { SIZE_PRESETS } from "../config/defaults.js";
import { resolveConfigForSize } from "../config/size.js";
import type { ColophonConfig, ResolvedConfig } from "../types.js";
import type { RenderJob } from "./job.js";

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
): RenderJob[] {
  // `resolveSizes` never returns an empty list; the default is for the type.
  const [firstSize = SIZE_PRESETS.og] = resolved.sizes;

  return (config?.extra ?? []).map((image) => {
    const size = image.size ?? firstSize;

    return {
      contentPath: undefined,
      props: image.props,
      size,
      // Left as written rather than made absolute: the file system resolves a
      // relative path against the working directory anyway, and the build log
      // reads better saying what the config said.
      outputPath: image.output,
      config: resolveConfigForSize(config, size),
    };
  });
}
