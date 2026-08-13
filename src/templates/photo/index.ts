import { drawLines, image, scrim } from "../../layout/index.js";
import type { Template, TemplateContext } from "../../types.js";
import { footerLine } from "../bottom.js";
import { contentArea, imageFrame, markRoom } from "../frame.js";
import { logoElement, logoRect } from "../logo.js";
import { photoLines } from "./lines.js";

/** The wash over the picture: clear at the top, dark where the words are. */
const scrimFrom = 0.15;
const scrimTo = 0.85;

const scrimId = "colophon-photo-scrim";

/**
 * A photograph with the title over it, set along the bottom.
 *
 * The picture comes from the post's `image` prop rather than from config,
 * which is what separates this from setting a background image: config is the
 * same for every post, and the whole point here is a different photograph on
 * each one. A post with no `image` still renders, over the configured
 * background, which is what a template has to do with a prop it was not given.
 *
 * The wash over the picture is not optional. Text over an unshaded photograph
 * is legible or not depending on what the photograph happens to hold, and a
 * build cannot look at it. The scrim is heavier than the one a background
 * image gets, because here the words sit right on top of it.
 */
export const photoTemplate: Template = {
  name: "photo",
  render({
    props,
    config,
    dimensions,
    measure,
    logo,
    avatar,
    picture,
  }: TemplateContext): string {
    const { width, height } = dimensions;
    const { fontFamily, colors } = config;
    const frame = imageFrame(dimensions, config, avatar);
    const { pad } = frame;
    const mark = logoRect(logo, frame.full, pad, "start");

    // Over the whole image rather than over the frame, so that a safe area
    // moves the words and leaves the picture behind them full-bleed. The part
    // a platform crops off is still seen on some of its clients, and a
    // photograph stopping short of the edge would be the visible fault there.
    const canvas = { x: 0, y: 0, width, height };
    const backdrop =
      picture === undefined
        ? ""
        : image(canvas, picture.href, { fit: "cover" }) +
          scrim(canvas, scrimId, { from: scrimFrom, to: scrimTo });

    const area = contentArea(frame, markRoom(mark?.height, pad / 2));

    // Set along the bottom, where the scrim is heaviest and where a picture
    // usually has least going on.
    const body = drawLines(
      photoLines(props, {
        measure,
        fontFamily,
        contentWidth: area.width,
        titleFs: Math.round(height * 0.086),
        standfirstFs: Math.round(height * 0.042),
        height,
      }),
      area,
      { fontFamily, fill: colors.foreground, lineHeight: 1.24, align: "end" },
    );

    const footer = footerLine(config, frame, avatar, measure, "start", 0.85);

    return backdrop + logoElement(logo, mark) + body + footer;
  },
};
