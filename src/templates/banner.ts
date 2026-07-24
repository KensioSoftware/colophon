import {
  estimateCharsPerLine,
  layoutStack,
  textElement,
  wrapText,
} from "../text.js";
import type { Badge, Template, TemplateContext } from "../types.js";

const maxTitleLines = 3;
const maxSubtitleLines = 4;

interface BannerLine {
  readonly text: string;
  readonly fontSize: number;
  readonly fontWeight: number;
  readonly opacity: number;
  readonly gapBefore?: number;
}

function optionalString(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }

  return undefined;
}

function renderBadge(
  badge: Badge,
  fontFamily: string,
  brand: string,
  pad: number,
  height: number,
): string {
  const fontSize = Math.round(height * 0.6);
  const padX = Math.round(height * 0.36);
  const width = Math.round(badge.text.length * fontSize * 0.64 + padX * 2);
  const radius = Math.round(height * 0.1);

  const rect =
    `<rect x="${String(pad)}" y="${String(pad)}"` +
    ` width="${String(width)}" height="${String(height)}"` +
    ` rx="${String(radius)}" fill="${badge.background ?? "#ffffff"}"/>`;

  const text = textElement(badge.text, {
    x: pad + padX,
    y: pad + Math.round(height * 0.72),
    fontFamily,
    fontSize,
    fontWeight: 900,
    fill: badge.color ?? brand,
  });

  return rect + text;
}

/**
 * Generalised "banner" template: a left-aligned title with an optional
 * version and wrapped subtitle, an optional corner badge, and an optional
 * footer. This is the configurable descendant of the original `npm_package`
 * layout.
 */
export const bannerTemplate: Template = {
  name: "banner",
  render({ props, config, dimensions }: TemplateContext): string {
    const { width, height } = dimensions;
    const { fontFamily } = config;
    const fg = config.colors.foreground;
    const pad = Math.round(width * 0.075);
    const contentWidth = width - pad * 2;

    const title = props.title;
    const subtitle = optionalString(props.subtitle);
    const version = optionalString(props.version);
    const hasSubtitle = subtitle !== undefined && subtitle !== "";

    const titleFs = Math.round(height * (hasSubtitle ? 0.078 : 0.092));
    const versionFs = Math.round(height * 0.04);
    const subFs = Math.round(height * 0.05);
    const footerFs = Math.round(height * 0.034);
    const badgeHeight = Math.round(height * 0.072);

    const titleLines = wrapText(
      title,
      estimateCharsPerLine(contentWidth, titleFs, 0.6),
    ).slice(0, maxTitleLines);

    const subtitleLines = hasSubtitle
      ? wrapText(
          subtitle,
          estimateCharsPerLine(contentWidth, subFs, 0.55),
        ).slice(0, maxSubtitleLines)
      : [];

    // Extra breathing room between the title, version and subtitle groups so
    // they don't read as one squashed block.
    const versionGap = Math.round(height * 0.03);
    const subtitleGap = Math.round(height * 0.045);

    const lines: BannerLine[] = titleLines.map((text) => ({
      text,
      fontSize: titleFs,
      fontWeight: 800,
      opacity: 0.98,
    }));

    if (version !== undefined && version !== "") {
      lines.push({
        text: `v${version}`,
        fontSize: versionFs,
        fontWeight: 700,
        opacity: 0.85,
        gapBefore: versionGap,
      });
    }

    for (const [index, text] of subtitleLines.entries()) {
      lines.push({
        text,
        fontSize: subFs,
        fontWeight: 500,
        opacity: 0.86,
        ...(index === 0 && { gapBefore: subtitleGap }),
      });
    }

    const hasBadge = config.badge !== undefined;
    const hasFooter = config.footer !== undefined && config.footer !== "";
    const top = pad + (hasBadge ? badgeHeight + Math.round(height * 0.03) : 0);
    const bottom =
      height - pad - (hasFooter ? footerFs + Math.round(height * 0.02) : 0);

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
          fill: fg,
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

    const footer =
      config.footer !== undefined && config.footer !== ""
        ? textElement(config.footer, {
            x: pad,
            y: height - pad,
            fontFamily,
            fontSize: footerFs,
            fontWeight: 500,
            fill: fg,
            fillOpacity: 0.78,
          })
        : "";

    return badge + body + footer;
  },
};
