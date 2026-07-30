import { readFile } from "node:fs/promises";
import path from "node:path";

import { isFile } from "./fs.js";

/**
 * The names a config module is written under, in the order a project is
 * likeliest to have chosen. A `.ts` config works on a Node that strips types,
 * and the docs use one, so it is the first thing to look for.
 */
const configNames = [
  "colophon.config.ts",
  "colophon.config.mts",
  "colophon.config.js",
  "colophon.config.mjs",
];

/** The config module a project already has, whatever it chose to call it. */
export async function existingConfig(dir: string): Promise<string | undefined> {
  const found = await Promise.all(
    configNames.map(async (name) =>
      (await isFile(path.join(dir, name))) ? name : undefined,
    ),
  );

  return found.find((name) => name !== undefined);
}

/** Whether the project has already declared itself an ES module. */
async function isModuleProject(dir: string): Promise<boolean> {
  try {
    const raw = await readFile(path.join(dir, "package.json"), "utf8");
    return (JSON.parse(raw) as { type?: string }).type === "module";
  } catch {
    // No package.json, or one that is not JSON. Either way there is nothing
    // saying the project is ESM, so the safe extension is the one to write.
    return false;
  }
}

/**
 * What to call the config this command writes.
 *
 * A Colophon config is an ES module: `defineConfig` is imported and the config
 * is the default export. In a project without `"type": "module"` a `.js` file
 * is CommonJS, so `--config` would fail to import the very file `init` had just
 * written. `.mjs` is that case's way out, and `.js` is right everywhere else.
 */
export async function configFilename(dir: string): Promise<string> {
  return (await isModuleProject(dir))
    ? "colophon.config.js"
    : "colophon.config.mjs";
}
