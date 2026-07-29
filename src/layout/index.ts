/**
 * Layout primitives for template authors.
 *
 * Importable on its own as `@kensio/colophon/layout`. Writing a template means
 * returning a string of SVG, and this is the set of small functions that build
 * one: rectangles, panels, images, and the arithmetic of putting things in
 * rows and stacks. It is deliberately boring. Nothing here holds state, every
 * function takes values and returns them, and a template that would rather
 * write its own SVG by hand still can.
 *
 * The subpath loads no rasteriser, no syntax highlighter and nothing from
 * Node, so the whole of it runs anywhere a string does.
 *
 * Measuring is the exception to "import it from here": a template is handed a
 * `MeasureText` on its context, because only the build knows which fonts
 * were loaded. What this module exports is what to do with it.
 */
export { box, inset } from "./box.js";
export { distribute } from "./distribute.js";
export { image } from "./image.js";
export type { ImageOptions } from "./image.js";
export { panel } from "./panel.js";
export type { PanelStyle } from "./panel.js";
export { row } from "./row.js";
export type { RowRect } from "./row.js";
export { scrim } from "./scrim.js";
export type { ScrimOptions } from "./scrim.js";
export { stack } from "./stack.js";
export type { StackedRect } from "./stack.js";
export type { Align, BoxStyle, Extent, Placed, Rect, Span } from "./types.js";

export { blockLines } from "./block.js";
export type { StyledBlock, TextBlock, TextLine } from "./block.js";
export { drawLines, placeLines } from "./lines.js";
export type { LinesStyle, PlacedLine } from "./lines.js";
export { measureIn } from "./measure.js";

export { optionalString } from "../props.js";
export { escapeXml, fitText, textElement, wrapText } from "../text/index.js";
export type {
  FitOptions,
  FittedText,
  MeasureAt,
  MeasureLine,
  TextAttributes,
} from "../text/index.js";
export type {
  Dimensions,
  MeasureText,
  MetaImageProps,
  ResolvedConfig,
  Template,
  TemplateContext,
  TextStyle,
} from "../types.js";
