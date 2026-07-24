import { assertIdentical, assertStringIncludes } from "@kensio/smartass";
import { describe, it } from "vitest";

import { backgroundSvg } from "./background.js";

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
});
