import { layoutStack, textElement } from "../../text/index.js";
import type { Template, TemplateContext } from "../../types.js";
import { footerElement, hasFooter } from "../footer.js";
import { optionalString } from "../props.js";
import { renderBadge } from "./badge.js";
import { bannerLines } from "./lines.js";

/**
 * Generalised "banner" template: a left-aligned title with an optional
 * version and wrapped subtitle, an optional corner badge, and an optional
 * footer. This is the configurable descendant of the original `npm_package`
 * layout.
 */
export const bannerTemplate: Template = {
  name: "banner",
  render({ props, config, dimensions, measure }: TemplateContext): string {
    const { width, height } = dimensions;
    const { fontFamily } = config;
    const pad = Math.round(width * 0.075);
    const contentWidth = width - pad * 2;

    const subtitle = optionalString(props.subtitle);
    const hasSubtitle = subtitle !== undefined && subtitle !== "";

    const titleFs = Math.round(height * (hasSubtitle ? 0.078 : 0.092));
    const footerFs = Math.round(height * 0.034);
    const badgeHeight = Math.round(height * 0.072);

    const lines = bannerLines(props, {
      height,
      contentWidth,
      titleFs,
      versionFs: Math.round(height * 0.04),
      subFs: Math.round(height * 0.05),
      measure,
      fontFamily,
    });

    const top =
      pad +
      (config.badge === undefined
        ? 0
        : badgeHeight + Math.round(height * 0.03));
    const bottom =
      height -
      pad -
      (hasFooter(config) ? footerFs + Math.round(height * 0.02) : 0);

    const placed = layoutStack(
      lines.map((line) => ({
        fontSize: line.fontSize,
        lineHeight: 1.15,
        ...(line.gapBefore !== undefined && { gapBefore: line.gapBefore }),
      })),
      top,
      bottom,
    );

    const body = lines
      .map((line, index) =>
        textElement(line.text, {
          x: pad,
          y: placed[index]?.y ?? top,
          fontFamily,
          fontSize: line.fontSize,
          fontWeight: line.fontWeight,
          fill: config.colors.foreground,
          fillOpacity: line.opacity,
        }),
      )
      .join("");

    const badge =
      config.badge === undefined
        ? ""
        : renderBadge(
            config.badge,
            fontFamily,
            config.colors.brand,
            pad,
            badgeHeight,
          );

    const footer = footerElement(config, {
      x: pad,
      y: height - pad,
      fontSize: footerFs,
      opacity: 0.78,
    });

    return badge + body + footer;
  },
};
