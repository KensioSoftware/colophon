import { describe, expect, it } from "vitest";

import {
  escapeXml,
  estimateCharsPerLine,
  layoutStack,
  textElement,
  wrapText,
} from "./text.js";

function baselineGap(placed: { y: number }[]): number {
  return (placed[1]?.y ?? 0) - (placed[0]?.y ?? 0);
}

describe("escapeXml", () => {
  it("escapes the five XML special characters", () => {
    expect(escapeXml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&apos;");
  });

  it("escapes ampersands before other entities", () => {
    expect(escapeXml("a & <b>")).toBe("a &amp; &lt;b&gt;");
  });
});

describe("wrapText", () => {
  it("wraps on word boundaries within the character limit", () => {
    expect(wrapText("the quick brown fox", 10)).toStrictEqual([
      "the quick",
      "brown fox",
    ]);
  });

  it("keeps a word longer than the limit on its own line", () => {
    expect(wrapText("supercalifragilistic word", 10)).toStrictEqual([
      "supercalifragilistic",
      "word",
    ]);
  });

  it("collapses runs of whitespace and ignores empties", () => {
    expect(wrapText("  a   b  ", 10)).toStrictEqual(["a b"]);
  });

  it("returns an empty array for blank input", () => {
    expect(wrapText(" ".repeat(3), 10)).toStrictEqual([]);
  });
});

describe("estimateCharsPerLine", () => {
  it("scales inversely with font size", () => {
    expect(estimateCharsPerLine(1000, 100, 0.5)).toBe(20);
  });

  it("never returns less than one", () => {
    expect(estimateCharsPerLine(1, 100)).toBe(1);
  });
});

describe("layoutStack", () => {
  it("centres the block and returns increasing baselines", () => {
    const placed = layoutStack([{ fontSize: 100 }, { fontSize: 100 }], 0, 1000);

    expect(placed).toHaveLength(2);
    expect(placed[0]!.y).toBeLessThan(placed[1]!.y);
    // Two 120px advances (240 total) centred in 1000 → starts at 380.
    expect(placed[0]!.y).toBe(460);
  });

  it("starts at the top when the block overflows the area", () => {
    const placed = layoutStack([{ fontSize: 100 }], 100, 150);
    expect(placed[0]!.y).toBe(180);
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
    expect(baselineGap(withGap)).toBe(baselineGap(withoutGap) + 40);
  });

  it("honours an explicit line height", () => {
    const [first, second] = layoutStack(
      [
        { fontSize: 100, lineHeight: 2 },
        { fontSize: 100, lineHeight: 2 },
      ],
      0,
      1000,
    );

    // Advance is fontSize * lineHeight = 200 between baselines.
    expect(second!.y - first!.y).toBe(200);
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

    expect(svg).toContain('x="10"');
    expect(svg).toContain('y="20"');
    expect(svg).toContain('font-size="40"');
    expect(svg).toContain('font-weight="700"');
    expect(svg).toContain(">A &amp; B</text>");
    expect(svg).not.toContain("fill-opacity");
    expect(svg).not.toContain("text-anchor");
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

    expect(svg).toContain('fill-opacity="0.5"');
    expect(svg).toContain('text-anchor="middle"');
  });
});
