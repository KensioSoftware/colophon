import {
  assertIdentical,
  assertStringIncludes,
  assertStringNotIncludes,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import { backgroundSvg } from "./background/index.js";

const dimensions = { width: 800, height: 400 };

describe("backgroundSvg", () => {
  it("renders a solid fill as a single rect", () => {
    const svg = backgroundSvg(
      { type: "solid", color: "#123456" },
      dimensions,
      "bg",
    );

    assertIdentical(svg, '<rect width="800" height="400" fill="#123456"/>');
  });

  it("renders a gradient with defs, stops and default direction", () => {
    const svg = backgroundSvg(
      {
        type: "gradient",
        stops: [
          { offset: "0%", color: "#000" },
          { offset: "100%", color: "#fff" },
        ],
      },
      dimensions,
      "bg",
    );

    assertStringIncludes(svg, '<linearGradient id="bg"');
    assertStringIncludes(svg, 'x1="0" y1="0" x2="1" y2="1"');
    assertStringIncludes(svg, '<stop offset="0%" stop-color="#000"/>');
    assertStringIncludes(svg, '<stop offset="100%" stop-color="#fff"/>');
    assertStringIncludes(svg, 'fill="url(#bg)"');
  });

  it("honours a custom gradient direction", () => {
    const svg = backgroundSvg(
      {
        type: "gradient",
        stops: [{ offset: "0%", color: "#000" }],
        from: { x: 0, y: 0 },
        to: { x: 1, y: 0 },
      },
      dimensions,
      "bg",
    );

    assertStringIncludes(svg, 'x1="0" y1="0" x2="1" y2="0"');
  });

  it("draws a mesh as a base colour under one rect per blob", () => {
    const svg = backgroundSvg(
      {
        type: "mesh",
        color: "#0b1020",
        blobs: [
          { color: "#4338ca", x: 0.25, y: 0.5, radius: 0.5, opacity: 0.8 },
          { color: "#7c3aed" },
        ],
      },
      dimensions,
      "bg",
    );

    assertStringIncludes(svg, 'fill="#0b1020"');
    // In user space, and off the longer side, so the fade stays circular
    // whatever the image's proportions are: 0.5 of 800 is 400.
    assertStringIncludes(
      svg,
      '<radialGradient id="bg-blob-0" gradientUnits="userSpaceOnUse" cx="200" cy="200" r="400">',
    );
    assertStringIncludes(svg, 'stop-color="#4338ca" stop-opacity="0.8"');
    assertStringIncludes(svg, 'stop-color="#4338ca" stop-opacity="0"');
    assertStringIncludes(svg, 'fill="url(#bg-blob-0)"');
    // A blob that says nothing sits in the middle at full strength.
    assertStringIncludes(
      svg,
      '<radialGradient id="bg-blob-1" gradientUnits="userSpaceOnUse" cx="400" cy="200" r="560">',
    );
    assertStringIncludes(svg, 'stop-color="#7c3aed" stop-opacity="1"');
  });

  it("draws a photo behind a backdrop, under a scrim", () => {
    const svg = backgroundSvg(
      { type: "image", source: { path: "unused.png" } },
      dimensions,
      "bg",
      { href: "data:image/png;base64,AAA", aspect: 1 },
    );

    assertStringIncludes(svg, 'fill="#000000"');
    assertStringIncludes(svg, 'href="data:image/png;base64,AAA"');
    assertStringIncludes(svg, 'xMidYMid slice"');
    // The scrim is on unless it is turned off: text over an unshaded photo is
    // the failure this would otherwise ship with.
    assertStringIncludes(svg, '<linearGradient id="bg-scrim"');
    assertStringIncludes(svg, 'stop-opacity="0.25"');
    assertStringIncludes(svg, 'stop-opacity="0.65"');
  });

  it("takes the fit, the backdrop and the scrim it is given", () => {
    const svg = backgroundSvg(
      {
        type: "image",
        source: { path: "unused.png" },
        fit: "contain",
        color: "#123456",
        scrim: { color: "#ffffff", from: 0.2, to: 0.2 },
      },
      dimensions,
      "bg",
      { href: "data:image/png;base64,AAA", aspect: 1 },
    );

    assertStringIncludes(svg, 'fill="#123456"');
    assertStringIncludes(svg, 'xMidYMid meet"');
    // Equal ends need no gradient, so the wash is a flat fill.
    assertStringNotIncludes(svg, "linearGradient");
    assertStringIncludes(svg, 'fill="#ffffff" fill-opacity="0.2"');
  });

  it("is the backdrop alone when the image has not been loaded", () => {
    const svg = backgroundSvg(
      { type: "image", source: { path: "unused.png" }, color: "#222" },
      dimensions,
      "bg",
    );

    assertStringIncludes(svg, 'fill="#222"');
    assertStringNotIncludes(svg, "<image");
  });
});
