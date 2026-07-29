/**
 * Regenerate the sample images shown in the README.
 *
 * Run with `pnpm samples` (which builds first). Each entry renders one image
 * into `docs/samples/`; commit the results so the README gallery stays in sync
 * with the templates.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  renderMetaImages,
  type ColophonConfig,
  type Dimensions,
  type MetaImageProps,
  type ThemeName,
} from "../dist/index.js";

interface Sample {
  readonly name: string;
  readonly dimensions: Dimensions;
  readonly props: MetaImageProps;
  readonly config: ColophonConfig;
}

const square: Dimensions = { width: 1200, height: 1200 };
const wide: Dimensions = { width: 1200, height: 630 };

/**
 * The theme gallery is rendered small, since eight of them go in one table and
 * a reader is comparing looks rather than reading the type.
 */
const swatch: Dimensions = { width: 640, height: 336 };

const themeNames: readonly ThemeName[] = [
  "midnight",
  "aurora",
  "ember",
  "forest",
  "bloom",
  "slate",
  "paper",
  "sandstone",
];

/**
 * One image per theme, everything but the theme held constant, so the gallery
 * compares the themes rather than the templates.
 */
const themeSamples: readonly Sample[] = themeNames.map((theme) => ({
  name: `theme-${theme}`,
  dimensions: swatch,
  props: {
    template: "card",
    title: theme[0]?.toUpperCase() + theme.slice(1),
    subtitle: `theme: "${theme}"`,
  },
  config: { theme, footer: "example.com" },
}));

const brand: ColophonConfig = {
  colors: { brand: "#4f46e5", brandDark: "#3730a3", brandWarm: "#db2777" },
  footer: "kensiosoftware.co.uk",
  badge: { text: "npm" },
};

const teal: ColophonConfig = {
  colors: { brand: "#0d9488", brandDark: "#0f766e", brandWarm: "#f59e0b" },
  footer: "kensiosoftware.co.uk",
};

const samples: readonly Sample[] = [
  ...themeSamples,
  {
    name: "banner-square",
    dimensions: square,
    props: {
      template: "banner",
      title: "@kensio/colophon",
      subtitle: "Generate social meta images for posts from frontmatter",
      version: "1.2.0",
    },
    config: brand,
  },
  {
    name: "banner-wide",
    dimensions: wide,
    props: {
      template: "banner",
      title: "@kensio/colophon",
      subtitle: "Generate social meta images for posts from frontmatter",
      version: "1.2.0",
    },
    config: brand,
  },
  {
    name: "card-square",
    dimensions: square,
    props: {
      template: "card",
      title: "Making a printer's colophon",
      subtitle: "A short note on branded share images",
    },
    config: teal,
  },
  {
    name: "code-square",
    dimensions: square,
    props: {
      template: "code",
      language: "bash",
      code: `#!/usr/bin/env bash

mapfile -t CHANGED_TS < <(
  git diff origin/main --name-only \\
    | grep '\\.ts'
)

if (( \${#CHANGED_TS[@]} )); then
  eslint "\${CHANGED_TS[@]}"
fi`,
    },
    config: teal,
  },
  {
    name: "code-wide",
    dimensions: wide,
    props: {
      template: "code",
      language: "typescript",
      code: `export const cardTemplate: Template = {
  name: "card",
  render({ props, config, dimensions }) {
    return textElement(props.title, { ...attrs });
  },
};`,
    },
    config: { ...brand, badge: undefined, code: { theme: "night-owl" } },
  },
  {
    name: "card-wide-solid",
    dimensions: wide,
    props: {
      template: "card",
      title: "A quieter, solid-background card",
    },
    config: {
      background: { type: "solid", color: "#0f172a" },
      colors: { brand: "#0f172a", foreground: "#f8fafc" },
      footer: "kensiosoftware.co.uk",
    },
  },
];

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
