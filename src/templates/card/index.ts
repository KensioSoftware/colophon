import { layoutStack, textElement } from "../../text/index.js";
import type { Template, TemplateContext } from "../../types.js";
import { footerElement, hasFooter } from "../footer.js";
import { cardLines } from "./lines.js";

/**
 * Minimal "card" template: a centred title with an optional subtitle. No
 * badge or version, so it is a quieter alternative to `banner`.
 */
export const cardTemplate: Template = {
  name: "card",
  render({ props, config, dimensions }: TemplateContext): string {
    const { width, height } = dimensions;
    const pad = Math.round(width * 0.09);
    const centreX = Math.round(width / 2);

    const titleFs = Math.round(height * 0.1);
    const footerFs = Math.round(height * 0.032);

    const lines = cardLines(
      props,
      width - pad * 2,
      titleFs,
      Math.round(height * 0.045),
    );

    const bottom =
      height -
      pad -
      (hasFooter(config) ? footerFs + Math.round(height * 0.02) : 0);

    const placed = layoutStack(
      lines.map((line) => ({ fontSize: line.fontSize, lineHeight: 1.2 })),
      pad,
      bottom,
    );

    const body = lines
      .map((line, index) =>
        textElement(line.text, {
          x: centreX,
          y: placed[index]?.y ?? pad,
          fontFamily: config.fontFamily,
          fontSize: line.fontSize,
          fontWeight: line.fontWeight,
          fill: config.colors.foreground,
          fillOpacity: line.opacity,
          anchor: "middle",
        }),
      )
      .join("");

    const footer = footerElement(config, {
      x: centreX,
      y: height - pad,
      fontSize: footerFs,
      opacity: 0.75,
      anchor: "middle",
    });

    return body + footer;
  },
};
