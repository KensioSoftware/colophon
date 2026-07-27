/**
 * Split an `#rrggbb` or `#rrggbbaa` colour into a fill and an optional opacity,
 * since SVG 1.1 `fill` does not accept an alpha channel.
 */
export function splitColor(color: string | undefined): {
  color: string | undefined;
  opacity: number | undefined;
} {
  if (color === undefined || color === "") {
    return { color: undefined, opacity: undefined };
  }

  if (!/^#[0-9a-f]{8}$/i.test(color)) {
    return { color, opacity: undefined };
  }

  const alpha = Number.parseInt(color.slice(7, 9), 16) / 255;
  return { color: color.slice(0, 7), opacity: Math.round(alpha * 100) / 100 };
}
