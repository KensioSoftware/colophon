import type { MetaImageProps } from "../../types.js";
import type { TextLine } from "../../layout/index.js";
import { versionLabel } from "../version.js";
import type { BannerSizes } from "./lines.js";

/**
 * The version line, or nothing where there is no version. It is never wrapped
 * or shrunk: a version string that needed either would not be one.
 */
export function versionLines(
  props: MetaImageProps,
  sizes: BannerSizes,
): readonly TextLine[] {
  const version = versionLabel(props.version);

  if (version === undefined) {
    return [];
  }

  return [
    {
      text: version,
      fontSize: sizes.versionFs,
      fontWeight: 700,
      opacity: 0.85,
      gapBefore: Math.round(sizes.height * 0.03),
    },
  ];
}
