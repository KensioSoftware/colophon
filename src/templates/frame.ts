import { footerBaseline, footerFontSize, hasFooter } from "./footer.js";
import { inset } from "../layout/index.js";
import type { Rect } from "../layout/index.js";
import type { Dimensions, ImageAsset, ResolvedConfig } from "../types.js";

/** Margin from the image edge, as a fraction of its width. */
const defaultPadScale = 0.075;

/** Clear space between the content and the footer line, as a fraction of it. */
const footerGap = 0.02;

/**
 * The measurements every template starts from: where its margins are, and what
 * the line along the bottom leaves it.
 *
 * Each of the built-ins worked these out for itself, which was fine while there
 * were three of them and is nine copies of the same arithmetic now. The values
 * are the ones the layouts already used, so what this replaces is the repetition
 * rather than the decisions.
 */
export interface Frame {
  /** The margin, applied to every edge. */
  readonly pad: number;
  readonly footerFontSize: number;
  /** The whole image, as the rectangle the content is inset from. */
  readonly full: Rect;
  /**
   * Vertical room to leave below the content, which is the footer line plus
   * its clear space, or nothing at all where there is no footer to draw.
   */
  readonly footerRoom: number;
  /** The baseline that footer sits on, whether or not there is one. */
  readonly footerY: number;
}

/** What a template can tell the frame about itself. */
export interface FrameOptions {
  /** The margin, as a fraction of the image's width. */
  readonly padScale?: number;
  /**
   * Whether the template draws something of its own on the bottom line, such
   * as a byline, so the room is left for it even where the config has no
   * footer and the post has no avatar.
   */
  readonly footer?: boolean;
}

/**
 * Work out a template's frame. The avatar counts as a footer even where the
 * config carries no text, since the picture is drawn on the same line and
 * needs the same room.
 */
export function imageFrame(
  dimensions: Dimensions,
  config: ResolvedConfig,
  avatar: ImageAsset | undefined,
  options: FrameOptions = {},
): Frame {
  const { width, height } = dimensions;
  const pad = Math.round(width * (options.padScale ?? defaultPadScale));
  const fontSize = footerFontSize(dimensions);
  const isDrawn =
    options.footer === true || hasFooter(config) || avatar !== undefined;

  return {
    pad,
    footerFontSize: fontSize,
    full: { x: 0, y: 0, width, height },
    footerRoom: isDrawn ? fontSize + Math.round(height * footerGap) : 0,
    footerY: footerBaseline(height, pad, fontSize),
  };
}

/**
 * The room a mark along the top of the image takes, including the clear space
 * under it, or nothing at all where there is no mark.
 *
 * A height of nothing is the same as no mark, since the gap under a mark that
 * is not there is the space a template would then be reserving for nobody.
 */
export function markRoom(height: number | undefined, gap: number): number {
  return height === undefined || height === 0 ? 0 : height + gap;
}

/**
 * The space a template's content has: the whole image, less the margins, less
 * whatever sits along the top, less the footer line.
 *
 * `top` is what {@link markRoom} worked out, or whatever else the template put
 * up there. It is extra: the margin is added here, so a template with nothing
 * along the top passes nothing.
 */
export function contentArea(frame: Frame, top = 0): Rect {
  return inset(frame.full, {
    top: frame.pad + top,
    right: frame.pad,
    left: frame.pad,
    bottom: frame.pad + frame.footerRoom,
  });
}

/**
 * A gap that is only there when the thing before it is.
 *
 * Stacking a group that a post may not have given anything to means the space
 * above it has to disappear along with it, or the layout keeps a hole where
 * the missing part was.
 */
export function gapAfter(size: number, gap: number): number {
  return size === 0 ? 0 : gap;
}
