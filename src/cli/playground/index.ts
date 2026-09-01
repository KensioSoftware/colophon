import { DEFAULT_SIZES } from "../../config/index.js";
import type { CliArgs } from "../args/index.js";
import { loadConfig } from "../config.js";
import { pickSize } from "../preview/size.js";
import { configForPlayground } from "./config.js";
import { playgroundConfigPath, playgroundSample } from "./discover.js";
import { fallbackFrontmatter, sampleFrontmatter } from "./sample.js";
import { shareUrl } from "./share.js";

export interface PlaygroundLink {
  readonly url: string;
  readonly omitted: readonly string[];
}

/** Build a colophonjs.dev link carrying this project's config and one post. */
export async function playgroundLink(
  args: CliArgs,
  dir = process.cwd(),
): Promise<PlaygroundLink> {
  const config = await loadConfig(
    await playgroundConfigPath(args.configPath, dir),
  );
  if (args.size !== undefined) {
    pickSize(config?.sizes ?? DEFAULT_SIZES, args.size);
  }
  const file = await playgroundSample(args.file, config, dir);
  const frontmatter =
    file === undefined
      ? { text: fallbackFrontmatter(config), omitted: [] }
      : await sampleFrontmatter(file, config);
  const shared = configForPlayground(config);

  return {
    url: shareUrl({
      config: shared.text,
      frontmatter: frontmatter.text,
      ...(args.size === undefined ? {} : { size: args.size }),
    }),
    omitted: [...shared.omitted, ...frontmatter.omitted],
  };
}

/** Print a colophonjs.dev link carrying this project's config and one post. */
export async function runPlayground(
  args: CliArgs,
  dir = process.cwd(),
): Promise<void> {
  const link = await playgroundLink(args, dir);

  if (link.omitted.length > 0) {
    console.warn(
      `The playground cannot use: ${link.omitted.join(", ")}. ` +
        "The link leaves them out.",
    );
  }

  console.log(link.url);
}
