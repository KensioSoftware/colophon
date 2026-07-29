import { drawLines, inset } from "../../layout/index.js";
import { optionalString } from "../../props.js";
import type { Template, TemplateContext } from "../../types.js";
import { footerElement, hasFooter } from "../footer.js";
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
    const footerFs = Math.round(height * 0.034);
    const badgeHeight = Math.round(height * 0.072);

    const subtitle = optionalString(props.subtitle);
    const hasSubtitle = subtitle !== undefined && subtitle !== "";

    // The text sits between whatever the badge and the footer leave behind.
    const area = inset(
      { x: 0, y: 0, width, height },
      {
        top:
          pad +
          (config.badge === undefined
            ? 0
            : badgeHeight + Math.round(height * 0.03)),
        right: pad,
        left: pad,
        bottom:
          pad + (hasFooter(config) ? footerFs + Math.round(height * 0.02) : 0),
      },
    );

    const lines = bannerLines(props, {
      height,
      contentWidth: area.width,
      titleFs: Math.round(height * (hasSubtitle ? 0.078 : 0.092)),
      versionFs: Math.round(height * 0.04),
      subFs: Math.round(height * 0.05),
      measure,
      fontFamily,
    });

    const body = drawLines(lines, area, {
      fontFamily,
      fill: config.colors.foreground,
      lineHeight: 1.15,
    });

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
