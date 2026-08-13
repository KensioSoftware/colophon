import { linesHeight, stack } from "../../layout/index.js";
import type { Template, TemplateContext } from "../../types.js";
import { drawSlot, footerLine } from "../bottom.js";
import { contentArea, imageFrame, markRoom } from "../frame.js";
import { logoElement, logoRect } from "../logo.js";
import {
  subtitleGap,
  subtitleLineHeight,
  subtitleRoom,
  thumbnailSubtitle,
  thumbnailTitle,
  titleLineHeight,
} from "./lines.js";

/**
 * The margin, as a fraction of the width. Tighter than any of the other
 * centred layouts, because the room the margins give back is the whole point
 * of this one.
 */
const padScale = 0.055;

/**
 * A video thumbnail: one title, set as large as it will go, with an optional
 * line under it.
 *
 * It is meant for YouTube, whose own recommendation is 1280x720, and
 * `SIZE_PRESETS.thumbnail` is that size. What makes it a template of its own
 * rather than a `card` at other proportions is where it is looked at. A share
 * image is seen more or less at the size it was rendered; a thumbnail is seen
 * in a list, a sidebar or a phone, at something between a third and a sixth of
 * it. So the title is grown to fill the frame rather than set at a fraction of
 * the height, there is one text field by default rather than three, and the
 * margins are tighter than elsewhere.
 *
 * Everything the other centred templates draw is still drawn: the logo above,
 * the footer along the bottom. Both are worth having on a channel's images,
 * and a size can drop the footer with `footer: ""` where the title should have
 * the whole frame.
 */
export const thumbnailTemplate: Template = {
  name: "thumbnail",
  render({
    props,
    config,
    dimensions,
    measure,
    logo,
    avatar,
  }: TemplateContext): string {
    const { height } = dimensions;
    const frame = imageFrame(dimensions, config, avatar, { padScale });
    const { pad } = frame;
    const mark = logoRect(logo, frame.full, pad, "middle");

    const area = contentArea(frame, markRoom(mark?.height, pad / 2));
    const text = {
      measure,
      fontFamily: config.fontFamily,
      contentWidth: area.width,
      contentHeight: area.height,
      height,
    };

    const subtitle = thumbnailSubtitle(props, text);
    const title = thumbnailTitle(props, text, subtitleRoom(subtitle, height));

    const [titleSlot, subtitleSlot] = stack(
      [
        { size: linesHeight(title, titleLineHeight) },
        {
          size: linesHeight(subtitle, subtitleLineHeight),
          gapBefore: subtitle.length === 0 ? 0 : subtitleGap(height),
        },
      ],
      area,
    );

    const style = {
      fontFamily: config.fontFamily,
      fill: config.colors.foreground,
      anchor: "middle" as const,
    };

    return (
      logoElement(logo, mark) +
      drawSlot(title, titleSlot, { ...style, lineHeight: titleLineHeight }) +
      drawSlot(subtitle, subtitleSlot, {
        ...style,
        lineHeight: subtitleLineHeight,
      }) +
      footerLine(config, frame, avatar, measure, "middle")
    );
  },
};
