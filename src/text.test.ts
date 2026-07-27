import {
  assertArrayEquals,
  assertArrayLength,
  assertIdentical,
  assertStringIncludes,
  assertStringNotIncludes,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import {
  escapeXml,
  estimateCharsPerLine,
  layoutStack,
  textElement,
  wrapText,
} from "./text/index.js";

function baselineGap(placed: { y: number }[]): number {
  return (placed[1]?.y ?? 0) - (placed[0]?.y ?? 0);
}

describe("escapeXml", () => {
  it("escapes the five XML special characters", () => {
    assertIdentical(escapeXml(`&<>"'`), "&amp;&lt;&gt;&quot;&apos;");
  });

  it("escapes ampersands before other entities", () => {
    assertIdentical(escapeXml("a & <b>"), "a &amp; &lt;b&gt;");
  });
});

describe("wrapText", () => {
  it("wraps on word boundaries within the character limit", () => {
    assertArrayEquals(wrapText("the quick brown fox", 10), [
      "the quick",
      "brown fox",
    ]);
  });

  it("keeps a word longer than the limit on its own line", () => {
    assertArrayEquals(wrapText("supercalifragilistic word", 10), [
      "supercalifragilistic",
      "word",
    ]);
  });

  it("collapses runs of whitespace and ignores empties", () => {
    assertArrayEquals(wrapText("  a   b  ", 10), ["a b"]);
  });

  it("returns an empty array for blank input", () => {
    assertArrayEquals(wrapText(" ".repeat(3), 10), []);
  });
});

describe("estimateCharsPerLine", () => {
  it("scales inversely with font size", () => {
    assertIdentical(estimateCharsPerLine(1000, 100, 0.5), 20);
  });

  it("never returns less than one", () => {
    assertIdentical(estimateCharsPerLine(1, 100), 1);
  });
});

describe("layoutStack", () => {
  it("centres the block and returns increasing baselines", () => {
    const placed = layoutStack([{ fontSize: 100 }, { fontSize: 100 }], 0, 1000);

    // Two 120px advances (240 total) centred in 1000 → block starts at 380,
    // and each baseline sits 80px (0.8em) into its line.
    assertArrayLength(placed, 2);
    assertIdentical(placed[0].y, 460);
    assertIdentical(placed[1].y, 580);
  });

  it("starts at the top when the block overflows the area", () => {
    const placed = layoutStack([{ fontSize: 100 }], 100, 150);

    assertArrayLength(placed, 1);
    assertIdentical(placed[0].y, 180);
  });

  it("inserts extra space before a line with gapBefore", () => {
    const withoutGap = layoutStack(
      [{ fontSize: 100 }, { fontSize: 100 }],
      0,
      1000,
    );
    const withGap = layoutStack(
      [{ fontSize: 100 }, { fontSize: 100, gapBefore: 40 }],
      0,
      1000,
    );

    // The gap pushes the second line 40px further from the first.
    assertIdentical(baselineGap(withGap), baselineGap(withoutGap) + 40);
  });

  it("honours an explicit line height", () => {
    const placed = layoutStack(
      [
        { fontSize: 100, lineHeight: 2 },
        { fontSize: 100, lineHeight: 2 },
      ],
      0,
      1000,
    );

    // Advance is fontSize * lineHeight = 200 between baselines.
    assertArrayLength(placed, 2);
    assertIdentical(placed[1].y - placed[0].y, 200);
  });
});

describe("textElement", () => {
  it("renders required attributes and escapes content", () => {
    const svg = textElement("A & B", {
      x: 10,
      y: 20,
      fontFamily: "Arial",
      fontSize: 40,
      fontWeight: 700,
      fill: "#fff",
    });

    assertStringIncludes(svg, 'x="10"');
    assertStringIncludes(svg, 'y="20"');
    assertStringIncludes(svg, 'font-size="40"');
    assertStringIncludes(svg, 'font-weight="700"');
    assertStringIncludes(svg, ">A &amp; B</text>");
    assertStringNotIncludes(svg, "fill-opacity");
    assertStringNotIncludes(svg, "text-anchor");
  });

  it("includes optional opacity and anchor when given", () => {
    const svg = textElement("x", {
      x: 0,
      y: 0,
      fontFamily: "Arial",
      fontSize: 10,
      fontWeight: 400,
      fill: "#000",
      fillOpacity: 0.5,
      anchor: "middle",
    });

    assertStringIncludes(svg, 'fill-opacity="0.5"');
    assertStringIncludes(svg, 'text-anchor="middle"');
  });
});
