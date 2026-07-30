import {
  baselineFor,
  box,
  clampLine,
  measureIn,
  textElement,
} from "../../layout/index.js";
import type { Rect } from "../../layout/index.js";
import type { MeasureText, ResolvedConfig } from "../../types.js";
import type { Panel } from "../code/panel.js";

/** The title bar's height, as a fraction of the window's width. */
const barScale = 0.055;

/** The buttons' diameter, as a fraction of the bar's height. */
const buttonScale = 0.26;

/**
 * The three buttons, in the colours every reader has seen on a window.
 *
 * They are not the site's colours and are not meant to be. The point of the
 * chrome is that the image is recognised as a terminal before a word of it is
 * read, and these are what does the recognising.
 */
const buttons: readonly string[] = ["#ff5f57", "#febc2e", "#28c840"];

/** How tall the title bar is on a window of this width. */
export function barHeight(windowWidth: number): number {
  return Math.round(windowWidth * barScale);
}

/**
 * A rectangle with its top corners rounded and its bottom ones square, which
 * is the shape of a title bar sitting in the top of a rounded window.
 *
 * It has to be one shape rather than a rounded rectangle with a square one
 * over its bottom half, which is the obvious way to do it and the wrong one:
 * the band is drawn at low opacity, so anywhere the two overlapped would be
 * painted twice and come out as a lighter block with a curve through it.
 */
function roundedTop(rect: Rect, radius: number): string {
  const { x, y, width, height } = rect;
  const r = Math.min(radius, Math.round(width / 2), height);

  return (
    `M${String(x)} ${String(y + r)}` +
    `a${String(r)} ${String(r)} 0 0 1 ${String(r)} ${String(-r)}` +
    `h${String(width - r * 2)}` +
    `a${String(r)} ${String(r)} 0 0 1 ${String(r)} ${String(r)}` +
    `v${String(height - r)}h${String(-width)}z`
  );
}

/**
 * The bar across the top of the window: a lighter band, the buttons, and the
 * title in the middle of what is left.
 *
 * The band is white at low opacity rather than a colour of its own, so it
 * lifts whatever the code theme's background happens to be instead of having
 * to be chosen against it.
 */
export function titleBar(
  window: Panel,
  height: number,
  title: string,
  config: ResolvedConfig,
  measure: MeasureText,
): string {
  const { radius } = window;
  const diameter = Math.round(height * buttonScale);
  const gap = Math.round(diameter * 1.7);
  const left = window.x + Math.round(height * 0.6);
  const middle = window.y + Math.round(height / 2);

  const band =
    `<path d="${roundedTop({ x: window.x, y: window.y, width: window.width, height }, radius)}"` +
    ` fill="#ffffff" fill-opacity="0.07"/>${box(
      { x: window.x, y: window.y + height, width: window.width, height: 1 },
      { fill: "#ffffff", fillOpacity: 0.1 },
    )}`;

  const lights = buttons
    .map((fill, index) =>
      box(
        {
          x: left + index * gap,
          y: middle - Math.round(diameter / 2),
          width: diameter,
          height: diameter,
        },
        { radius: Math.round(diameter / 2), fill },
      ),
    )
    .join("");

  return band + lights + windowTitle(title, window, height, config, measure);
}

/**
 * The window's title, centred in the bar. It is cut to the room between the
 * buttons and the far edge, taking the buttons' width off both sides so that
 * it stays centred in the bar rather than in what the buttons left.
 */
function windowTitle(
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
