import path from "node:path";

import { readContentFile, walkContent } from "../../content/index.js";
import type { ColophonConfig, ContentFile } from "../../types.js";
import { guessContentDir } from "../init/guess.js";
import { existingConfig } from "../init/module.js";

/** The requested config, or the conventional config found in the project. */
export async function playgroundConfigPath(
  requested: string | undefined,
  dir: string,
): Promise<string | undefined> {
  if (requested !== undefined) {
    return path.resolve(dir, requested);
  }
  const found = await existingConfig(dir);
  return found === undefined ? undefined : path.join(dir, found);
}

async function namedFile(
  file: string,
  config: ColophonConfig | undefined,
  dir: string,
): Promise<ContentFile> {
  const read = await readContentFile(
    path.resolve(dir, file),
    dir,
    config?.content,
  );
  if (read === undefined) {
    throw new Error(
      `${file} declares no image props to send to the playground.`,
    );
  }
  return read;
}

async function discoveredFile(
  config: ColophonConfig | undefined,
  dir: string,
): Promise<ContentFile | undefined> {
  const contentDir = await guessContentDir(dir);
  if (contentDir === undefined) {
    return undefined;
  }

  const files = await walkContent({
    dir: path.join(dir, contentDir),
    ...config?.content,
  });
  return files.toSorted((a, b) =>
    a.contentPath.localeCompare(b.contentPath),
  )[0];
}

/** Find the named post, or the first image post in a conventional content tree. */
export function playgroundSample(
  file: string | undefined,
  config: ColophonConfig | undefined,
  dir: string,
): Promise<ContentFile | undefined> {
  return file === undefined
    ? discoveredFile(config, dir)
    : namedFile(file, config, dir);
}
