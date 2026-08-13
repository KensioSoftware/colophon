import { drawLines } from "../../layout/index.js";
import type { Template, TemplateContext } from "../../types.js";
import { footerLine } from "../bottom.js";
import { contentArea, imageFrame, markRoom } from "../frame.js";
import { logoElement, logoRect } from "../logo.js";
import { docsChrome } from "./chrome.js";
import { docsLines } from "./lines.js";

/**
 * A reference page: the trail through the documentation that leads to it, a
 * rule, then the page's title and summary.
 *
 * Docs pages share badly. Their titles are short and often ambiguous on their
 * own, since "Fonts" or "Configuration" says nothing about which project's,
 * and the trail above the title is what a reader needs to place them. It reads
 * `breadcrumb`, which may be a list or a single string, along with the usual
 * `title` and `subtitle`.
 */
export const docsTemplate: Template = {
  name: "docs",
  render({
    props,
    config,
    dimensions,
    measure,
    logo,
    avatar,
  }: TemplateContext): string {
    const { height } = dimensions;
    const { fontFamily, colors } = config;
    const frame = imageFrame(dimensions, config, avatar);
    const { pad } = frame;
    const mark = logoRect(logo, frame.full, pad, "start");

    const chrome = docsChrome(
      props,
      config,
      dimensions,
      pad,
      markRoom(mark?.width, pad / 2),
      measure,
    );

    // The title starts below whichever of the trail and the logo reaches
    // furthest down. Both are measured from the top of the image, so the room
    // the content area is asked for is the larger of the two, less the margin
    // it adds back.
    const belowMark = markRoom(mark?.height, Math.round(height * 0.03));
    const belowTrail = Math.max(0, chrome.bottom - pad);
    const area = contentArea(frame, Math.max(belowMark, belowTrail));

    const body = drawLines(
      docsLines(props, {
        measure,
        fontFamily,
        contentWidth: area.width,
        titleFs: Math.round(height * 0.088),
        summaryFs: Math.round(height * 0.044),
        height,
      }),
      area,
      { fontFamily, fill: colors.foreground, lineHeight: 1.28 },
    );

    return (
      chrome.svg +
      logoElement(logo, mark) +
      body +
      footerLine(config, frame, avatar, measure)
    );
  },
};
