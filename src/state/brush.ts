import type { Vec2 } from '../math/vec2';

/** The mouse brush's runtime state; its mode, radius and strength are Params. */
export interface Brush {
  /** Pointer position in view coordinates; it stays put after release while the force fades. */
  center: Vec2;
  pressed: boolean;
  /** Eases toward 1 while pressed and back to 0 after release, so the force never pops. */
  intensity: number;
}

// Time constant of the press envelope, in seconds.
const FADE_TIME = 0.12;
// An exponential fade never reaches zero, and even a tiny leftover force visibly shifts the
// chaotic fractal boundary, so the fade ends here.
const FADE_END = 1e-3;

export function createBrush(): Brush {
  return { center: [0, 0], pressed: false, intensity: 0 };
}

// An exponential approach traces the same curve at any frame rate.
export function advanceBrush(brush: Brush, deltaTime: number): void {
  const target = brush.pressed ? 1 : 0;
  brush.intensity += (target - brush.intensity) * (1 - Math.exp(-deltaTime / FADE_TIME));
  if (!brush.pressed && brush.intensity < FADE_END) brush.intensity = 0;
}
