import { drawLines, inset } from "../../layout/index.js";
import type { Template, TemplateContext } from "../../types.js";
import { footerElement, hasFooter } from "../footer.js";
import { cardLines } from "./lines.js";

/**
 * Minimal "card" template: a centred title with an optional subtitle. No
 * badge or version, so it is a quieter alternative to `banner`.
 */
export const cardTemplate: Template = {
  name: "card",
  render({ props, config, dimensions, measure }: TemplateContext): string {
    const { width, height } = dimensions;
    const pad = Math.round(width * 0.09);
    const footerFs = Math.round(height * 0.032);

    const area = inset(
      { x: 0, y: 0, width, height },
      {
        top: pad,
        right: pad,
        left: pad,
        bottom:
          pad + (hasFooter(config) ? footerFs + Math.round(height * 0.02) : 0),
      },
    );

    const lines = cardLines(props, {
      measure,
      fontFamily: config.fontFamily,
      contentWidth: area.width,
      titleFs: Math.round(height * 0.1),
      subFs: Math.round(height * 0.045),
    });

    const body = drawLines(lines, area, {
      fontFamily: config.fontFamily,
      fill: config.colors.foreground,
      anchor: "middle",
    });

    const footer = footerElement(config, {
      x: Math.round(width / 2),
      y: height - pad,
      fontSize: footerFs,
      opacity: 0.75,
      anchor: "middle",
    });

    return body + footer;
  },
};
