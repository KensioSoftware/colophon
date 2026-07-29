import { box, textElement } from "../../layout/index.js";
import type { Badge } from "../../types.js";

/**
 * The corner badge: a rounded plate with the badge text on it, sized from the
 * plate height so it scales with the image rather than the text length.
 */
export function renderBadge(
  badge: Badge,
  fontFamily: string,
  brand: string,
  pad: number,
  height: number,
): string {
  const fontSize = Math.round(height * 0.6);
  const padX = Math.round(height * 0.36);
  const width = Math.round(badge.text.length * fontSize * 0.64 + padX * 2);

  const plate = box(
    { x: pad, y: pad, width, height },
    { radius: Math.round(height * 0.1), fill: badge.background ?? "#ffffff" },
  );

  const text = textElement(badge.text, {
    x: pad + padX,
    y: pad + Math.round(height * 0.72),
    fontFamily,
    fontSize,
    fontWeight: 900,
    fill: badge.color ?? brand,
  });

  return plate + text;
}
