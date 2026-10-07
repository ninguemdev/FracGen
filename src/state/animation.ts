import type { Params } from './params';

/** Phases integrated frame by frame from the speed parameters: runtime state, not Params. */
export interface Animation {
  /** Palette shift from Color Cycle, in palette cycles. */
  colorCycleOffset: number;
  /** Warp phase from the warp Animation speed, in radians. */
  warpPhase: number;
}

export function createAnimation(): Animation {
  return { colorCycleOffset: 0, warpPhase: 0 };
}

// Integrating speed × Δt, rather than computing speed × elapsed time, keeps the image from
// jumping when a speed slider moves.
export function advanceAnimation(animation: Animation, params: Params, deltaTime: number): void {
  animation.colorCycleOffset += params.colorCycle * deltaTime;
  animation.warpPhase += params.warpSpeed * deltaTime;
}
