import { defaultContentExtensions } from "../content/index.js";
import { generate } from "../generate/index.js";
import type { CliArgs } from "./args/index.js";
import { loadConfig } from "./config.js";
import { reportImage, reportSummary } from "./report.js";
import { watchContent } from "./watch/index.js";

/** Where a run with no content directory named looks for one. */
const defaultContentDir = "content";

/**
 * Render the images for a content tree: the CLI's original and usual job.
 *
 * Under `--watch` the same build runs again on every content change. The config
 * is loaded once, outside the loop, since a watch does not pick up changes to it
 * in any case.
 */
export async function runBuild(args: CliArgs): Promise<void> {
  const config = await loadConfig(args.configPath);
  const contentDir = args.contentDir ?? defaultContentDir;

  const build = async (): Promise<void> => {
    const results = await generate({
      contentDir,
      overwrite: args.overwrite,
      dryRun: args.dryRun,
      ...(config !== undefined && { config }),
      ...(args.concurrency !== undefined && { concurrency: args.concurrency }),
      onResult: (result) => {
        reportImage(result, args.dryRun);
      },
    });

    reportSummary(results, args.dryRun);
  };

  if (!args.watch) {
    await build();
    return;
  }

  await watchContent({
    dir: contentDir,
    extensions: config?.content?.extensions ?? defaultContentExtensions,
    build,
  });
}
