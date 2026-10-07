import { describe, expect, it } from 'vitest';
import { brushForce, type BrushForce } from './brushForce';
import type { Vec2 } from './vec2';

const OFF = 0;
const ATTRACT = 1;
const REPEL = 2;
const TWIST = 3;

const brush = (mode: number, strength = 1): BrushForce => ({
  mode,
  center: [0.3, -0.2],
  radius: 0.25,
  strength,
});
const distance = (p: Vec2, q: Vec2) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const near: Vec2 = [0.45, -0.1];

describe('brushForce', () => {
  it('leaves points alone when off or without strength', () => {
    expect(brushForce(near, brush(OFF))).toEqual(near);
    expect(brushForce(near, brush(ATTRACT, 0))).toEqual(near);
  });

  it.each([ATTRACT, REPEL, TWIST])('keeps the point under the brush in place (mode %i)', (mode) => {
    const { center } = brush(mode);
    expect(brushForce(center, brush(mode))).toEqual(center);
  });

  it.each([ATTRACT, REPEL, TWIST])('fades out far from the brush (mode %i)', (mode) => {
    const far: Vec2 = [-1.2, 0.9];
    const [x, y] = brushForce(far, brush(mode));
    expect(x).toBeCloseTo(far[0], 9);
    expect(y).toBeCloseTo(far[1], 9);
  });

  // Showing at p what lies farther out squeezes the image toward the brush, and vice versa.
  it('attract looks farther from the brush, repel closer to it', () => {
    const { center } = brush(ATTRACT);
    expect(distance(brushForce(near, brush(ATTRACT)), center)).toBeGreaterThan(distance(near, center));
    expect(distance(brushForce(near, brush(REPEL)), center)).toBeLessThan(distance(near, center));
  });

  it('twist turns points around the brush without changing their distance to it', () => {
    const { center } = brush(TWIST);
    const turned = brushForce(near, brush(TWIST));
    expect(distance(turned, center)).toBeCloseTo(distance(near, center), 12);
    expect(distance(turned, near)).toBeGreaterThan(0.01);
  });

  it.each([ATTRACT, REPEL])('never folds the image over at full strength (mode %i)', (mode) => {
    // Along a ray from the brush, the looked-up distance must keep growing with the distance.
    const { center } = brush(mode);
    let previous = 0;
    for (let r = 0.005; r < 1.5; r += 0.005) {
      const looked = distance(brushForce([center[0] + r, center[1]], brush(mode)), center);
      expect(looked).toBeGreaterThan(previous);
      previous = looked;
    }
  });
});
