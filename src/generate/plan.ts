import { resolveConfig } from "../config/index.js";
import { resolveConfigForSize } from "../config/size.js";
import { walkContent } from "../content/index.js";
import type { Stamper } from "../stamp/index.js";
import { createStamper } from "../stamp/index.js";
import { extraJobs } from "./extra.js";
import type { RenderJob } from "./job.js";
import type { GenerateOptions } from "./options.js";
import { defaultOutputPath } from "./output-path.js";

/**
 * Everything a build needs before it starts rendering: one job per image, and
 * the stamper that says which of them can be skipped.
 */
export interface BuildPlan {
  readonly jobs: readonly RenderJob[];
  readonly stamper: Stamper;
}

/**
 * Work out what a build has to render. The per-size configs are resolved once
 * rather than once per image: the overrides are the same for every post, and
 * resolving re-reads the configured font files.
 */
export async function planBuild(options: GenerateOptions): Promise<BuildPlan> {
  const resolved = resolveConfig(options.config);
  const toOutputPath = options.outputPath ?? defaultOutputPath;

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
    resolved.sizes.map((size) => ({
      contentPath: file.contentPath,
      props: file.props,
      size,
      outputPath: toOutputPath(file, size),
      config: configBySize.get(size.name) ?? resolved,
    })),
  );

  return { jobs: [...jobs, ...extraJobs(options.config, resolved)], stamper };
}
