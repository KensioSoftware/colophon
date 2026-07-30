import type { TextLine } from "../../layout/index.js";
import { blockLines } from "../../layout/index.js";
import type { MeasureText, MetaImageProps } from "../../types.js";
import { versionLabel } from "../version.js";

const maxHeadlineLines = 2;
const versionFloor = 0.45;
const headlineFloor = 0.7;

/** The space the release's heading has, and how to measure it into it. */
export interface ReleaseText {
  readonly measure: MeasureText;
  readonly fontFamily: string;
  readonly contentWidth: number;
  readonly versionFs: number;
  readonly headlineFs: number;
  readonly height: number;
}

/**
 * The version, then what the release is about.
 *
 * The version is the headline here rather than a line under the title, which
 * is the difference between this template and the `banner`. A changelog post
 * is read by somebody who already knows what the project is and wants to know
 * which release this is.
 */
export function releaseLines(
  props: MetaImageProps,
  text: ReleaseText,
): TextLine[] {
  const { measure, fontFamily, contentWidth } = text;

  return [
    ...blockLines(versionLabel(props.version), measure, fontFamily, {
      maxWidth: contentWidth,
      maxLines: 1,
      fontSize: text.versionFs,
      floor: versionFloor,
      fontWeight: 800,
      opacity: 1,
    }),
    ...blockLines(props.title, measure, fontFamily, {
      maxWidth: contentWidth,
      maxLines: maxHeadlineLines,
      fontSize: text.headlineFs,
      floor: headlineFloor,
      fontWeight: 600,
      opacity: 0.9,
      gapBefore: Math.round(text.height * 0.022),
    }),
  ];
}
