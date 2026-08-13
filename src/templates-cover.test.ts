import {
  assertArrayLength,
  assertStringIncludes,
  assertStringNotIncludes,
  assertTrue,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import {
  renderTemplate as render,
  samplePng,
  sansFont,
} from "../test/template.js";
import { SIZE_PRESETS } from "./config/defaults.js";
import { coverTemplate } from "./templates/index.js";

/** X's header, and the crop and avatar its preset describes. */
const header = { width: 1500, height: 500 };
const xSafe = SIZE_PRESETS.xCover.safeArea;

/** YouTube's banner, whose safe area is a band across the middle. */
const banner = { width: 2560, height: 1440 };
const youtubeSafe = SIZE_PRESETS.youtubeCover.safeArea;

/** Rendered with a real font, since where the lockup sits comes from measuring. */
const measured = { fonts: [{ family: "DejaVu Sans", path: sansFont }] };

/**
 * Every x a line of text is drawn at. Fractional, because the lockup is
 * centred on a measured width rather than on a whole number of pixels.
 */
function textXs(svg: string): readonly number[] {
  return Array.from(svg.matchAll(/<text x="([\d.]+)"/g), (match) =>
    Number(match[1]),
  );
}

/** Every y a line of text is drawn at. */
function textYs(svg: string): readonly number[] {
  return Array.from(svg.matchAll(/<text x="[\d.]+" y="([\d.]+)"/g), (match) =>
    Number(match[1]),
  );
}

describe("coverTemplate", () => {
  it("draws the name, the tagline, the mark and the footer", async () => {
    const svg = await render(
      coverTemplate,
      {
        template: "cover",
        title: "Kensio Software",
        subtitle: "Tools for people who publish on the web",
      },
      {
        ...measured,
        footer: "kensiosoftware.co.uk",
        logo: { path: samplePng },
      },
      header,
    );

    assertStringIncludes(svg, ">Kensio Software</text>");
    assertStringIncludes(svg, ">kensiosoftware.co.uk</text>");
    assertArrayLength(svg.match(/<image/g), 1);
  });

  it("draws nothing the post did not give it", async () => {
    const svg = await render(
      coverTemplate,
      { template: "cover", title: "Kensio Software" },
      measured,
      header,
    );

    assertStringIncludes(svg, ">Kensio Software</text>");
    assertArrayLength(svg.match(/<text/g), 1);
    assertStringNotIncludes(svg, "<image");
  });

  it("centres the name alone when there is no logo to set it beside", async () => {
    // A row of one item is centred exactly as a pair is, which is why the
    // no-logo case is the same arrangement rather than a second one. A longer
    // name starting further left is what centring means, and it says so
    // without the test having to measure the text itself.
    const short = await render(
      coverTemplate,
      { template: "cover", title: "Kensio" },
      measured,
      header,
    );
    const long = await render(
      coverTemplate,
      { template: "cover", title: "Kensio Software" },
      measured,
      header,
    );

    const shortXs = textXs(short);
    const longXs = textXs(long);

    assertArrayLength(shortXs, 1);
    assertArrayLength(longXs, 1);
    assertTrue(shortXs[0] > 0);
    assertTrue(longXs[0] < shortXs[0]);
  });

  it("sets the name larger when there is no tagline under it", async () => {
    const withTagline = await render(
      coverTemplate,
      { template: "cover", title: "Kensio", subtitle: "Tools" },
      measured,
      header,
    );
    const alone = await render(
      coverTemplate,
      { template: "cover", title: "Kensio" },
      measured,
      header,
    );

    const first = /font-size="(\d+)"/;

    assertTrue(
      Number(first.exec(alone)?.[1]) > Number(first.exec(withTagline)?.[1]),
    );
  });

  it("keeps every word out of the corner X draws the avatar over", async () => {
    const svg = await render(
      coverTemplate,
      {
        template: "cover",
        title: "Kensio Software",
        subtitle: "Tools for people who publish on the web",
      },
      { ...measured, safeArea: xSafe, footer: "kensiosoftware.co.uk" },
      header,
    );

    // The whole point of the template: nothing may start left of the safe
    // area, which on X is where the profile picture goes.
    const left = header.width * xSafe.left;

    assertTrue(textXs(svg).every((x) => x >= left));
  });

  it("keeps every word inside the band YouTube shows on a phone", async () => {
    const svg = await render(
      coverTemplate,
      {
        template: "cover",
        title: "Kensio Software",
        subtitle: "Tools for people who publish on the web",
      },
      { ...measured, safeArea: youtubeSafe, footer: "kensiosoftware.co.uk" },
      banner,
    );

    const top = banner.height * youtubeSafe.top;
    const bottom = banner.height - top;

    // Baselines, so the top bound is loose by an ascender and the bottom by a
    // descender; the band is 424 tall inside an image of 1440, so neither is
    // close to the margin this leaves.
    assertTrue(textYs(svg).every((y) => y > top && y < bottom));
  });

  it("sizes the text from the room it has, not from the image", async () => {
    // A YouTube banner is 1440 tall and the band anyone reads is 424 of it,
    // so a title keyed to the image would be a third of the visible height.
    const svg = await render(
      coverTemplate,
      { template: "cover", title: "Kensio Software", subtitle: "Tools" },
      { ...measured, safeArea: youtubeSafe },
      banner,
    );

    const size = Number(/font-size="(\d+)"/.exec(svg)?.[1]);

    assertTrue(size < banner.height * youtubeSafe.top);
  });
});
