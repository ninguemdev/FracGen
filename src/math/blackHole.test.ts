import { describe, expect, it } from 'vitest';
import { blackHoleLens, type BlackHole } from './blackHole';
import type { Vec2 } from './vec2';

const still: BlackHole = { size: 0.2, spin: 0, phase: 0 };
const length = (p: Vec2) => Math.hypot(p[0], p[1]);

describe('blackHoleLens', () => {
  it('leaves the view alone when off', () => {
    const p: Vec2 = [0.4, -0.3];
    expect(blackHoleLens(p, { size: 0, spin: 1, phase: 2 })).toEqual(p);
  });

  it('shows the point straight behind the hole on the Einstein ring', () => {
    const ring = 1.5 * still.size;
    for (const angle of [0, 1, 2.5, 4]) {
      const [x, y] = blackHoleLens([ring * Math.cos(angle), ring * Math.sin(angle)], still);
      expect(Math.hypot(x, y)).toBeCloseTo(0, 12);
    }
  });

  it('shows the sky beyond a point outside the ring, and the mirrored sky inside it', () => {
    const outside: Vec2 = [0.5, 0.1];
    const inside: Vec2 = [0.25, 0.05];
    const seenOutside = blackHoleLens(outside, still);
    const seenInside = blackHoleLens(inside, still);
    // Same direction, but closer to the centre: the sky appears pushed away from the hole.
    expect(seenOutside[0] / outside[0]).toBeCloseTo(seenOutside[1] / outside[1], 12);
    expect(length(seenOutside)).toBeLessThan(length(outside));
    // Inside the ring the image is flipped through the centre.
    expect(seenInside[0] * inside[0]).toBeLessThan(0);
  });

  it('bends less and less far from the hole', () => {
    const far: Vec2 = [30, -40];
    const [x, y] = blackHoleLens(far, { ...still, spin: 1 });
    expect(Math.hypot(x - far[0], y - far[1]) / length(far)).toBeLessThan(1e-3);
  });

  it('spin and orbit turn the sky without changing the bending', () => {
    const p: Vec2 = [0.35, 0.2];
    const plain = blackHoleLens(p, still);
    const spun = blackHoleLens(p, { ...still, spin: 0.8, phase: 1.1 });
    expect(length(spun)).toBeCloseTo(length(plain), 12);
    expect(Math.hypot(spun[0] - plain[0], spun[1] - plain[1])).toBeGreaterThan(0.01);
  });

  it('stays finite at the very centre', () => {
    const [x, y] = blackHoleLens([0, 0], { ...still, spin: 1 });
    expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
  });
});
