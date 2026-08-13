import { safeRect } from "../../config/safe-area.js";
import { drawLines } from "../../layout/index.js";
import type { Template, TemplateContext } from "../../types.js";
import { footerLine } from "../bottom.js";
import { contentArea, imageFrame } from "../frame.js";
import { coverLines } from "./lines.js";
import { linesWidth, lockup, markElement, markSpace } from "./lockup.js";

/**
 * The margin, as a fraction of the frame's height rather than its width.
 *
 * A cover is a strip between about 2.6:1 and 6:1, so a margin taken from the
 * width is a margin measured against the one dimension that has room to spare.
 * On a LinkedIn Page cover the usual 7.5% of the width is 208px above and
 * below a band 504px tall. The safe area has already done the horizontal work,
 * which is the other half of why this is the axis that matters here.
 */
const padScale = 0.09;

/** How the name and its tagline are stacked. */
const lineHeight = 1.15;

/**
 * A profile cover: the mark beside the name, with a tagline under it.
 *
 * This is the header image at the top of a profile rather than a card attached
 * to a post, so it is made once for a site and usually declared in
 * `config.extra`. What makes it its own template rather than the `wordmark` at
 * other proportions is the shape of the space: a cover is a strip somewhere
 * between 2.6:1 and 6:1, and a layout that stacks a mark above a name has
 * nothing left to set the name in.
 *
 * Every platform crops a cover and draws a circular avatar over one corner of
 * it, so where the words may go is not the image. That is what `config.safeArea`
 * describes and what the cover presets in `SIZE_PRESETS` carry, and by the time
 * a template sees a frame it has already been applied. The one thing this
 * template does about it is size its text from the room it actually has rather
 * than from the image, which on a YouTube banner is the difference between 423
 * pixels and 1440.
 */
export const coverTemplate: Template = {
  name: "cover",
  render({
    props,
    config,
    dimensions,
    measure,
    logo,
    avatar,
  }: TemplateContext): string {
    const { fontFamily } = config;
    const safe = safeRect(dimensions, config.safeArea);
    const frame = imageFrame(dimensions, config, avatar, {
      pad: Math.round(safe.height * padScale),
    });
    const area = contentArea(frame);

    const mark = markSpace(logo, area.height);
    const lines = coverLines(props, {
      measure,
      fontFamily,
      contentWidth: area.width - mark.width - mark.gap,
      contentHeight: area.height,
    });

    const placed = lockup(area, mark, linesWidth(lines, measure, fontFamily));

    const body = drawLines(lines, placed.text, {
      fontFamily,
      fill: config.colors.foreground,
      lineHeight,
      anchor: "start",
    });

    return (
      markElement(logo, placed.mark) +
      body +
      // Centred, because the lockup above it is, and a footer set against the
      // left margin of a strip has nothing above it to line up with.
      footerLine(config, frame, avatar, measure, "middle")
    );
  },
};
