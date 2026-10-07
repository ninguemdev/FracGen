import type { Vec2 } from './vec2';

export interface BlackHole {
  /** Horizon radius, in view units; 0 turns the black hole off. */
  size: number;
  /** −1…1, like Kerr's a/M: how strongly the sky near the horizon is dragged around. */
  spin: number;
  /** Orbit of the whole sky, accumulated from the spin, in radians. */
  phase: number;
}

// Must match the black hole constants in fractal.frag.
const EINSTEIN_RATIO = 1.5;
const FRAME_DRAG_TWIST = Math.PI;
// Keeps the centre pixel finite; it lies inside the horizon and is painted black anyway.
const MIN_RADIUS = 1e-4;

/** CPU twin of blackHoleLens() in fractal.frag — keep both in sync. */
export function blackHoleLens(p: Vec2, hole: BlackHole): Vec2 {
  if (hole.size <= 0) return p;

  const radius = Math.max(Math.hypot(p[0], p[1]), MIN_RADIUS);
  const einstein = EINSTEIN_RATIO * hole.size;
  const bend = 1 - (einstein * einstein) / (radius * radius);
  const x = p[0] * bend;
  const y = p[1] * bend;

  const drag = (hole.size / radius) ** 2;
  const angle = -(hole.phase + FRAME_DRAG_TWIST * hole.spin * drag);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [cos * x - sin * y, sin * x + cos * y];
}
