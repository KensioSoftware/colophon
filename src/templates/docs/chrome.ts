import {
  baselineFor,
  box,
  measureIn,
  stringList,
  textElement,
} from "../../layout/index.js";
import type {
  Dimensions,
  MeasureText,
  MetaImageProps,
  ResolvedConfig,
} from "../../types.js";
import { crumbLine } from "./crumbs.js";

/** The trail's size, as a fraction of the image's height. */
const trailScale = 0.036;

/** Where the rule under the trail goes, as a fraction of the height. */
const ruleOffset = 0.058;

/** Clear space between the rule and the title, as a fraction of the height. */
const ruleGap = 0.05;

/** The trail and the rule under it, along with the room the two take. */
export interface Chrome {
  readonly svg: string;
  /** How far down the image the content below it may start. */
  readonly bottom: number;
}

/**
 * The trail through the documentation and the rule under it.
 *
 * The rule is only drawn where there is a trail above it to separate, since a
 * line across an image with nothing above it is decoration rather than
 * structure. `room` is what the trail leaves for the title, and it is nothing
 * at all when the post named no breadcrumb.
 */
export function docsChrome(
  props: MetaImageProps,
  config: ResolvedConfig,
  dimensions: Dimensions,
  pad: number,
  reserved: number,
  measure: MeasureText,
): Chrome {
  const { width, height } = dimensions;
  const fontSize = Math.round(height * trailScale);
  const trail = crumbLine(
    stringList(props["breadcrumb"]),
    width - pad * 2 - reserved,
    measureIn(measure, config.fontFamily, 600),
    fontSize,
  );

  if (trail === undefined) {
    return { svg: "", bottom: 0 };
  }

  const ruleY = pad + Math.round(height * ruleOffset);

  return {
    svg:
      textElement(trail, {
        x: pad,
        y: baselineFor(pad, fontSize),
        fontFamily: config.fontFamily,
        fontSize,
        fontWeight: 600,
        fill: config.colors.foreground,
        fillOpacity: 0.72,
      }) +
      box(
        {
          x: pad,
          y: ruleY,
          width: width - pad * 2,
          height: Math.max(1, Math.round(height * 0.003)),
        },
        { fill: config.colors.foreground, fillOpacity: 0.22 },
      ),
    bottom: ruleY + Math.round(height * ruleGap),
  };
}
