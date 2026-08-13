/**
 * The waves the ground is made of: how far one runs before it repeats, which
 * way it runs, and how much of the height it accounts for.
 *
 * Three at unrelated wavelengths and angles is enough to read as terrain
 * rather than as a pattern. Deliberately not random: the rebuild stamp assumes
 * one config draws one picture, so a texture that rolled dice would come out
 * different every time nothing had changed.
 */
const waves = [
  { length: 260, dx: 1, dy: 0.35, weight: 0.5 },
  { length: 170, dx: -0.4, dy: 1, weight: 0.32 },
  { length: 95, dx: 0.7, dy: -0.8, weight: 0.18 },
];

/**
 * The height of the ground at a point, from -1 to 1.
 *
 * `seed` shifts each wave's phase by a different amount, so one number picks a
 * whole landscape and the same number always picks the same one.
 */
export function height(x: number, y: number, seed: number): number {
  let sum = 0;

  for (const [index, wave] of waves.entries()) {
    const along = (x * wave.dx + y * wave.dy) / wave.length;
    sum += wave.weight * Math.sin(along + seed * (index + 1) * 1.7);
  }

  return sum;
}
