import { drawLines, inset } from "../../layout/index.js";
import { optionalString } from "../../props.js";
import type { Template, TemplateContext } from "../../types.js";
import { attribution } from "../attribution.js";
import { footerBaseline, footerFontSize, hasFooter } from "../footer.js";
import { logoElement, logoRect } from "../logo.js";
import { badgeFor } from "./badge-props.js";
import { renderBadge } from "./badge.js";
import { bannerLines } from "./lines.js";

/**
 * Generalised "banner" template: a left-aligned title with an optional
 * version and wrapped subtitle, an optional corner badge, and an optional
 * footer. This is the configurable descendant of the original `npm_package`
 * layout.
 *
 * A logo goes in the opposite corner to the badge, which is the corner the
 * left-aligned text leaves free, and the avatar sits with the footer.
 */
export const bannerTemplate: Template = {
  name: "banner",
  render({
    props,
    config,
    dimensions,
    measure,
    logo,
    avatar,
  }: TemplateContext): string {
    const { width, height } = dimensions;
    const { fontFamily } = config;
    const pad = Math.round(width * 0.075);
    const footerFs = footerFontSize(dimensions);
    const badgeHeight = Math.round(height * 0.072);
    const mark = logoRect(logo, dimensions, pad, "start");
    const badge = badgeFor(props, config);

    const subtitle = optionalString(props.subtitle);
    const hasSubtitle = subtitle !== undefined && subtitle !== "";

    // The text sits between whatever the marks along the top and the footer
    // along the bottom leave behind.
    const topMark = Math.max(
      badge === undefined ? 0 : badgeHeight,
      mark?.height ?? 0,
    );
    const area = inset(
      { x: 0, y: 0, width, height },
      {
        top: pad + (topMark === 0 ? 0 : topMark + Math.round(height * 0.03)),
        right: pad,
        left: pad,
        bottom:
          pad +
          (hasFooter(config) || avatar !== undefined
            ? footerFs + Math.round(height * 0.02)
            : 0),
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
      lineHeight: 1.28,
    });

    const badgeMark =
      badge === undefined
        ? ""
        : renderBadge(badge, fontFamily, config.colors.brand, pad, badgeHeight);

    const footer = attribution(
      config,
      {
        x: pad,
        y: footerBaseline(height, pad, footerFs),
        fontSize: footerFs,
        opacity: 0.78,
        left: pad,
        width: width - pad * 2,
      },
      avatar,
      measure,
    );

    return badgeMark + logoElement(logo, mark) + body + footer;
  },
};
