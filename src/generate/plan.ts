import { resolveConfig } from "../config/index.js";
import { resolveConfigForSize } from "../config/size.js";
import { walkContent } from "../content/index.js";
import type { PlannedManifest } from "../manifest/index.js";
import { planManifest } from "../manifest/index.js";
import type { Stamper } from "../stamp/index.js";
import { createStamper } from "../stamp/index.js";
import type { Placer } from "../placement/index.js";
import { createPlacer } from "../placement/index.js";
import { extraJobs } from "./extra.js";
import type { RenderJob } from "./job.js";
import type { GenerateOptions } from "./options.js";
import {
  assertDistinctOutputs,
  assertManifestIsNotAnImage,
} from "./outputs.js";

/**
 * Everything a build needs before it starts rendering: one job per image, and
 * the stamper that says which of them can be skipped.
 */
export interface BuildPlan {
  readonly jobs: readonly RenderJob[];
  readonly stamper: Stamper;
  /** What to write down about the build, where a config asked for it. */
  readonly manifest: PlannedManifest | undefined;
}

/**
 * How this build places its images: the configured placement, or `outputPath`
 * where a caller passed one.
 *
 * `outputPath` is the programmatic equivalent of a `custom` placement and wins
 * for the same reason `walk` beats `config.content`. The URL then comes from
 * nowhere: the placement no longer describes where the file went, and the one
 * it would have named is not where the image is.
 */
function placer(options: GenerateOptions): Placer {
  const override = options.outputPath;

  if (override === undefined) {
    return createPlacer(options.config?.placement, options.contentDir);
  }

  return (file, size) => ({ path: override(file, size), url: undefined });
}

/**
 * Work out what a build has to render. The per-size configs are resolved once
 * rather than once per image: the overrides are the same for every post, and
 * resolving re-reads the configured font files.
 */
export async function planBuild(options: GenerateOptions): Promise<BuildPlan> {
  const resolved = resolveConfig(options.config);
  const place = placer(options);

  const configBySize = new Map(
    resolved.sizes.map((size) => [
      size.name,
      resolveConfigForSize(options.config, size),
    ]),
  );

  const [stamper, files] = await Promise.all([
    createStamper(resolved),
    // Content options can come from the config module, which is the only route
    // a CLI user has to them; `walk` is the programmatic override and wins.
    walkContent({
      dir: options.contentDir,
      ...options.config?.content,
      ...options.walk,
    }),
  ]);

  const jobs = files.flatMap((file) =>
    resolved.sizes.map((size) => {
      const placed = place(file, size);

      return {
        contentPath: file.contentPath,
        slug: file.slug,
        props: file.props,
        size,
        outputPath: placed.path,
        url: placed.url,
        config: configBySize.get(size.name) ?? resolved,
      };
    }),
  );

  const all = [...jobs, ...extraJobs(options.config, resolved)];
  assertDistinctOutputs(all);
  assertManifestIsNotAnImage(options.config?.manifest, all);

  return {
    jobs: all,
    stamper,
    manifest: planManifest(options.config?.manifest, all),
  };
}
