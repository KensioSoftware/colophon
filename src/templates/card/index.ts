import { drawLines, inset } from "../../layout/index.js";
import type { Template, TemplateContext } from "../../types.js";
import { attribution } from "../attribution.js";
import { footerBaseline, footerFontSize, hasFooter } from "../footer.js";
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
    const { width, height } = dimensions;
    const pad = Math.round(width * 0.09);
    const footerFs = footerFontSize(dimensions);
    const mark = logoRect(logo, dimensions, pad, "middle");

    const area = inset(
      { x: 0, y: 0, width, height },
      {
        top: pad + (mark === undefined ? 0 : mark.height + pad / 2),
        right: pad,
        left: pad,
        bottom:
          pad +
          (hasFooter(config) || avatar !== undefined
            ? footerFs + Math.round(height * 0.02)
            : 0),
      },
    );

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

    const footer = attribution(
      config,
      {
        x: Math.round(width / 2),
        y: footerBaseline(height, pad, footerFs),
        fontSize: footerFs,
        opacity: 0.75,
        anchor: "middle",
        left: pad,
        width: width - pad * 2,
      },
      avatar,
      measure,
    );

    return logoElement(logo, mark) + body + footer;
  },
};
