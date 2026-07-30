import {
  assertArrayLength,
  assertNumberBetween,
  assertStringIncludes,
  assertStringNotIncludes,
  assertTrue,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import {
  baselineOf,
  renderTemplate as render,
  samplePng,
  titleSize,
} from "../test/template.js";
import {
  releaseTemplate,
  statTemplate,
  wordmarkTemplate,
} from "./templates/index.js";

describe("releaseTemplate", () => {
  it("leads with the version and lists the changes", async () => {
    const svg = await render(
      releaseTemplate,
      {
        template: "release",
        version: "2.5.0",
        title: "Templates and themes",
        changes: ["Nine more templates", "A manifest of every image"],
      },
      { footer: "example.com" },
    );

    assertStringIncludes(svg, ">v2.5.0</text>");
    assertStringIncludes(svg, ">Templates and themes</text>");
    assertStringIncludes(svg, ">Nine more templates</text>");
    assertStringIncludes(svg, ">A manifest of every image</text>");
    // One bullet per change, and nothing else on the image is a rectangle.
    assertArrayLength(svg.match(/<rect/g), 2);
  });

  it("leaves a version that already carries its own v alone", async () => {
    const svg = await render(releaseTemplate, {
      template: "release",
      version: "v3.0.0-rc.1",
    });

    assertStringIncludes(svg, ">v3.0.0-rc.1</text>");
    assertStringNotIncludes(svg, ">vv3");
  });

  it("draws only the four changes there is room to read", async () => {
    const svg = await render(releaseTemplate, {
      template: "release",
      version: "1.0.0",
      changes: ["one", "two", "three", "four", "five", "six"],
    });

    assertStringIncludes(svg, ">four</text>");
    assertStringNotIncludes(svg, ">five</text>");
  });

  it("cuts a change too long for the width it has", async () => {
    const svg = await render(releaseTemplate, {
      template: "release",
      version: "1.0.0",
      changes: [`a change described at ${"considerable ".repeat(12)}length`],
    });

    assertStringIncludes(svg, "…</text>");
    assertStringNotIncludes(svg, "length</text>");
  });
});

describe("statTemplate", () => {
  it("draws the label, the figure and the caption", async () => {
    const svg = await render(
      statTemplate,
      {
        template: "stat",
        title: "Downloads",
        stat: "1.4M",
        subtitle: "Up from 900k in June",
      },
      { footer: "example.com" },
    );

    assertStringIncludes(svg, ">Downloads</text>");
    assertStringIncludes(svg, ">1.4M</text>");
    assertStringIncludes(svg, ">Up from 900k in June</text>");
    assertStringIncludes(svg, 'text-anchor="middle"');
  });

  it("shrinks a long figure onto one line rather than wrapping it", async () => {
    const svg = await render(statTemplate, {
      template: "stat",
      stat: "1.4 million downloads",
    });

    assertArrayLength(svg.match(/<text/g), 1);
    assertNumberBetween(titleSize(svg), 1, 311);
  });

  it("draws the figure alone when nothing else is given", async () => {
    const svg = await render(statTemplate, { template: "stat", stat: 42 });

    assertStringIncludes(svg, ">42</text>");
    assertArrayLength(svg.match(/<text/g), 1);
  });
});

describe("wordmarkTemplate", () => {
  it("draws the logo above the name and its tagline", async () => {
    const svg = await render(
      wordmarkTemplate,
      {
        template: "wordmark",
        title: "@kensio/colophon",
        subtitle: "Social meta images from frontmatter",
      },
      { logo: { path: samplePng }, footer: "example.com" },
    );

    assertStringIncludes(svg, "<image");
    assertStringIncludes(svg, ">@kensio/colophon</text>");
    assertStringIncludes(svg, ">example.com</text>");
  });

  it("keeps a scoped package name on one line, shrinking it to get there", async () => {
    const svg = await render(wordmarkTemplate, {
      template: "wordmark",
      title: "@kensio/colophon-templates",
    });

    assertStringIncludes(svg, ">@kensio/colophon-templates</text>");
    assertNumberBetween(titleSize(svg), 1, 131);
  });

  it("cuts a name too long for the floor rather than breaking the word", async () => {
    const svg = await render(wordmarkTemplate, {
      template: "wordmark",
      title: "@a-long-organisation/an-even-longer-package-name-again",
    });

    assertArrayLength(svg.match(/<text/g), 1);
    assertStringIncludes(svg, "…</text>");
    assertStringIncludes(svg, ">@a-long-organisation/");
  });

  it("centres the name in the image when there is no logo", async () => {
    const withMark = await render(
      wordmarkTemplate,
      { template: "wordmark", title: "name" },
      { logo: { path: samplePng } },
    );
    const alone = await render(wordmarkTemplate, {
      template: "wordmark",
      title: "name",
    });

    assertStringNotIncludes(alone, "<image");
    // The mark and the name are one group, so losing the mark moves the name
    // up into the middle rather than leaving it where it was.
    assertTrue(
      baselineOf(alone, /<text x="\d+" y="(\d+)"/) <
        baselineOf(withMark, /<text x="\d+" y="(\d+)"/),
    );
  });
});
