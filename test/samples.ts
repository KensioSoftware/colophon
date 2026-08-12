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

/**
 * The pictures the gallery needs, drawn rather than committed as files: an
 * author's photograph, a project's mark, and a landscape for the `photo`
 * template to set its title over. Shapes in an SVG keep the sample list
 * self-contained, and the templates only ever see a `data:` URI or bytes.
 */
function svgText(body: string, size = 64): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${String(size)}"` +
    ` height="${String(size)}" viewBox="0 0 64 64">${body}</svg>`
  );
}

/** As the `data:` URI an image prop takes. */
function svgUri(body: string, size = 64): string {
  return `data:image/svg+xml,${encodeURIComponent(svgText(body, size))}`;
}

/** As the bytes a configured image source takes. */
function svgBytes(body: string): Uint8Array {
  return new TextEncoder().encode(svgText(body));
}

const avatar = svgUri(
  '<rect width="64" height="64" fill="#fbbf24" />' +
    '<circle cx="32" cy="26" r="11" fill="#78350f" />' +
    '<path d="M8 64a24 24 0 0 1 48 0z" fill="#78350f" />',
);

const mark = svgBytes(
  '<circle cx="32" cy="32" r="26" fill="none" stroke="#ffffff"' +
    ' stroke-width="7" /><circle cx="32" cy="32" r="8" fill="#ffffff" />',
);

const scene = svgUri(
  '<rect width="64" height="64" fill="#1e3a8a" />' +
    '<circle cx="46" cy="14" r="9" fill="#fef9c3" />' +
    '<path d="M0 44l18-16 14 12 12-9 20 17v16H0z" fill="#065f46" />',
  512,
);

/**
 * The one texture worth a picture in the docs, since it is the only one that
 * is not a tile and so the only one whose shape follows the proportions of the
 * image. It is a swatch for the reason the themes are, and because a texture
 * of curves is expensive to store at full size.
 */
const wavesSample: Sample = {
  name: "texture-waves",
  dimensions: swatch,
  props: {
    template: "card",
    title: "Waves",
    subtitle: 'texture: { type: "waves" }',
  },
  config: {
    colors: { brand: "#16a34a", brandDark: "#115e59" },
    texture: { type: "waves" },
    footer: "example.com",
  },
};

/**
 * The `code` template with everything it can put around a snippet: the window
 * bar, a filename in it, and numbered lines. It is one image rather than three
 * because they are one look, and because the docs page for the template shows
 * it as the thing they add up to.
 */
const codeWindowSample: Sample = {
  name: "code-window",
  dimensions: wide,
  props: {
    template: "code",
    language: "javascript",
    filename: "search.js",
    code: `fetch('/search', {
  method: 'QUERY',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    filters: { status: 'active', price: { max: 100 } }
  })
})`,
  },
  config: {
    colors: { brand: "#16a34a", brandDark: "#115e59" },
    texture: { type: "waves" },
    footer: "example.com",
    code: { chrome: "mono", lineNumbers: true },
  },
};

/** Every sample in the README gallery, themes first. */
export const samples: readonly Sample[] = [
  ...themeSamples,
  wavesSample,
  codeWindowSample,
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
  {
    name: "article-wide",
    dimensions: wide,
    props: {
      template: "article",
      tags: ["typescript", "testing"],
      title: "Keep test state inside each test case",
      subtitle:
        "Shared fixtures save a few lines and cost you the ability to read " +
        "one test on its own",
      author: "Hugh Grigg",
      date: "30 July 2026",
      avatar,
    },
    config: brand,
  },
  {
    name: "quote-square",
    dimensions: square,
    props: {
      template: "quote",
      quote:
        "A template is a layout, and a layout is arithmetic you can look at.",
      author: "Hugh Grigg",
      role: "Kensio Software",
      avatar,
    },
    config: teal,
  },
  {
    name: "terminal-wide",
    dimensions: wide,
    props: {
      template: "terminal",
      title: "colophon",
      command: "colophon build content --force",
      output:
        "rendered 14 images from 7 posts\n" +
        "wrote content/posts/hello/hello-og.png\n" +
        "done in 1.9s",
    },
    config: {
      colors: { brand: "#0f172a", brandDark: "#020617", brandWarm: "#38bdf8" },
      footer: "kensiosoftware.co.uk",
    },
  },
  {
    name: "release-square",
    dimensions: square,
    props: {
      template: "release",
      version: "2.5.0",
      title: "Templates, themes and a browser-safe core",
      changes: [
        "Nine more templates",
        "Per-size config overrides",
        "A manifest of every image a build wrote",
        "Signed URLs for rendering on demand",
      ],
    },
    config: teal,
  },
  {
    name: "stat-square",
    dimensions: square,
    props: {
      template: "stat",
      title: "Downloads this month",
      stat: "1.4M",
      subtitle: "Up from 900k in June, mostly from CI",
    },
    config: teal,
  },
  {
    name: "photo-wide",
    dimensions: wide,
    props: {
      template: "photo",
      title: "A morning on the Mendips",
      subtitle: "Twelve miles, one flask of tea",
      image: scene,
    },
    config: { footer: "kensiosoftware.co.uk" },
  },
  {
    name: "wordmark-wide",
    dimensions: wide,
    props: {
      template: "wordmark",
      title: "@kensio/colophon",
      subtitle: "Social meta images from frontmatter",
    },
    config: {
      colors: brandColors,
      footer: "kensiosoftware.co.uk",
      logo: { data: mark },
    },
  },
  {
    name: "docs-wide",
    dimensions: wide,
    props: {
      template: "docs",
      breadcrumb: ["Docs", "Configuration", "Fonts"],
      title: "Fonts",
      subtitle: "Load font files so a build renders the same image everywhere",
    },
    config: { colors: brandColors, footer: "colophonjs.dev" },
  },
  {
    name: "event-square",
    dimensions: square,
    props: {
      template: "event",
      date: "14 November 2026",
      title: "Rendering text without a browser",
      location: "Bristol JS, The Old Fire Station",
    },
    config: {
      colors: { brand: "#b91c1c", brandDark: "#7f1d1d", brandWarm: "#f59e0b" },
      footer: "kensiosoftware.co.uk",
    },
  },
];
