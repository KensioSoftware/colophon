import {
  assertIdentical,
  assertObjectEquals,
  assertStringIncludes,
  assertThrowsError,
  assertTrue,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import { resolveConfig } from "./config/index.js";
import { resolveSafeArea, safeRect } from "./config/safe-area.js";
import { SIZE_PRESETS } from "./config/defaults.js";
import { resolveConfigForSize } from "./config/size.js";
import { contentArea, imageFrame } from "./templates/frame.js";

const banner = { width: 2560, height: 1440 };

/** What YouTube publishes: 1546x423, centred both ways. */
const youtube = SIZE_PRESETS.youtubeCover.safeArea;

describe("resolveSafeArea", () => {
  it("leaves every edge alone when the config names none", () => {
    assertObjectEquals(resolveSafeArea(undefined), {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    });
  });

  it("fills in the edges a partial safe area leaves out", () => {
    assertObjectEquals(resolveSafeArea({ left: 0.25 }), {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0.25,
    });
  });

  it("refuses an edge that is not a fraction", () => {
    // The slip to expect, since a safe area is quoted as a percentage
    // everywhere it is published.
    const error = assertThrowsError(() => resolveSafeArea({ left: 25 }));

    assertStringIncludes(error.message, "Invalid safeArea.left 25");
  });

  it("refuses a negative edge", () => {
    const error = assertThrowsError(() => resolveSafeArea({ top: -0.1 }));

    assertStringIncludes(error.message, "Invalid safeArea.top -0.1");
  });

  it("refuses two edges that meet in the middle", () => {
    const error = assertThrowsError(() =>
      resolveSafeArea({ left: 0.6, right: 0.5 }),
    );

    assertStringIncludes(
      error.message,
      "left and right inset by 0.6 and 0.5 leave no room between them",
    );
  });
});

describe("safeRect", () => {
  it("is the whole image where nothing is inset", () => {
    assertObjectEquals(safeRect(banner, resolveSafeArea(undefined)), {
      x: 0,
      y: 0,
      width: 2560,
      height: 1440,
    });
  });

  it("is the area YouTube publishes, to the pixel", () => {
    // 1546x423 is the published figure, and getting it back is what says the
    // rounding is done on the edges rather than on the insets: the vertical
    // one lands on a half, so rounding both insets would give back 422.
    const rect = safeRect(banner, resolveSafeArea(youtube));

    assertObjectEquals(rect, { x: 507, y: 509, width: 1546, height: 423 });
  });

  it("describes the same crop at a smaller upload", () => {
    // YouTube quotes 1235x338 for the 2048x1152 minimum, which is the same
    // two fractions on a smaller canvas, and the whole argument for holding a
    // safe area in fractions rather than in pixels. The width is a pixel over
    // what they publish, which is rounding in their figure rather than ours.
    const rect = safeRect(
      { width: 2048, height: 1152 },
      resolveSafeArea(youtube),
    );

    assertIdentical(rect.width, 1236);
    assertIdentical(rect.height, 338);
  });
});

describe("imageFrame with a safe area", () => {
  const config = resolveConfig({ safeArea: youtube, footer: "example.com" });
  const plain = resolveConfig({ footer: "example.com" });

  it("frames the safe area rather than the image", () => {
    const frame = imageFrame(banner, config, undefined);

    assertObjectEquals(frame.full, {
      x: 507,
      y: 509,
      width: 1546,
      height: 423,
    });
  });

  it("takes the margin off the safe area, not the image", () => {
    // 7.5% of 2560 is 192, which would spend a quarter of the visible width
    // on clear space.
    const frame = imageFrame(banner, config, undefined);

    assertIdentical(frame.pad, Math.round(1546 * 0.075));
  });

  it("puts the footer on the safe area's bottom edge", () => {
    const frame = imageFrame(banner, config, undefined);

    assertTrue(frame.footerY < 509 + 423);
    assertTrue(frame.footerY > 509 + 423 - frame.pad - frame.footerFontSize);
  });

  it("keeps the content inside the safe area", () => {
    const area = contentArea(imageFrame(banner, config, undefined));

    assertTrue(area.x >= 507);
    assertTrue(area.y >= 509);
    assertTrue(area.x + area.width <= 507 + 1546);
    assertTrue(area.y + area.height <= 509 + 423);
  });

  it("frames the whole image when no safe area is configured", () => {
    // The property the refactor that introduced this rests on: an unset safe
    // area has to be the arithmetic that was there before.
    assertObjectEquals(imageFrame(banner, plain, undefined).full, {
      x: 0,
      y: 0,
      width: 2560,
      height: 1440,
    });
  });
});

describe("a size's own safe area", () => {
  it("replaces the config's rather than merging with it", () => {
    // A safe area describes one platform's crop as a whole, so half of one
    // over half of another would be a crop for nowhere.
    const resolved = resolveConfigForSize(
      { safeArea: { top: 0.4, left: 0.4 } },
      { ...SIZE_PRESETS.xCover },
    );

    assertObjectEquals(resolved.safeArea, {
      top: 0.12,
      right: 0.06,
      bottom: 0.12,
      left: 0.25,
    });
  });

  it("falls back to the config's where the size names none", () => {
    const resolved = resolveConfigForSize(
      { safeArea: { left: 0.3 } },
      {
        name: "og",
        width: 1200,
        height: 630,
      },
    );

    assertIdentical(resolved.safeArea.left, 0.3);
  });
});
