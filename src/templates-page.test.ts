import {
  assertArrayLength,
  assertNumberBetween,
  assertStringIncludes,
  assertStringNotIncludes,
  assertTrue,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import {
  renderTemplate as render,
  samplePng,
  sansFont,
  titleSize,
} from "../test/template.js";
import {
  docsTemplate,
  eventTemplate,
  thumbnailTemplate,
} from "./templates/index.js";

/** The size YouTube asks a video thumbnail to be uploaded at. */
const thumbnail = { width: 1280, height: 720 };

/** Rendered with a real font, since what this layout does is measure text. */
const measured = { fonts: [{ family: "DejaVu Sans", path: sansFont }] };

describe("docsTemplate", () => {
  it("draws the trail, a rule and the page's title", async () => {
    const svg = await render(
      docsTemplate,
      {
        template: "docs",
        breadcrumb: ["Docs", "Configuration", "Fonts"],
        title: "Fonts",
        subtitle: "Load font files so a build renders the same image",
      },
      { footer: "colophonjs.dev" },
    );

    assertStringIncludes(svg, ">Docs / Configuration / Fonts</text>");
    assertStringIncludes(svg, ">Fonts</text>");
    assertStringIncludes(svg, ">colophonjs.dev</text>");
    assertArrayLength(svg.match(/<rect/g), 1);
  });

  it("takes a trail written as one string", async () => {
    const svg = await render(docsTemplate, {
      template: "docs",
      breadcrumb: "Docs / Fonts",
      title: "t",
    });

    assertStringIncludes(svg, ">Docs / Fonts</text>");
  });

  it("drops the leading segments of a trail too long to fit", async () => {
    const svg = await render(docsTemplate, {
      template: "docs",
      breadcrumb: [
        "A documentation site",
        "With a deep tree",
        "And long section names",
        "Down to this page",
      ],
      title: "t",
    });

    assertStringIncludes(svg, "…");
    assertStringIncludes(svg, "Down to this page</text>");
    assertStringNotIncludes(svg, ">A documentation site");
  });

  it("cuts a lone segment with nothing left to drop", async () => {
    const svg = await render(docsTemplate, {
      template: "docs",
      breadcrumb: `A section named at ${"considerable ".repeat(12)}length`,
      title: "t",
    });

    assertStringIncludes(svg, "…</text>");
    assertStringNotIncludes(svg, "length</text>");
  });

  it("draws no rule where the post named no trail", async () => {
    const svg = await render(docsTemplate, { template: "docs", title: "t" });

    assertStringNotIncludes(svg, "<rect");
    assertArrayLength(svg.match(/<text/g), 1);
  });

  it("clears the logo as well as the trail", async () => {
    const svg = await render(
      docsTemplate,
      { template: "docs", breadcrumb: ["Docs"], title: "t" },
      { logo: { path: samplePng } },
    );

    const title = /<text x="\d+" y="(\d+)"[^>]*>t</.exec(svg);
    // The logo is 90 tall from a 90 margin, so a title above 180 would be
    // sitting on top of it.
    assertTrue(Number(title?.[1]) > 180);
  });
});

describe("eventTemplate", () => {
  it("draws the date on a plate, then the title and the location", async () => {
    const svg = await render(
      eventTemplate,
      {
        template: "event",
        date: "14 November 2026",
        title: "Rendering text without a browser",
        location: "Bristol JS",
      },
      { footer: "example.com" },
    );

    assertStringIncludes(svg, ">14 November 2026</text>");
    assertStringIncludes(svg, ">Rendering text<");
    assertStringIncludes(svg, ">Bristol JS</text>");
    // The plate, and nothing else on the image that is a rectangle.
    assertArrayLength(svg.match(/<rect/g), 1);
  });

  it("fills the plate with the accent colour", async () => {
    const svg = await render(
      eventTemplate,
      { template: "event", date: "Today", title: "t" },
      { colors: { brand: "#0d9488", brandWarm: "#f59e0b" } },
    );

    assertStringIncludes(svg, 'fill="#f59e0b"');
  });

  it("draws no plate where the post named no date", async () => {
    const svg = await render(eventTemplate, { template: "event", title: "t" });

    assertStringNotIncludes(svg, "<rect");
    assertArrayLength(svg.match(/<text/g), 1);
  });
});

describe("thumbnailTemplate", () => {
  it("draws the title and nothing else the post did not ask for", async () => {
    const svg = await render(
      thumbnailTemplate,
      { template: "thumbnail", title: "Ship it" },
      measured,
      thumbnail,
    );

    assertStringIncludes(svg, ">Ship it</text>");
    assertArrayLength(svg.match(/<text/g), 1);
  });

  it("sets a short title far larger than a long one", async () => {
    // The point of the template. Both titles are given the same frame, and
    // what decides the size is how much there is to fit into it, where every
    // other built-in would have drawn both at the same fraction of the height.
    const short = await render(
      thumbnailTemplate,
      { template: "thumbnail", title: "Ship it" },
      measured,
      thumbnail,
    );
    const long = await render(
      thumbnailTemplate,
      {
        template: "thumbnail",
        title:
          "Everything I learned building a static site image generator over " +
          "three years",
      },
      measured,
      thumbnail,
    );

    assertNumberBetween(titleSize(long), 90, 130);
    assertNumberBetween(titleSize(short), titleSize(long) * 2, 360);
  });

  it("keeps one long word whole rather than breaking it across lines", async () => {
    const svg = await render(
      thumbnailTemplate,
      { template: "thumbnail", title: "Frontmatter" },
      measured,
      thumbnail,
    );

    assertStringIncludes(svg, ">Frontmatter</text>");
  });

  it("gives the title back the room a missing subtitle would have taken", async () => {
    const alone = await render(
      thumbnailTemplate,
      { template: "thumbnail", title: "Measuring text without a browser" },
      measured,
      thumbnail,
    );
    const captioned = await render(
      thumbnailTemplate,
      {
        template: "thumbnail",
        title: "Measuring text without a browser",
        subtitle: "Episode 4",
      },
      measured,
      thumbnail,
    );

    assertStringIncludes(captioned, ">Episode 4</text>");
    assertTrue(titleSize(alone) > titleSize(captioned));
  });

  it("draws the configured footer and logo along with it", async () => {
    const svg = await render(
      thumbnailTemplate,
      { template: "thumbnail", title: "Ship it" },
      { ...measured, footer: "example.com", logo: { path: samplePng } },
      thumbnail,
    );

    assertStringIncludes(svg, ">example.com</text>");
    assertArrayLength(svg.match(/<image/g), 1);
  });
});
