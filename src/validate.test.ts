import path from "node:path";

import {
  assertIdentical,
  assertStringIncludes,
  assertStringNotIncludes,
  assertThrowsError,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import type { ColophonConfig } from "./types.js";
import { validateConfig } from "./validate/index.js";

const sansFont = path.join(
  process.cwd(),
  "node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf",
);

/** Validate a config that TypeScript would (rightly) refuse to accept. */
function validateLoosely(config: unknown): void {
  validateConfig(config as ColophonConfig);
}

function messageFor(config: unknown): string {
  return assertThrowsError(() => {
    validateLoosely(config);
  }).message;
}

describe("validateConfig", () => {
  it("accepts a config using every option", () => {
    const config: ColophonConfig = {
      colors: {
        brand: "#2563eb",
        brandDark: "#1e3a8a",
        brandWarm: "#f59e0b",
        foreground: "#ffffff",
      },
      background: {
        type: "gradient",
        stops: [{ offset: "0%", color: "#000000" }],
        from: { x: 0, y: 0 },
        to: { x: 1, y: 1 },
      },
      fonts: [
        { family: "DejaVu Sans", path: sansFont },
        { data: new Uint8Array([1, 2, 3]) },
      ],
      systemFonts: true,
      fontFamily: "DejaVu Sans",
      footer: "example.com",
      badge: { text: "npm", color: "#fff", background: "#000" },
      code: {
        theme: "github-dark",
        fontFamily: "Menlo",
        lineHeight: 1.55,
        tabSize: 2,
        cornerScale: 0.025,
        maxFontScale: 0.075,
        minFontScale: 0.025,
      },
      onWarning: () => undefined,
      theme: "midnight",
      texture: { type: "grain", opacity: 0.1, scale: 1.4 },
      sizes: [{ name: "square", width: 1200, height: 1200 }],
      templates: {},
      content: { slugStrategy: "route" },
      placement: { strategy: "public-dir", dir: "public/og", urlBase: "/og" },
      extra: [
        {
          props: { template: "banner", title: "@kensio/colophon" },
          output: "docs/npm-card.png",
          size: { name: "square", width: 1200, height: 1200 },
        },
      ],
    };

    validateConfig(config);
  });

  it("accepts an empty config", () => {
    validateConfig({});
  });

  it("rejects an unknown option and suggests the nearest one", () => {
    assertIdentical(
      messageFor({ colours: { brand: "#000" } }),
      'Unknown option "colours". Did you mean "colors"?',
    );
  });

  it("suggests the current name of a renamed option", () => {
    assertIdentical(
      messageFor({ dimensions: [{ width: 1200, height: 1200 }] }),
      'Unknown option "dimensions". Did you mean "sizes"?',
    );
  });

  it("says why a removed option is gone rather than guessing at it", () => {
    const message = messageFor({ code: { charWidthRatio: 0.6 } });

    assertStringIncludes(
      message,
      'Option "code.charWidthRatio" has been removed:',
    );
    assertStringIncludes(message, "measured from the font");
    assertStringNotIncludes(message, "Did you mean");
  });

  it("checks an image background, its source and its scrim", () => {
    assertIdentical(
      messageFor({
        background: { type: "image", source: { path: "a.png" }, fitt: "cover" },
      }),
      'Unknown option "background.fitt". Did you mean "fit"?',
    );
    assertIdentical(
      messageFor({
        background: { type: "image", source: { pathh: "a.png" } },
      }),
      'Unknown option "background.source.pathh". Did you mean "path"?',
    );
    assertIdentical(
      messageFor({
        background: {
          type: "image",
          source: { path: "a.png" },
          scrim: { form: 1 },
        },
      }),
      'Unknown option "background.scrim.form". Did you mean "from"?',
    );
  });

  it("rejects a background fit that is neither of the two", () => {
    assertIdentical(
      messageFor({
        background: { type: "image", source: { path: "a.png" }, fit: "crop" },
      }),
      'Unknown background fit "crop". Valid fits: cover, contain.',
    );
  });

  it("checks the logo", () => {
    assertIdentical(
      messageFor({ logo: { pat: "logo.png" } }),
      'Unknown option "logo.pat". Did you mean "path"?',
    );
  });

  it("lists the valid options when nothing is close", () => {
    const message = messageFor({ wibble: true });

    assertStringIncludes(message, 'Unknown option "wibble". Valid options');
    assertStringIncludes(
      message,
      "sizes, templates, rasteriser, compressionLevel, content, placement,",
    );
    assertStringNotIncludes(message, "Did you mean");
  });

  it("names a nested option by its path", () => {
    assertIdentical(
      messageFor({ colors: { brand: "#000", brnad: "#111" } }),
      'Unknown option "colors.brnad". Did you mean "brand"?',
    );
  });

  it("treats a miscased option as a typo", () => {
    assertIdentical(
      messageFor({ code: { tabsize: 4 } }),
      'Unknown option "code.tabsize". Did you mean "tabSize"?',
    );
  });

  it("checks the badge", () => {
    assertIdentical(
      messageFor({ badge: { text: "npm", colour: "#fff" } }),
      'Unknown option "badge.colour". Did you mean "color"?',
    );
  });

  it("names the size an unknown option came from", () => {
    assertIdentical(
      messageFor({
        sizes: [
          { name: "og", width: 1200, height: 630 },
          { name: "square", width: 1200, heigth: 1200 },
        ],
      }),
      'Unknown option "sizes[1].heigth". Did you mean "height"?',
    );
  });

  it("checks fonts against both of their forms", () => {
    assertIdentical(
      messageFor({ fonts: [{ familly: "DejaVu Sans", path: sansFont }] }),
      'Unknown option "fonts[0].familly". Did you mean "family"?',
    );

    validateLoosely({
      fonts: [{ path: sansFont }, { data: new Uint8Array() }],
    });
  });

  it("checks a solid background", () => {
    assertIdentical(
      messageFor({ background: { type: "solid", colour: "#f00" } }),
      'Unknown option "background.colour". Did you mean "color"?',
    );
  });

  it("checks a gradient's stops and its end points", () => {
    const message = messageFor({
      background: {
        type: "gradient",
        stops: [{ ofset: "0%", color: "#000" }],
        to: { x: 1, z: 1 },
      },
    });

    assertStringIncludes(
      message,
      '"background.stops[0].ofset". Did you mean "offset"?',
    );
    assertStringIncludes(
      message,
      '"background.to.z". Valid options here: x, y.',
    );
  });

  it("rejects a misspelt background type", () => {
    assertIdentical(
      messageFor({ background: { type: "gradiant", stops: [] } }),
      'Unknown background type "gradiant". Did you mean "gradient"?',
    );
  });

  it("lists the background types when nothing is close", () => {
    assertIdentical(
      messageFor({ background: { type: "plaid" } }),
      'Unknown background type "plaid". Valid types: solid, gradient, mesh, image.',
    );
  });

  it("checks a mesh background and each of its blobs", () => {
    assertIdentical(
      messageFor({
        background: {
          type: "mesh",
          color: "#000",
          blobs: [{ colour: "#fff" }],
        },
      }),
      'Unknown option "background.blobs[0].colour". Did you mean "color"?',
    );
  });

  it("checks a texture against the keys of the treatment it names", () => {
    assertIdentical(
      messageFor({ texture: { type: "dots", gapp: 40 } }),
      'Unknown option "texture.gapp". Did you mean "gap"?',
    );
    // `angle` belongs to ruled lines rather than to a dot grid, so it is an
    // unknown option here rather than one that quietly does nothing.
    assertStringIncludes(
      messageFor({ texture: { type: "dots", angle: 45 } }),
      'Unknown option "texture.angle"',
    );
  });

  it("checks ruled lines against their own keys", () => {
    assertIdentical(
      messageFor({ texture: { type: "rules", anlge: 30 } }),
      'Unknown option "texture.anlge". Did you mean "angle"?',
    );
  });

  it("rejects a texture type it would otherwise draw as ruled lines", () => {
    assertIdentical(
      messageFor({ texture: { type: "noise" } }),
      'Unknown texture type "noise". Valid types: grain, dots, rules.',
    );
  });

  it("rejects a theme that does not exist", () => {
    assertIdentical(
      messageFor({ theme: "midnigt" }),
      'Unknown theme "midnigt". Did you mean "midnight"?',
    );
    assertStringIncludes(
      messageFor({ theme: "chartreuse" }),
      "Valid themes: midnight, aurora,",
    );
  });

  it("rejects an unknown theme on one output size too", () => {
    assertIdentical(
      messageFor({
        sizes: [{ name: "og", width: 1200, height: 630, theme: "papper" }],
      }),
      'Unknown theme "papper". Did you mean "paper"?',
    );
  });

  it("leaves a background with no type alone", () => {
    // The type is what says which keys apply, so there is nothing to check it
    // against; `backgroundSvg` renders this as the gradient it looks like.
    validateLoosely({
      background: { stops: [{ offset: "0%", color: "#000" }] },
    });
  });

  it("allows any template name", () => {
    validateConfig({
      templates: { "my-own-thing": { name: "my-own-thing", render: () => "" } },
    });
  });

  it("accepts the content options", () => {
    validateConfig({
      content: {
        propsKey: "og",
        templateField: "layout",
        defaultTemplate: "banner",
        props: (frontmatter) => ({ title: frontmatter["title"] }),
        slugField: "permalink",
        slugStrategy: "route",
        extensions: [".md"],
      },
    });
  });

  it("rejects a mistyped slug strategy rather than routing the whole site", () => {
    assertIdentical(
      messageFor({ content: { slugStrategy: "rout" } }),
      'Unknown slug strategy "rout". Did you mean "route"?',
    );
  });

  it("lists the slug strategies when nothing is close", () => {
    assertStringIncludes(
      messageFor({ content: { slugStrategy: "by-title" } }),
      "Valid strategies: basename, route.",
    );
  });

  it("suggests the right key for a mistyped content option", () => {
    assertIdentical(
      messageFor({ content: { defaultTemplat: "banner" } }),
      'Unknown option "content.defaultTemplat". Did you mean "defaultTemplate"?',
    );
  });

  it("accepts the overrides a size may carry", () => {
    validateConfig({
      sizes: [
        {
          name: "square",
          width: 1200,
          height: 1200,
          code: { minFontScale: 0.011 },
          colors: { brand: "#0d9488" },
          badge: { text: "beta" },
          background: { type: "solid", color: "#000000" },
          footer: "example.com",
          fontFamily: "Georgia, serif",
        },
      ],
    });
  });

  it("names the size a mistyped override belongs to", () => {
    const message = messageFor({
      sizes: [
        { name: "og", width: 1200, height: 630 },
        {
          name: "square",
          width: 1200,
          height: 1200,
          code: { minFontScal: 0.011 },
        },
      ],
    });

    assertIdentical(
      message,
      'Unknown option "sizes[1].code.minFontScal". Did you mean "minFontScale"?',
    );
  });

  it("checks a background nested in a size", () => {
    const message = messageFor({
      sizes: [
        {
          name: "og",
          width: 1200,
          height: 630,
          background: { type: "solid", colour: "#000000" },
        },
      ],
    });

    assertIdentical(
      message,
      'Unknown option "sizes[0].background.colour". Did you mean "color"?',
    );
  });

  it("rejects config a size may not override", () => {
    const message = messageFor({
      sizes: [{ name: "og", width: 1200, height: 630, systemFonts: true }],
    });

    // Fonts are loaded once for every size, so overriding them per size would
    // be a setting that silently did nothing.
    assertStringIncludes(message, 'Unknown option "sizes[0].systemFonts"');
  });

  it("checks a placement against the strategy it declares", () => {
    assertIdentical(
      messageFor({
        placement: { strategy: "public-dir", dir: "public/og", urlbase: "/og" },
      }),
      'Unknown option "placement.urlbase". Did you mean "urlBase"?',
    );
  });

  it("rejects a placement strategy that does not exist", () => {
    assertIdentical(
      messageFor({ placement: { strategy: "public-dirs" } }),
      'Unknown placement strategy "public-dirs". Did you mean "public-dir"?',
    );
  });

  it("rejects a placement that does not say which strategy it is", () => {
    // Without one there is nothing to say which keys apply, and the images
    // would go somewhere else entirely while the config read correctly.
    assertStringIncludes(
      messageFor({ placement: { dir: "public/og", urlBase: "/og" } }),
      'placement needs a "strategy"',
    );
  });

  it("names the extra image an unknown option came from", () => {
    assertIdentical(
      messageFor({
        extra: [
          { props: { template: "banner" }, output: "card.png" },
          { props: { template: "banner" }, outptu: "card.png" },
        ],
      }),
      'Unknown option "extra[1].outptu". Did you mean "output"?',
    );
  });

  it("checks the size an extra image renders at", () => {
    assertIdentical(
      messageFor({
        extra: [
          {
            props: { template: "banner" },
            output: "card.png",
            size: { name: "card", width: 1200, height: 1200, footr: "x" },
          },
        ],
      }),
      'Unknown option "extra[0].size.footr". Did you mean "footer"?',
    );
  });

  it("collects every problem into one error", () => {
    const message = messageFor({
      dimensions: [],
      colors: { brand: "#000", forground: "#fff" },
      code: { tabsize: 4 },
    });

    assertStringIncludes(message, "Invalid config:");
    assertStringIncludes(message, '  - Unknown option "dimensions"');
    assertStringIncludes(message, '  - Unknown option "colors.forground"');
    assertStringIncludes(message, '  - Unknown option "code.tabsize"');
  });
});
