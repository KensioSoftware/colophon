import {
  assertArrayLength,
  assertFalse,
  assertIdentical,
  assertObjectEquals,
  assertStringIncludes,
  assertStringNotIncludes,
  assertTrue,
  assertUndefined,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import {
  resolveTexture,
  resolveTextureScale,
  textureSvg,
} from "./texture/index.js";
import type { BrandColors } from "./types.js";

const dimensions = { width: 800, height: 400 };

/** Every radius a texture drew, in the order the dots appear. */
function radii(svg: string): readonly number[] {
  return Array.from(svg.matchAll(/r="([\d.]+)"/g), (match) => Number(match[1]));
}

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

  it("fans rays around the whole circle from one origin", () => {
    const svg = textureSvg(
      { type: "rays", color: "#ffffff", count: 8, width: 3 },
      dimensions,
      "tx",
    );

    assertStringIncludes(
      svg,
      '<g stroke="#ffffff" stroke-width="3" opacity="0.07">',
    );
    // Eight rays, not the four that reach the image: counting the full circle
    // is what keeps the spacing the same when the origin moves.
    assertArrayLength(svg.match(/<line /g), 8);
    // The default origin is below the bottom edge, so what crosses the image
    // is a fan rather than a star.
    assertStringIncludes(svg, '<line x1="400" y1="460"');
    assertStringNotIncludes(svg, "tx");
  });

  it("takes the origin as a fraction of the image", () => {
    const svg = textureSvg(
      { type: "rays", color: "#ffffff", count: 4, x: 0, y: 0 },
      dimensions,
      "tx",
    );

    assertStringIncludes(svg, '<line x1="0" y1="0"');
    // The furthest corner from this one is the far corner, so a ray reaching
    // it runs the diagonal.
    assertStringIncludes(svg, 'x2="894" y2="0"');
  });

  it("renders a grid as a fine tile with a heavier one over it", () => {
    const svg = textureSvg(
      { type: "grid", color: "#ffffff", gap: 20, width: 1, major: 4 },
      dimensions,
      "tx",
    );

    // The heavy lines are a second tile rather than part of the first, since
    // what makes them heavy is repeating at a multiple of the spacing.
    assertStringIncludes(svg, '<pattern id="txa" width="20" height="20"');
    assertStringIncludes(svg, '<pattern id="txb" width="80" height="80"');
    assertStringIncludes(svg, '<path d="M0 10H20M10 0V20"');
    assertStringIncludes(svg, '<path d="M0 40H80M40 0V80"');
    assertStringIncludes(svg, 'stroke-width="2"');
  });

  it("draws a grid with no heavier lines as one tile", () => {
    const svg = textureSvg(
      { type: "grid", color: "#ffffff", major: 0 },
      dimensions,
      "tx",
    );

    assertStringIncludes(svg, '<pattern id="txa"');
    assertStringNotIncludes(svg, "txb");
  });

  it("renders crosses as one mark to a tile", () => {
    const svg = textureSvg(
      { type: "crosses", color: "#ffffff", gap: 40, size: 10, width: 2 },
      dimensions,
      "tx",
    );

    // Centred in the tile, with arms half the size either way.
    assertStringIncludes(svg, '<path d="M15 20H25M20 15V25"');
    assertStringIncludes(svg, 'stroke="#ffffff" stroke-width="2"');
    assertStringIncludes(svg, 'fill="url(#tx)" opacity="0.09"');
  });

  it("crosses rules with a fainter set at the opposite angle", () => {
    const svg = textureSvg(
      { type: "rules", color: "#ffffff", gap: 20, angle: 30, cross: true },
      dimensions,
      "tx",
    );

    assertStringIncludes(svg, 'patternTransform="rotate(30)"');
    assertStringIncludes(svg, 'patternTransform="rotate(-30)"');
    // The crossing set is fainter, which is what makes the two read as one
    // surface rather than as two sets of lines.
    assertStringIncludes(svg, 'fill="url(#txa)" opacity="0.06"');
    assertStringIncludes(svg, 'fill="url(#txb)" opacity="0.039"');
  });

  it("leaves an uncrossed set of rules exactly as it was", () => {
    const svg = textureSvg(
      { type: "rules", color: "#ffffff", cross: false },
      dimensions,
      "tx",
    );

    // One set keeps the plain id, so the common case draws what it always drew.
    assertStringIncludes(svg, '<pattern id="tx"');
    assertStringNotIncludes(svg, "txa");
  });

  it("renders chevrons as one V to a tile", () => {
    const svg = textureSvg(
      { type: "chevrons", color: "#ffffff", gap: 40, width: 3 },
      dimensions,
      "tx",
    );

    // The ends sit at the same height on both edges, so one tile's chevron
    // carries on into the next rather than stopping in a corner.
    assertStringIncludes(svg, '<path d="M0 28L20 12L40 28"');
    assertStringIncludes(svg, '<pattern id="tx" width="40" height="40"');
  });

  it("renders a honeycomb whose repeat is wider than it is tall", () => {
    const svg = textureSvg(
      { type: "honeycomb", color: "#ffffff", size: 10 },
      dimensions,
      "tx",
    );

    // Three sides across and side * sqrt(3) down is the smallest rectangle a
    // honeycomb fits in, so the tile is not square like the others.
    assertStringIncludes(svg, '<pattern id="tx" width="30" height="17.32');
    // A hexagon of side 10 is 20 across the points, centred a side in.
    assertStringIncludes(svg, "M0 8.66L5 0L15 0L20 8.66L15 17.32L5 17.32Z");
  });

  it("renders scallops as two rows to a tile", () => {
    const svg = textureSvg(
      { type: "scallops", color: "#ffffff", size: 40 },
      dimensions,
      "tx",
    );

    // One repeat holds both the offset row and the row it is offset from,
    // since a pattern cannot stagger its own rows.
    assertStringIncludes(svg, "M0 0A20 20 0 0 0 40 0");
    assertStringIncludes(svg, "M-20 20A20 20 0 0 0 20 20");
    assertStringIncludes(svg, "M20 20A20 20 0 0 0 60 20");
  });

  it("grows halftone dots along the direction it is given", () => {
    const down = textureSvg({ type: "halftone" }, dimensions, "tx");
    const across = textureSvg({ type: "halftone", angle: 0 }, dimensions, "tx");

    // Down the image by default: the first dot of the top row is the smallest
    // there is, and the last of the bottom row the largest.
    const [firstDown] = radii(down);
    assertTrue((radii(down).at(-1) ?? 0) > (firstDown ?? 0));
    // Across, the first row already runs from smallest to largest, so a dot a
    // few places along it is bigger than the one before.
    const sideways = radii(across);
    assertTrue((sideways[3] ?? 0) > (sideways[0] ?? 0));
  });

  it("draws topographic contours that close and never cross", () => {
    const svg = textureSvg({ type: "topographic" }, dimensions, "tx");

    // Marching squares over the field, so the lines are segments rather than
    // rings around a centre.
    assertStringIncludes(svg, '<path d="M');
    assertStringIncludes(svg, 'fill="none"');
    assertStringNotIncludes(svg, "<circle");
  });

  it("draws the same landscape for the same seed and a different one else", () => {
    const first = textureSvg({ type: "topographic" }, dimensions, "tx");
    const same = textureSvg({ type: "topographic", seed: 1 }, dimensions, "tx");
    const other = textureSvg(
      { type: "topographic", seed: 2 },
      dimensions,
      "tx",
    );

    // Nothing here rolls dice: the rebuild stamp assumes one config draws one
    // picture, so a seeded texture has to be a function of its seed.
    assertIdentical(first, same);
    assertFalse(other === same);
  });

  it("renders moire as one grid turned against another", () => {
    const svg = textureSvg(
      { type: "moire", color: "#ffffff", gap: 20, width: 2, angle: 6 },
      dimensions,
      "tx",
    );

    // Two patterns, not one: the second is the same grid turned, and what is
    // seen is where the two cross.
    assertStringIncludes(svg, '<pattern id="txa" width="20" height="20"');
    assertStringIncludes(
      svg,
      '<pattern id="txb" width="20" height="20" patternUnits="userSpaceOnUse"' +
        ' patternTransform="rotate(6)">',
    );
    // Lines through the middle of the tile on both axes, so the whole of each
    // stroke is inside the tile it repeats in.
    assertStringIncludes(svg, '<path d="M0 10H20M10 0V20"');
    // The turned grid is drawn fainter, which is what makes the crossings read
    // as one surface rather than as two grids.
    assertStringIncludes(svg, 'fill="url(#txa)" opacity="0.1"');
    assertStringIncludes(svg, 'fill="url(#txb)" opacity="0.065"');
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

describe("textureSvg at a scale", () => {
  it("writes what it always wrote at a scale of one", () => {
    assertIdentical(
      textureSvg({ type: "dots" }, dimensions, "tx", 1),
      textureSvg({ type: "dots" }, dimensions, "tx"),
    );
  });

  it("draws the same picture into a smaller image and scales it back up", () => {
    // The tile is the size it always was, so the dots are three times as far
    // apart on the finished image and three times as wide.
    const svg = textureSvg({ type: "dots" }, dimensions, "tx", 3);

    assertStringIncludes(svg, '<g transform="scale(3)">');
    assertStringIncludes(svg, '<pattern id="tx" width="44" height="44"');
    assertArrayLength(radii(svg), 1);
    assertIdentical(radii(svg)[0], 2.5);
  });

  it("rounds the reduced image up so the treatment covers the last row", () => {
    // 800 and 400 over 3 are not whole numbers, and a rect short of the edge
    // would leave a bare strip down two sides once it was scaled back.
    const svg = textureSvg({ type: "dots" }, dimensions, "tx", 3);

    assertStringIncludes(svg, '<rect width="267" height="134"');
  });

  it("scales a treatment that is not a tile as readily", () => {
    // `waves` names nothing in `<defs>` and draws its rings from the image's
    // own proportions, which is exactly what the reduced image gives it.
    const svg = textureSvg({ type: "waves" }, dimensions, "tx", 2);

    assertStringIncludes(svg, '<g transform="scale(2)">');
    assertStringIncludes(svg, "</g>");
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

describe("resolveTextureScale", () => {
  it("draws a texture at its stated lengths by default", () => {
    assertIdentical(resolveTextureScale(undefined), 1);
  });

  it("takes a scale that was asked for", () => {
    assertIdentical(resolveTextureScale(3), 3);
  });

  it("takes a scale that was asked for below one", () => {
    assertIdentical(resolveTextureScale(0.5), 0.5);
  });

  it("ignores a scale that could only draw nothing", () => {
    // Zero would divide the image by nothing and a negative would draw the
    // treatment back through the origin, so both would surface as a blank
    // image rather than as a message about the config.
    assertIdentical(resolveTextureScale(0), 1);
    assertIdentical(resolveTextureScale(-2), 1);
    assertIdentical(resolveTextureScale(Number.NaN), 1);
  });
});
