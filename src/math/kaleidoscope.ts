import type { Vec2 } from './vec2';

const TAU = 2 * Math.PI;

/**
 * CPU twin of kaleidoscope() in fractal.frag — keep both in sync. Maps p onto the first of
 * `sides` angular sectors (centred on +x), reflecting it about the centre line when mirrored.
 */
export function kaleidoscope(p: Vec2, sides: number, mirrored: boolean): Vec2 {
  if (sides < 2) return p;

  const sector = TAU / sides;
  const shifted = Math.atan2(p[1], p[0]) + sector / 2;
  // GLSL mod(): unlike JavaScript's %, the result is never negative for a positive divisor.
  let angle = shifted - sector * Math.floor(shifted / sector) - sector / 2;
  if (mirrored) angle = Math.abs(angle);

  const radius = Math.hypot(p[0], p[1]);
  return [radius * Math.cos(angle), radius * Math.sin(angle)];
}
