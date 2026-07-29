import type { MeasureText, MetaImageProps } from "../../types.js";
import type { TextLine } from "../text.js";
import { blockLines } from "../text.js";
import { versionLines } from "./version.js";

const maxTitleLines = 3;
const maxSubtitleLines = 4;
const titleFloor = 0.62;
const subtitleFloor = 0.8;

/**
 * The font sizes the banner's text is drawn at, all keyed to image height,
 * along with the space it has and how to measure text into it.
 */
export interface BannerSizes {
  readonly height: number;
  readonly contentWidth: number;
  readonly titleFs: number;
  readonly versionFs: number;
  readonly subFs: number;
  readonly measure: MeasureText;
  readonly fontFamily: string;
}

/**
 * The banner's text block: the wrapped title, an optional version, and the
 * wrapped subtitle. Extra breathing room goes before the version and subtitle
 * groups so the three do not read as one squashed block.
 */
export function bannerLines(
  props: MetaImageProps,
  sizes: BannerSizes,
): TextLine[] {
  const { height, contentWidth, measure, fontFamily } = sizes;

  return [
    ...blockLines(props.title, measure, fontFamily, {
      maxWidth: contentWidth,
      maxLines: maxTitleLines,
      fontSize: sizes.titleFs,
      floor: titleFloor,
      fontWeight: 800,
      opacity: 0.98,
    }),
    ...versionLines(props, sizes),
    ...blockLines(props.subtitle, measure, fontFamily, {
      maxWidth: contentWidth,
      maxLines: maxSubtitleLines,
      fontSize: sizes.subFs,
      floor: subtitleFloor,
      fontWeight: 500,
      opacity: 0.86,
      gapBefore: Math.round(height * 0.045),
    }),
  ];
}
