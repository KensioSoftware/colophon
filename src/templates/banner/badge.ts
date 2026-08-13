import { box, textElement } from "../../layout/index.js";
import type { Badge } from "../../types.js";

/**
 * The corner badge: a rounded plate with the badge text on it, sized from the
 * plate height so it scales with the image rather than the text length.
 *
 * `corner` is where the plate's top-left goes, which the template works out
 * from its frame rather than from the image, so that a safe area brings the
 * badge in along with everything else.
 */
export function renderBadge(
  badge: Badge,
  fontFamily: string,
  brand: string,
  corner: { readonly x: number; readonly y: number },
  height: number,
): string {
  const fontSize = Math.round(height * 0.6);
  const padX = Math.round(height * 0.36);
  const width = Math.round(badge.text.length * fontSize * 0.64 + padX * 2);

  const plate = box(
    { x: corner.x, y: corner.y, width, height },
    { radius: Math.round(height * 0.1), fill: badge.background ?? "#ffffff" },
  );

  const text = textElement(badge.text, {
    x: corner.x + padX,
    y: corner.y + Math.round(height * 0.72),
    fontFamily,
    fontSize,
    fontWeight: 900,
    fill: badge.color ?? brand,
  });

  return plate + text;
}
