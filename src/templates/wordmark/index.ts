import { linesHeight, stack } from "../../layout/index.js";
import type { Template, TemplateContext } from "../../types.js";
import { drawSlot, footerLine } from "../bottom.js";
import { contentArea, gapAfter, imageFrame } from "../frame.js";
import { wordmarkLines } from "./lines.js";
import { markElement, markHeight } from "./mark.js";

/** How the lines of the name and tagline are stacked. */
const lineHeight = 1.2;

/**
 * The logo above the name and its tagline, for a homepage or a repository
 * preview: the image a project uses when the thing being shared is the project
 * itself rather than a post.
 *
 * The mark is part of the centred group rather than pinned to the top corner
 * as it is elsewhere, since here it is the subject of the image. A project
 * with no logo configured gets the name and tagline alone, which is the same
 * layout with nothing above it.
 */
export const wordmarkTemplate: Template = {
  name: "wordmark",
  render({
    props,
    config,
    dimensions,
    measure,
    logo,
    avatar,
  }: TemplateContext): string {
    const { width, height } = dimensions;
    const frame = imageFrame(dimensions, config, avatar, {
      padScale: 0.09,
    });

    const area = contentArea(frame);

    const lines = wordmarkLines(props, {
      measure,
      fontFamily: config.fontFamily,
      contentWidth: area.width,
      nameFs: Math.round(height * 0.11),
      taglineFs: Math.round(height * 0.045),
      height,
    });

    const mark = markHeight(logo, height);
    const [markSlot, textSlot] = stack(
      [
        { size: mark },
        {
          size: linesHeight(lines, lineHeight),
          gapBefore: gapAfter(mark, Math.round(height * 0.055)),
        },
      ],
      area,
    );

    const body = drawSlot(lines, textSlot, {
      fontFamily: config.fontFamily,
      fill: config.colors.foreground,
      lineHeight,
      anchor: "middle",
    });

    return (
      markElement(logo, markSlot) +
      body +
      footerLine(config, frame, width, avatar, measure, "middle")
    );
  },
};
