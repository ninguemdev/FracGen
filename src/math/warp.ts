import type { Vec2 } from './vec2';

export interface Warp {
  /** Displacement amplitude of the first octave, in view units. */
  strength: number;
  /** Spatial frequency of the first octave. */
  frequency: number;
  octaves: number;
  /** Amplitude of the rotational warp, in radians. */
  rotation: number;
  /** Animation phase, accumulated from the warp speed. */
  phase: number;
}

// Must match OCTAVE_PHASE_STEP in fractal.frag.
const OCTAVE_PHASE_STEP = 1.7;

/** CPU twin of domainWarp() in fractal.frag — keep both in sync. */
export function domainWarp(p: Vec2, warp: Warp): Vec2 {
  let [x, y] = p;
  let amplitude = warp.strength;
  let frequency = warp.frequency;
  for (let i = 0; i < warp.octaves; i++) {
    const offset = i * OCTAVE_PHASE_STEP;
    const dx = amplitude * Math.sin(frequency * y + warp.phase + offset);
    const dy = amplitude * Math.cos(frequency * x - warp.phase + offset);
    x += dx;
    y += dy;
    amplitude *= 0.5;
    frequency *= 2;
  }

  const angle = warp.rotation * Math.sin(warp.frequency * Math.hypot(x, y) - warp.phase);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [cos * x - sin * y, sin * x + cos * y];
}
