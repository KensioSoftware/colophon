import {
  assertIdentical,
  assertObjectEquals,
  assertStringIncludes,
  assertStringNotIncludes,
  assertUndefined,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import { resolveTexture, textureSvg } from "./texture/index.js";
import type { BrandColors } from "./types.js";

const dimensions = { width: 800, height: 400 };

const colors: Required<BrandColors> = {
  brand: "#4f46e5",
  brandDark: "#3730a3",
  brandWarm: "#db2777",
  foreground: "#f1f5f9",
};

describe("textureSvg", () => {
  it("renders grain as a turbulence filter over the whole image", () => {
    const svg = textureSvg({ type: "grain" }, dimensions, "tx");

    assertStringIncludes(svg, '<filter id="tx"');
    assertStringIncludes(svg, 'type="fractalNoise"');
    // The scale is a speck's size in pixels, and the filter wants its
    // reciprocal: 1 / 1.4.
    assertStringIncludes(svg, 'baseFrequency="0.714"');
    // Coloured specks over a brand colour read as a fault rather than as film.
    assertStringIncludes(svg, '<feColorMatrix type="saturate" values="0"/>');
    assertStringIncludes(svg, 'width="800" height="400" filter="url(#tx)"');
    assertStringIncludes(svg, 'opacity="0.1"');
  });

  it("takes the grain scale and opacity it is given", () => {
    const svg = textureSvg(
      { type: "grain", opacity: 0.25, scale: 4 },
      dimensions,
      "tx",
    );

    assertStringIncludes(svg, 'baseFrequency="0.250"');
    assertStringIncludes(svg, 'opacity="0.25"');
  });

  it("renders dots as one circle to a tile", () => {
    const svg = textureSvg(
      { type: "dots", color: "#ffffff", size: 6, gap: 40 },
      dimensions,
      "tx",
    );

    assertStringIncludes(
      svg,
      '<pattern id="tx" width="40" height="40" patternUnits="userSpaceOnUse">',
    );
    assertStringIncludes(svg, '<circle cx="20" cy="20" r="3" fill="#ffffff"/>');
    assertStringIncludes(svg, 'fill="url(#tx)" opacity="0.08"');
  });

  it("draws every pattern from its defaults alone", () => {
    const dots = textureSvg({ type: "dots" }, dimensions, "tx");
    const rules = textureSvg({ type: "rules" }, dimensions, "tx");
    const waves = textureSvg({ type: "waves" }, dimensions, "tx");

    assertStringIncludes(dots, 'width="44" height="44"');
    assertStringIncludes(dots, '<circle cx="22" cy="22" r="2.5"');
    assertStringIncludes(dots, 'opacity="0.08"');
    assertStringIncludes(rules, 'width="28" height="28"');
    assertStringIncludes(rules, 'patternTransform="rotate(45)"');
    assertStringIncludes(rules, 'stroke-width="2"');
    assertStringIncludes(rules, 'opacity="0.06"');
    assertStringIncludes(waves, 'stroke-width="2"');
    assertStringIncludes(waves, 'opacity="0.14"');
    assertStringIncludes(waves, '<circle cx="0" cy="200" r="24"/>');
    // A texture resolved from config carries a colour; one built by hand may
    // not, and it still has to draw.
    assertStringIncludes(dots, 'fill="#ffffff"');
    assertStringIncludes(rules, 'stroke="#ffffff"');
    assertStringIncludes(waves, 'stroke="#ffffff"');
  });

  it("renders waves as two sets of rings from the side edges", () => {
    const svg = textureSvg(
      { type: "waves", color: "#ffffff", gap: 100, width: 3 },
      dimensions,
      "tx",
    );

    // The set from the right is drawn fainter than the set from the left, so
    // that the crossings read as one surface rather than as two sets of rings.
    assertStringIncludes(
      svg,
      '<g fill="none" stroke="#ffffff" stroke-width="3" opacity="0.14">',
    );
    assertStringIncludes(svg, 'opacity="0.091">');
    // Centred on the middle of each side edge, which is what makes the two
    // sets cross.
    assertStringIncludes(svg, '<circle cx="0" cy="200" r="100"/>');
    assertStringIncludes(svg, '<circle cx="800" cy="200" r="100"/>');
    // Nothing is named in defs, so nothing takes the id.
    assertStringNotIncludes(svg, "tx");
  });

  it("draws rings out to the furthest corner and no further", () => {
    const svg = textureSvg(
      { type: "waves", color: "#ffffff", gap: 100 },
      dimensions,
      "tx",
    );

    // From (0, 200) the furthest corner of an 800x400 image is 824 away, so
    // the last ring that can cover anything is the eighth.
    assertStringIncludes(svg, 'r="800"/>');
    assertStringNotIncludes(svg, 'r="900"/>');
  });

  it("renders rules as one rotated line to a tile", () => {
    const svg = textureSvg(
      { type: "rules", color: "#000000", gap: 20, width: 3, angle: 30 },
      dimensions,
      "tx",
    );

    assertStringIncludes(svg, 'patternTransform="rotate(30)"');
    // Down the middle of the tile rather than along its edge, so the whole of
    // the stroke is inside the tile and the line comes out the width asked for.
    assertStringIncludes(
      svg,
      '<line x1="10" y1="0" x2="10" y2="20" stroke="#000000" stroke-width="3"/>',
    );
  });
});

describe("resolveTexture", () => {
  it("colours a pattern with the foreground where none was given", () => {
    // A fixed white would vanish on a light theme, which is a texture that
    // silently does nothing.
    assertObjectEquals(resolveTexture({ type: "dots" }, colors), {
      type: "dots",
      color: "#f1f5f9",
    });
  });

  it("keeps a colour that was given", () => {
    const resolved = resolveTexture(
      { type: "rules", color: "#123456" },
      colors,
    );

    assertIdentical(
      resolved?.type === "rules" ? resolved.color : undefined,
      "#123456",
    );
  });

  it("colours rings with the foreground as well", () => {
    assertObjectEquals(resolveTexture({ type: "waves" }, colors), {
      type: "waves",
      color: "#f1f5f9",
    });
  });

  it("leaves grain alone, having no colour to fill in", () => {
    assertObjectEquals(resolveTexture({ type: "grain" }, colors), {
      type: "grain",
    });
  });

  it("is nothing where there is no texture", () => {
    assertUndefined(resolveTexture(undefined, colors));
  });
});
