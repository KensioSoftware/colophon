import { drawLines } from "../../layout/index.js";
import type { Template, TemplateContext } from "../../types.js";
import { footerLine } from "../bottom.js";
import { contentArea, imageFrame, markRoom } from "../frame.js";
import { logoElement, logoRect } from "../logo.js";
import { cardLines } from "./lines.js";

/**
 * Minimal "card" template: a centred title with an optional subtitle. No
 * badge or version, so it is a quieter alternative to `banner`.
 *
 * A logo goes above the title, centred like everything else here, and the
 * avatar sits with the footer along the bottom.
 */
export const cardTemplate: Template = {
  name: "card",
  render({
    props,
    config,
    dimensions,
    measure,
    logo,
    avatar,
  }: TemplateContext): string {
    const { height } = dimensions;
    const frame = imageFrame(dimensions, config, avatar, { padScale: 0.09 });
    const { pad } = frame;
    const mark = logoRect(logo, frame.full, pad, "middle");
    const area = contentArea(frame, markRoom(mark?.height, pad / 2));

    const lines = cardLines(props, {
      measure,
      fontFamily: config.fontFamily,
      contentWidth: area.width,
      titleFs: Math.round(height * 0.1),
      subFs: Math.round(height * 0.045),
      height,
    });

    const body = drawLines(lines, area, {
      fontFamily: config.fontFamily,
      fill: config.colors.foreground,
      lineHeight: 1.28,
      anchor: "middle",
    });

    const footer = footerLine(config, frame, avatar, measure, "middle");

    return logoElement(logo, mark) + body + footer;
  },
};
