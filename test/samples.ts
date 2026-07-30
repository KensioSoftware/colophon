/**
 * The sample images, in one place because two things render them: `pnpm
 * samples` writes them into `docs/samples/` for the README gallery, and the
 * visual regression test renders them again to compare against the committed
 * baselines. Keeping one list is what stops a template being reviewed against
 * an image nobody is looking at.
 *
 * Types are imported type-only, since `scripts/gen-samples.ts` is run straight
 * through Node's type stripping and could not resolve a `.js` specifier
 * pointing at a `.ts` file. An erased import never reaches the resolver.
 */
import type {
  ColophonConfig,
  Dimensions,
  MetaImageProps,
  ThemeName,
} from "../src/types.js";

export interface Sample {
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
    title: `${theme[0]?.toUpperCase() ?? ""}${theme.slice(1)}`,
    subtitle: `theme: "${theme}"`,
  },
  config: { theme, footer: "example.com" },
}));

const brandColors = {
  brand: "#4f46e5",
  brandDark: "#3730a3",
  brandWarm: "#db2777",
};

const brand: ColophonConfig = {
  colors: brandColors,
  footer: "kensiosoftware.co.uk",
  badge: { text: "npm" },
};

const teal: ColophonConfig = {
  colors: { brand: "#0d9488", brandDark: "#0f766e", brandWarm: "#f59e0b" },
  footer: "kensiosoftware.co.uk",
};

/** Every sample in the README gallery, themes first. */
export const samples: readonly Sample[] = [
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
    // The brand colours without the badge, which the landscape has no room
    // for. Spelled out rather than spread over `brand`, since a `badge` set to
    // `undefined` is not the same as one that was never there.
    config: {
      colors: brandColors,
      footer: "kensiosoftware.co.uk",
      code: { theme: "night-owl" },
    },
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
