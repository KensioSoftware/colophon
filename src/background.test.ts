import { describe, expect, it } from "vitest";

import { backgroundSvg } from "./background.js";

const dimensions = { width: 800, height: 400 };

describe("backgroundSvg", () => {
  it("renders a solid fill as a single rect", () => {
    const svg = backgroundSvg(
      { type: "solid", color: "#123456" },
      dimensions,
      "bg",
    );

    expect(svg).toBe('<rect width="800" height="400" fill="#123456"/>');
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

    expect(svg).toContain('<linearGradient id="bg"');
    expect(svg).toContain('x1="0" y1="0" x2="1" y2="1"');
    expect(svg).toContain('<stop offset="0%" stop-color="#000"/>');
    expect(svg).toContain('<stop offset="100%" stop-color="#fff"/>');
    expect(svg).toContain('fill="url(#bg)"');
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

    expect(svg).toContain('x1="0" y1="0" x2="1" y2="0"');
  });
});
