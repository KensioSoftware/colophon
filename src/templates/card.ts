import {
  estimateCharsPerLine,
  layoutStack,
  textElement,
  wrapText,
} from "../text.js";
import type { Template, TemplateContext } from "../types.js";
import { optionalString } from "./props.js";

const maxTitleLines = 3;
const maxSubtitleLines = 3;

interface CardLine {
  readonly text: string;
  readonly fontSize: number;
  readonly fontWeight: number;
  readonly opacity: number;
}

/**
 * Minimal "card" template: a centred title with an optional subtitle. No
 * badge or version — a clean, quieter alternative to `banner`.
 */
export const cardTemplate: Template = {
  name: "card",
  render({ props, config, dimensions }: TemplateContext): string {
    const { width, height } = dimensions;
    const { fontFamily } = config;
    const fg = config.colors.foreground;
    const pad = Math.round(width * 0.09);
    const contentWidth = width - pad * 2;
    const centreX = Math.round(width / 2);

    const title = optionalString(props.title) ?? "";
    const subtitle = optionalString(props.subtitle);
    const hasSubtitle = subtitle !== undefined && subtitle !== "";

    const titleFs = Math.round(height * 0.1);
    const subFs = Math.round(height * 0.045);
    const footerFs = Math.round(height * 0.032);

    const titleLines = wrapText(
      title,
      estimateCharsPerLine(contentWidth, titleFs, 0.58),
    ).slice(0, maxTitleLines);

    const subtitleLines = hasSubtitle
      ? wrapText(
          subtitle,
          estimateCharsPerLine(contentWidth, subFs, 0.52),
        ).slice(0, maxSubtitleLines)
      : [];

    const lines: CardLine[] = [
      ...titleLines.map((text) => ({
        text,
        fontSize: titleFs,
        fontWeight: 800,
        opacity: 1,
      })),
      ...subtitleLines.map((text) => ({
        text,
        fontSize: subFs,
        fontWeight: 500,
        opacity: 0.85,
      })),
    ];

    const hasFooter = config.footer !== undefined && config.footer !== "";
    const bottom =
      height - pad - (hasFooter ? footerFs + Math.round(height * 0.02) : 0);

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
          fontFamily,
          fontSize: line.fontSize,
          fontWeight: line.fontWeight,
          fill: fg,
          fillOpacity: line.opacity,
          anchor: "middle",
        }),
      )
      .join("");

    const footer =
      config.footer !== undefined && config.footer !== ""
        ? textElement(config.footer, {
            x: centreX,
            y: height - pad,
            fontFamily,
            fontSize: footerFs,
            fontWeight: 500,
            fill: fg,
            fillOpacity: 0.75,
            anchor: "middle",
          })
        : "";

    return body + footer;
  },
};
