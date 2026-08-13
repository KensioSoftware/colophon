import { drawLines } from "../../layout/index.js";
import type { Template, TemplateContext } from "../../types.js";
import { contentArea, imageFrame, markRoom } from "../frame.js";
import { logoElement, logoRect } from "../logo.js";
import { articleBottom } from "./bottom.js";
import { articleLines, bylineParts } from "./lines.js";
import { tagBand } from "./tags.js";

/**
 * The default blog card: tags along the top, the headline and its standfirst
 * in the middle, and who wrote it and when along the bottom.
 *
 * It reads `tags`, `author` and `date` on top of the usual `title` and
 * `subtitle`, and draws the `avatar` prop beside the byline rather than beside
 * the footer. That leaves the two ends of the bottom line saying different
 * things: who wrote this post at the left, and whose site it is at the right.
 */
export const articleTemplate: Template = {
  name: "article",
  render({
    props,
    config,
    dimensions,
    measure,
    logo,
    avatar,
  }: TemplateContext): string {
    const { width, height } = dimensions;
    const { fontFamily, colors } = config;
    const said = bylineParts(props);
    const frame = imageFrame(dimensions, config, avatar, {
      footer: said.length > 0,
    });
    const { pad } = frame;
    const mark = logoRect(logo, frame.full, pad, "start");

    const chips = tagBand(
      props,
      config,
      dimensions,
      pad,
      markRoom(mark?.width, pad),
      measure,
    );

    const topMark = Math.max(chips.height, mark?.height ?? 0);
    const area = contentArea(
      frame,
      markRoom(topMark, Math.round(height * 0.035)),
    );

    const body = drawLines(
      articleLines(props, {
        measure,
        fontFamily,
        contentWidth: area.width,
        titleFs: Math.round(height * 0.082),
        standfirstFs: Math.round(height * 0.042),
        height,
      }),
      area,
      { fontFamily, fill: colors.foreground, lineHeight: 1.28 },
    );

    const bottom = articleBottom(said, config, frame, width, avatar, measure);

    return chips.svg + logoElement(logo, mark) + body + bottom;
  },
};
