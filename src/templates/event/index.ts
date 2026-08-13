import { linesHeight, optionalString, stack } from "../../layout/index.js";
import type { Template, TemplateContext } from "../../types.js";
import { drawSlot, footerLine } from "../bottom.js";
import { contentArea, gapAfter, imageFrame, markRoom } from "../frame.js";
import { logoElement, logoRect } from "../logo.js";
import { eventLines } from "./lines.js";
import { datePlate, plateHeight, plateStyle } from "./plate.js";

/** How the lines of the title and location are stacked. */
const lineHeight = 1.24;

/**
 * A talk, a meetup or a workshop: the date on a plate, then what it is and
 * where. Reads `date`, `title` and `location`.
 *
 * The date is set apart on the accent colour rather than being another line of
 * text, because it is the one thing a reader is scanning for. Nothing here
 * parses or formats it: whatever the post wrote is what is drawn, since a
 * build cannot know which locale or how much precision the event wants.
 */
export const eventTemplate: Template = {
  name: "event",
  render({
    props,
    config,
    dimensions,
    measure,
    logo,
    avatar,
  }: TemplateContext): string {
    const { height } = dimensions;
    const { fontFamily, colors } = config;
    const frame = imageFrame(dimensions, config, avatar, {
      padScale: 0.09,
    });
    const { pad } = frame;
    const mark = logoRect(logo, frame.full, pad, "middle");

    const area = contentArea(frame, markRoom(mark?.height, pad / 2));

    const lines = eventLines(props, {
      measure,
      fontFamily,
      contentWidth: area.width,
      titleFs: Math.round(height * 0.095),
      locationFs: Math.round(height * 0.045),
      height,
    });

    const date = optionalString(props["date"]) ?? "";
    const plate = plateHeight(date, height);

    const [dateSlot, textSlot] = stack(
      [
        { size: plate },
        {
          size: linesHeight(lines, lineHeight),
          gapBefore: gapAfter(plate, Math.round(height * 0.045)),
        },
      ],
      area,
    );

    const body = drawSlot(lines, textSlot, {
      fontFamily,
      fill: colors.foreground,
      lineHeight,
      anchor: "middle",
    });

    const footer = footerLine(config, frame, avatar, measure, "middle");

    return (
      logoElement(logo, mark) +
      datePlate(date, dateSlot, plateStyle(config), measure) +
      body +
      footer
    );
  },
};
