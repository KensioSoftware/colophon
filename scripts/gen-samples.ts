/**
 * Regenerate the sample images shown in the README.
 *
 * Run with `pnpm samples` (which builds first). Each entry in `test/samples.ts`
 * renders one image into `docs/samples/`; commit the results so the README
 * gallery stays in sync with the templates.
 *
 * The list is shared with the visual regression test, which renders the same
 * samples with pinned fonts and compares them against `test/baselines/`. This
 * script renders them as a project would, with whatever fonts the machine has,
 * because the gallery is a shop window rather than a fixture.
 *
 * The `.ts` extension on the sample import is deliberate: Node runs this file
 * through type stripping rather than a compiler, so the specifier has to name
 * the file that is actually there.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { renderMetaImages } from "../dist/index.js";
import { samples } from "../test/samples.ts";

const outputDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "docs",
  "samples",
);

await mkdir(outputDir, { recursive: true });

const written = await Promise.all(
  samples.map(async (sample) => {
    const [image] = await renderMetaImages(sample.props, {
      ...sample.config,
      sizes: [{ name: sample.name, ...sample.dimensions }],
    });

    if (image === undefined) {
      throw new Error(`No image rendered for sample "${sample.name}"`);
    }

    const file = path.join(outputDir, `${sample.name}.png`);
    await writeFile(file, image.png);
    return path.relative(process.cwd(), file);
  }),
);

for (const file of written.toSorted((a, b) => a.localeCompare(b))) {
  console.log(`wrote ${file}`);
}
