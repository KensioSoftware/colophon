import {
  assertArrayEquals,
  assertArrayLength,
  assertIdentical,
  assertStringIncludes,
  assertStringNotIncludes,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import {
  baselineFor,
  box,
  distribute,
  drawLines,
  image,
  inset,
  panel,
  placeLines,
  row,
  scrim,
  stack,
  type Rect,
  type TextLine,
} from "./layout/index.js";

const area: Rect = { x: 0, y: 0, width: 1000, height: 1000 };

/** A text line at one size, since only the size affects where it lands. */
function line(fontSize: number, gapBefore?: number): TextLine {
  return {
    text: "x",
    fontSize,
    fontWeight: 400,
    opacity: 1,
    ...(gapBefore !== undefined && { gapBefore }),
  };
}

function baselineGap(placed: readonly { y: number }[]): number {
  return (placed[1]?.y ?? 0) - (placed[0]?.y ?? 0);
}

describe("distribute", () => {
  it("centres a group within the span", () => {
    const placed = distribute([{ size: 200 }, { size: 200 }], {
      start: 0,
      end: 1000,
    });

    assertArrayEquals(
      placed.map((item) => item.start),
      [300, 500],
    );
  });

  it("packs to either end when asked", () => {
    const items = [{ size: 200 }, { size: 200 }];

    assertIdentical(
      distribute(items, { start: 0, end: 1000 }, "start")[0]?.start,
      0,
    );
    assertIdentical(
      distribute(items, { start: 0, end: 1000 }, "end")[0]?.start,
      600,
    );
  });

  it("counts a gap as space before its item", () => {
    const placed = distribute([{ size: 100 }, { size: 100, gapBefore: 50 }], {
      start: 0,
      end: 250,
    });

    assertArrayEquals(
      placed.map((item) => item.start),
      [0, 150],
    );
  });

  it("starts at the span when the group overflows it", () => {
    const placed = distribute([{ size: 400 }], { start: 100, end: 200 });

    assertIdentical(placed[0]?.start, 100);
  });
});

describe("stack and row", () => {
  it("stacks down an area, keeping its full width", () => {
    const placed = stack([{ size: 100 }, { size: 100 }], area);

    assertArrayLength(placed, 2);
    assertIdentical(placed[0].y, 400);
    assertIdentical(placed[1].y, 500);
    assertIdentical(placed[0].width, 1000);
  });

  it("sets items across an area, keeping its full height", () => {
    const placed = row([{ size: 100 }, { size: 300 }], area);

    assertArrayLength(placed, 2);
    assertIdentical(placed[0].x, 300);
    assertIdentical(placed[1].x, 400);
    assertIdentical(placed[0].height, 1000);
  });
});

describe("box", () => {
  it("writes only the attributes the style names", () => {
    const svg = box({ x: 1, y: 2, width: 3, height: 4 }, { fill: "#fff" });

    assertIdentical(
      svg,
      '<rect x="1" y="2" width="3" height="4" fill="#fff"/>',
    );
  });

  it("escapes a value that came from a post", () => {
    const svg = box(area, { fill: '#fff" onload="alert(1)' });

    assertStringNotIncludes(svg, 'onload="');
    assertStringIncludes(svg, "&quot;");
  });

  it("writes the corners, stroke and opacities when given", () => {
    const svg = box(area, {
      radius: 8,
      fill: "#000",
      fillOpacity: 0.5,
      stroke: "#fff",
      strokeOpacity: 0.1,
      strokeWidth: 2,
    });

    assertStringIncludes(svg, 'rx="8"');
    assertStringIncludes(svg, 'fill-opacity="0.5"');
    assertStringIncludes(svg, 'stroke="#fff" stroke-opacity="0.1"');
    assertStringIncludes(svg, 'stroke-width="2"');
  });
});

describe("inset", () => {
  it("brings every edge in by one amount", () => {
    assertIdentical(inset(area, 100).x, 100);
    assertIdentical(inset(area, 100).width, 800);
  });

  it("brings in only the edges it is given", () => {
    const inner = inset(area, { top: 50, bottom: 150 });

    assertIdentical(inner.y, 50);
    assertIdentical(inner.height, 800);
    assertIdentical(inner.width, 1000);
  });

  it("collapses rather than turning inside out", () => {
    assertIdentical(inset(area, 800).width, 0);
  });

  it("collapses at the far edge rather than outside the rectangle", () => {
    const collapsed = inset(area, 1200);

    assertIdentical(collapsed.width, 0);
    assertIdentical(collapsed.x, 1000);
  });
});

describe("panel", () => {
  it("draws a shadow behind the surface", () => {
    const svg = panel(
      { x: 0, y: 100, width: 500, height: 200 },
      { fill: "#111", radius: 10, shadow: 12 },
    );

    // Shadow first, so the surface covers it, and offset down by the shadow.
    assertArrayLength(svg.match(/<rect/g), 2);
    assertStringIncludes(svg, '<rect x="0" y="112"');
    assertStringIncludes(svg, 'fill-opacity="0.22"');
  });

  it("is a plain box when nothing casts a shadow", () => {
    const svg = panel(area, { fill: "#111" });

    assertArrayLength(svg.match(/<rect/g), 1);
  });
});

describe("image", () => {
  it("crops to the rectangle by default", () => {
    const svg = image(area, "data:image/png;base64,AAA");

    assertStringIncludes(svg, 'xMidYMid slice"');
    assertStringIncludes(svg, 'href="data:image/png;base64,AAA"');
    assertStringNotIncludes(svg, "clipPath");
  });

  it("fits the whole image inside the rectangle when asked", () => {
    const svg = image(area, "logo.png", { fit: "contain", opacity: 0.5 });

    assertStringIncludes(svg, 'xMidYMid meet"');
    assertStringIncludes(svg, 'opacity="0.5"');
  });

  it("clips to rounded corners, which needs an id", () => {
    const rounded = image(area, "a.png", { radius: 20, id: "avatar" });

    assertStringIncludes(rounded, '<clipPath id="avatar"');
    assertStringIncludes(rounded, 'clip-path="url(#avatar)"');
  });

  it("escapes the href and the id", () => {
    assertStringIncludes(image(area, "a.png?a=1&b=2"), "a=1&amp;b=2");
    assertStringIncludes(
      image(area, "a.png", { radius: 4, id: 'a"b' }),
      'id="a&quot;b"',
    );
  });
});

describe("scrim", () => {
  it("shades from clear to dark down the rectangle", () => {
    const svg = scrim(area, "shade", { to: 0.6 });

    assertStringIncludes(svg, '<linearGradient id="shade"');
    assertStringIncludes(svg, 'stop-opacity="0"');
    assertStringIncludes(svg, 'stop-opacity="0.6"');
    assertStringIncludes(svg, 'fill="url(#shade)"');
  });

  it("escapes the colour and the id, and keeps the two references in step", () => {
    const svg = scrim(area, 'a"b', { color: '#000" x="', to: 0.5 });

    assertStringIncludes(svg, 'id="a&quot;b"');
    assertStringIncludes(svg, 'fill="url(#a&quot;b)"');
    // The injected attribute stays inside the colour rather than becoming one.
    assertStringIncludes(svg, 'stop-color="#000&quot; x=&quot;"');
  });

  it("is a flat wash when both ends match, and needs no gradient", () => {
    const svg = scrim(area, "shade", { from: 0.4, to: 0.4 });

    assertStringNotIncludes(svg, "linearGradient");
    assertStringIncludes(svg, 'fill-opacity="0.4"');
  });
});

describe("baselineFor", () => {
  it("puts the ink of a single line inside its own band", () => {
    const top = 400;
    const baseline = baselineFor(top, 100);

    assertIdentical(baseline, 480);
    // The descender takes what is left of the band, so a band of the font's
    // own size holds the line rather than the line hanging out of it.
    assertIdentical(top + 100 - baseline, 20);
  });

  it("agrees with where placeLines puts a lone line", () => {
    const placed = placeLines([line(100)], { ...area, height: 100 }, 1);

    assertArrayLength(placed, 1);
    assertIdentical(placed[0].y, baselineFor(area.y, 100));
  });
});

describe("placeLines", () => {
  it("centres the block and returns increasing baselines", () => {
    const placed = placeLines([line(100), line(100)], area);

    // Two 120px advances (240 total) centred in 1000 → block starts at 380,
    // and each baseline sits 80px (0.8em) into its line.
    assertArrayLength(placed, 2);
    assertIdentical(placed[0].y, 460);
    assertIdentical(placed[1].y, 580);
  });

  it("starts at the top when the block overflows the area", () => {
    const placed = placeLines([line(100)], {
      x: 0,
      y: 100,
      width: 100,
      height: 50,
    });

    assertArrayLength(placed, 1);
    assertIdentical(placed[0].y, 180);
  });

  it("inserts extra space before a line with gapBefore", () => {
    const withoutGap = placeLines([line(100), line(100)], area);
    const withGap = placeLines([line(100), line(100, 40)], area);

    assertIdentical(baselineGap(withGap), baselineGap(withoutGap) + 40);
  });

  it("honours an explicit line height", () => {
    const placed = placeLines([line(100), line(100)], area, 2);

    assertArrayLength(placed, 2);
    assertIdentical(placed[1].y - placed[0].y, 200);
  });
});

describe("drawLines", () => {
  it("draws each line at its baseline, anchored in the area", () => {
    const svg = drawLines([line(100), line(100)], area, {
      fontFamily: "Arial",
      fill: "#fff",
      anchor: "middle",
    });

    assertArrayLength(svg.match(/<text/g), 2);
    assertStringIncludes(svg, 'x="500"');
    assertStringIncludes(svg, 'text-anchor="middle"');
  });

  it("draws from the left edge when there is no anchor", () => {
    const svg = drawLines(
      [line(100)],
      { ...area, x: 90 },
      {
        fontFamily: "Arial",
        fill: "#fff",
      },
    );

    assertStringIncludes(svg, 'x="90"');
    assertStringNotIncludes(svg, "text-anchor");
  });
});
