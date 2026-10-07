import type { Vec2 } from './vec2';

export interface BrushForce {
  /** brushMode: 0 off, 1 attract, 2 repel, 3 twist. */
  mode: number;
  /** Brush position, in the same coordinates as the points it moves. */
  center: Vec2;
  /** Standard deviation of the Gaussian falloff. */
  radius: number;
  /** 0–1: the Strength param scaled by the press envelope. */
  strength: number;
}

// Must match the brush constants in fractal.frag.
const ATTRACT = 1;
const REPEL = 2;
const TWIST = 3;
const ATTRACT_GAIN = 2;
const REPEL_GAIN = 1;
const TWIST_ANGLE = Math.PI;

/** CPU twin of brushForce() in fractal.frag — keep both in sync. */
export function brushForce(p: Vec2, brush: BrushForce): Vec2 {
  const [cx, cy] = brush.center;
  const dx = p[0] - cx;
  const dy = p[1] - cy;
  const weight = brush.strength * Math.exp(-(dx * dx + dy * dy) / (2 * brush.radius * brush.radius));

  if (brush.mode === ATTRACT) return [p[0] + ATTRACT_GAIN * weight * dx, p[1] + ATTRACT_GAIN * weight * dy];
  if (brush.mode === REPEL) return [p[0] - REPEL_GAIN * weight * dx, p[1] - REPEL_GAIN * weight * dy];
  if (brush.mode === TWIST) {
    const angle = -TWIST_ANGLE * weight;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [cx + cos * dx - sin * dy, cy + sin * dx + cos * dy];
  }
  return p;
}
