import type { MetaImageProps } from "../../types.js";
import { optionalString } from "../../props.js";
import type { TextLine } from "../../layout/index.js";
import type { BannerSizes } from "./lines.js";

/**
 * The version line, or nothing where there is no version. It is never wrapped
 * or shrunk: a version string that needed either would not be one.
 */
export function versionLines(
  props: MetaImageProps,
  sizes: BannerSizes,
): readonly TextLine[] {
  const version = optionalString(props.version);

  if (version === undefined || version === "") {
    return [];
  }

  return [
    {
      text: `v${version}`,
      fontSize: sizes.versionFs,
      fontWeight: 700,
      opacity: 0.85,
      gapBefore: Math.round(sizes.height * 0.03),
    },
  ];
}
