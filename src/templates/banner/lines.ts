import { estimateCharsPerLine, wrapText } from "../../text/index.js";
import type { MetaImageProps } from "../../types.js";
import { optionalString } from "../props.js";

const maxTitleLines = 3;
const maxSubtitleLines = 4;

/**
 * One line of the banner's text block, with the weight and opacity that say
 * which of the title, version and subtitle groups it belongs to.
 */
export interface BannerLine {
  readonly text: string;
  readonly fontSize: number;
  readonly fontWeight: number;
  readonly opacity: number;
  readonly gapBefore?: number;
}

/** The font sizes the banner's text is drawn at, all keyed to image height. */
export interface BannerSizes {
  readonly height: number;
  readonly contentWidth: number;
  readonly titleFs: number;
  readonly versionFs: number;
  readonly subFs: number;
}

/**
 * The banner's text block: the wrapped title, an optional version, and the
 * wrapped subtitle. Extra breathing room goes before the version and subtitle
 * groups so the three do not read as one squashed block.
 */
export function bannerLines(
  props: MetaImageProps,
  sizes: BannerSizes,
): BannerLine[] {
  const { height, contentWidth, titleFs, versionFs, subFs } = sizes;
  const title = optionalString(props.title) ?? "";
  const subtitle = optionalString(props.subtitle);
  const version = optionalString(props.version);

  const lines: BannerLine[] = wrapText(
    title,
    estimateCharsPerLine(contentWidth, titleFs, 0.6),
  )
    .slice(0, maxTitleLines)
    .map((text) => ({
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
      gapBefore: Math.round(height * 0.03),
    });
  }

  const subtitleLines =
    subtitle === undefined || subtitle === ""
      ? []
      : wrapText(
          subtitle,
          estimateCharsPerLine(contentWidth, subFs, 0.55),
        ).slice(0, maxSubtitleLines);

  for (const [index, text] of subtitleLines.entries()) {
    lines.push({
      text,
      fontSize: subFs,
      fontWeight: 500,
      opacity: 0.86,
      ...(index === 0 && { gapBefore: Math.round(height * 0.045) }),
    });
  }

  return lines;
}
