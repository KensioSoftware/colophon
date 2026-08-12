import { optionalString } from "../../props.js";
import type { MetaImageProps, ResolvedConfig } from "../../types.js";
import type { MeasureText } from "../../types.js";
import { barHeight, titleBar } from "../window/index.js";
import type { Panel } from "./panel.js";

/**
 * How much of the panel the window bar takes, or none where the config asks
 * for no chrome.
 *
 * It is measured against the space the panel was allotted rather than against
 * the panel it ends up as, so that the room reserved for the bar and the bar
 * that is drawn are the same height.
 */
export function barRoom(config: ResolvedConfig, allotted: number): number {
  return config.code.chrome === "none" ? 0 : barHeight(allotted);
}

/**
 * The window bar across the top of the panel, or nothing where the config asks
 * for no chrome.
 *
 * What it holds is the post's `filename`, which is a prop of its own rather
 * than the `title` the template already draws above the panel. The two say
 * different things: a title is what the image is about, and a filename is
 * where the code lives. Overloading one field to mean the other depending on a
 * config flag would move a post's heading without the post changing.
 */
export function windowBar(
  panel: Panel,
  height: number,
  props: MetaImageProps,
  config: ResolvedConfig,
  measure: MeasureText,
): string {
  const { chrome } = config.code;

  if (chrome === "none") {
    return "";
  }

  return titleBar(
    panel,
    height,
    optionalString(props["filename"]) ?? "",
    config,
    measure,
    chrome,
  );
}
