import {
  assertArrayLength,
  assertIdentical,
  assertNonNullable,
  assertNumberBetween,
  assertStringIncludes,
  assertStringNotIncludes,
  assertTrue,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import {
  baselines,
  renderTemplate as render,
  samplePng,
  wide,
} from "../test/template.js";
import {
  articleTemplate,
  photoTemplate,
  quoteTemplate,
} from "./templates/index.js";

describe("articleTemplate", () => {
  it("draws tags, the headline, the byline and the site's footer", async () => {
    const svg = await render(
      articleTemplate,
      {
        template: "article",
        tags: ["typescript", "testing"],
        title: "Keep test state inside each test case",
        subtitle: "Shared fixtures cost more than they save",
        author: "Hugh Grigg",
        date: "30 July 2026",
      },
      { footer: "example.com" },
    );

    assertStringIncludes(svg, ">typescript</text>");
    assertStringIncludes(svg, ">testing</text>");
    assertStringIncludes(svg, ">Keep test state<");
    assertStringIncludes(svg, ">Hugh Grigg · 30 July 2026</text>");
    assertStringIncludes(svg, ">example.com</text>");
  });

  it("takes a single tag written as a scalar", async () => {
    const svg = await render(articleTemplate, {
      template: "article",
      tags: "release",
      title: "t",
    });

    assertStringIncludes(svg, ">release</text>");
  });

  it("drops the date rather than cutting the byline in half", async () => {
    const svg = await render(
      articleTemplate,
      {
        template: "article",
        title: "t",
        author: "Hugh Grigg",
        date: "30 July 2026",
      },
      { footer: "a-longer-domain.example.com" },
    );

    assertStringIncludes(svg, ">Hugh Grigg</text>");
    assertStringNotIncludes(svg, "30 July");
  });

  it("gives up the byline entirely when the footer leaves no room", async () => {
    const svg = await render(
      articleTemplate,
      { template: "article", title: "t", author: "Hugh Grigg" },
      { footer: `a-domain-of-${"considerable-".repeat(8)}length.example.com` },
    );

    // Nothing but the mark saying a name was cut. What this must not do is
    // cut from the wrong end of the name and draw it over the footer.
    assertStringIncludes(svg, ">…</text>");
    assertStringNotIncludes(svg, "Grigg");
  });

  it("puts the byline and the footer at opposite ends of one line", async () => {
    const svg = await render(
      articleTemplate,
      { template: "article", title: "t", author: "Hugh" },
      { footer: "example.com" },
      wide,
    );

    const byline = /<text x="(\d+)" y="(\d+)"[^>]*>Hugh</.exec(svg);
    const footer = /<text x="(\d+)" y="(\d+)"[^>]*>example\.com</.exec(svg);

    assertNonNullable(byline);
    assertNonNullable(footer);
    assertTrue(Number(byline[1]) < Number(footer[1]));
    assertIdentical(byline[2], footer[2]);
  });

  it("draws the avatar beside the byline rather than beside the footer", async () => {
    const svg = await render(
      articleTemplate,
      {
        template: "article",
        title: "t",
        author: "Hugh",
        avatar: samplePng,
      },
      { footer: "example.com" },
    );

    assertStringIncludes(svg, 'clip-path="url(#colophon-byline)"');
    assertStringNotIncludes(svg, "colophon-avatar");
  });
});

describe("quoteTemplate", () => {
  it("draws the mark, the quotation and who said it", async () => {
    const svg = await render(quoteTemplate, {
      template: "quote",
      quote: "A layout is arithmetic you can look at.",
      author: "Hugh Grigg",
      role: "Kensio Software",
    });

    assertStringIncludes(svg, ">“</text>");
    assertStringIncludes(svg, ">A layout is<");
    assertStringIncludes(svg, ">— Hugh Grigg, Kensio Software</text>");
  });

  it("falls back to the title when there is no quote prop", async () => {
    const svg = await render(quoteTemplate, {
      template: "quote",
      title: "Said in the title instead",
    });

    assertStringIncludes(svg, ">Said in the title<");
  });

  it("gives the words the room back when nobody is named", async () => {
    const attributed = baselines(
      await render(quoteTemplate, {
        template: "quote",
        quote: "Short enough",
        author: "Hugh",
      }),
    );
    const alone = baselines(
      await render(quoteTemplate, { template: "quote", quote: "Short enough" }),
    );

    // One line of quotation either way, and it sits lower when the attribution
    // under it is not taking a share of the middle.
    assertArrayLength(alone, 1);
    // The quotation and the line naming the speaker.
    assertArrayLength(attributed, 2);
    assertTrue(alone[0] > attributed[0]);
  });
});

describe("photoTemplate", () => {
  it("draws the picture, a scrim over it and the title at the bottom", async () => {
    const svg = await render(
      photoTemplate,
      {
        template: "photo",
        title: "A morning on the Mendips",
        subtitle: "Twelve miles",
        image: samplePng,
      },
      { footer: "example.com" },
    );

    assertStringIncludes(svg, '<image x="0" y="0" width="1200"');
    assertStringIncludes(svg, 'id="colophon-photo-scrim"');
    assertStringIncludes(svg, ">A morning on");
    assertStringIncludes(svg, ">example.com</text>");
  });

  it("renders over the background when the post has no picture", async () => {
    const svg = await render(photoTemplate, {
      template: "photo",
      title: "No photograph here",
    });

    assertStringNotIncludes(svg, "<image");
    assertStringNotIncludes(svg, "colophon-photo-scrim");
    assertStringIncludes(svg, ">No photograph<");
  });

  it("sets the text along the bottom of the image", async () => {
    const svg = await render(photoTemplate, {
      template: "photo",
      title: "Down here",
      image: samplePng,
    });

    // Bottom-aligned in the content area rather than centred in it.
    assertNumberBetween(baselines(svg).at(-1) ?? 0, 1000, 1110);
  });
});
