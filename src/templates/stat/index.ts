import { drawLines } from "../../layout/index.js";
import type { Template, TemplateContext } from "../../types.js";
import { footerLine } from "../bottom.js";
import { contentArea, imageFrame, markRoom } from "../frame.js";
import { logoElement, logoRect } from "../logo.js";
import { statLines } from "./lines.js";

/**
 * One big number and a caption: downloads, uptime, a headline figure from a
 * post. Reads `stat` for the figure, `title` for the small label above it and
 * `subtitle` for the caption below, all of them optional.
 *
 * Everything is centred, as on the `card`, because a figure is looked at
 * rather than read and the middle is where the eye lands.
 */
export const statTemplate: Template = {
  name: "stat",
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
    const { pad } = frame;
    const mark = logoRect(logo, dimensions, pad, "middle");

    const area = contentArea(frame, markRoom(mark?.height, pad / 2));

    const lines = statLines(props, {
      measure,
      fontFamily: config.fontFamily,
      contentWidth: area.width,
      labelFs: Math.round(height * 0.042),
      figureFs: Math.round(height * 0.26),
      captionFs: Math.round(height * 0.045),
      height,
    });

    const body = drawLines(lines, area, {
      fontFamily: config.fontFamily,
      fill: config.colors.foreground,
      lineHeight: 1.15,
      anchor: "middle",
    });

    const footer = footerLine(config, frame, width, avatar, measure, "middle");

    return logoElement(logo, mark) + body + footer;
  },
};
