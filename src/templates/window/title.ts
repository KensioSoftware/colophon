import {
  baselineFor,
  clampLine,
  measureIn,
  textElement,
} from "../../layout/index.js";
import type { MeasureText, ResolvedConfig } from "../../types.js";
import type { Panel } from "../code/panel.js";

/**
 * The window's title, centred in the bar. It is cut to the room between the
 * buttons and the far edge, taking the buttons' width off both sides so that
 * it stays centred in the bar rather than in what the buttons left.
 */
export function windowTitle(
  title: string,
  window: Panel,
  height: number,
  config: ResolvedConfig,
  measure: MeasureText,
): string {
  if (title === "") {
    return "";
  }

  const fontSize = Math.round(height * 0.42);
  const reserved = Math.round(height * 2.4);

  return textElement(
    clampLine(
      title,
      window.width - reserved * 2,
      measureIn(measure, config.fontFamily, 600),
      fontSize,
    ),
    {
      x: Math.round(window.x + window.width / 2),
      y: baselineFor(window.y + (height - fontSize) / 2, fontSize),
      fontFamily: config.fontFamily,
      fontSize,
      fontWeight: 600,
      fill: "#ffffff",
      fillOpacity: 0.6,
      anchor: "middle",
    },
  );
}
