import type { Params } from './params';

/** Phases integrated frame by frame from the speed parameters: runtime state, not Params. */
export interface Animation {
  /** Palette shift from Color Cycle, in palette cycles. */
  colorCycleOffset: number;
  /** Warp phase from the warp Animation speed, in radians. */
  warpPhase: number;
  /** Orbit of the sky around the black hole, from its spin, in radians. */
  blackHolePhase: number;
}

export function createAnimation(): Animation {
  return { colorCycleOffset: 0, warpPhase: 0, blackHolePhase: 0 };
}

// Orbit speed of the sky around the black hole at spin 1, in radians per second.
const BLACK_HOLE_ORBIT_SPEED = 0.25;

// Integrating speed × Δt, rather than computing speed × elapsed time, keeps the image from
// jumping when a speed slider moves.
export function advanceAnimation(animation: Animation, params: Params, deltaTime: number): void {
  animation.colorCycleOffset += params.colorCycle * deltaTime;
  animation.warpPhase += params.warpSpeed * deltaTime;
  animation.blackHolePhase += params.blackHoleSpin * BLACK_HOLE_ORBIT_SPEED * deltaTime;
}

/** The feedback applied in one frame. */
export interface FeedbackFrame {
  /** Share of the previous frame kept. */
  amount: number;
  /** Magnification of the previous frame. */
  zoom: number;
  /** Rotation of the previous frame, in radians. */
  rotation: number;
}

// The feedback params are per frame at this rate (FRACTAL_MATH_ENGINE.md §34 uses rad/frame).
const REFERENCE_FRAME_RATE = 60;

// Scaled to the real frame time so trails fade, grow and turn equally fast at any frame rate:
// the kept share and the zoom compound from frame to frame (powers), the rotation adds up.
export function feedbackForFrame(params: Params, deltaTime: number): FeedbackFrame {
  const frames = deltaTime * REFERENCE_FRAME_RATE;
  return {
    amount: params.feedbackAmount ** frames,
    zoom: params.feedbackZoom ** frames,
    rotation: params.feedbackRotation * frames,
  };
}
