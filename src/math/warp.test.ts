import { describe, expect, it } from 'vitest';
import type { Vec2 } from './vec2';
import { domainWarp, type Warp } from './warp';

const off: Warp = { strength: 0, frequency: 3, octaves: 3, rotation: 0, phase: 0.4 };
const samples: Vec2[] = [
  [0.7, 0.2],
  [-0.4, 0.9],
  [-1.1, -0.3],
];

describe('domainWarp', () => {
  it('leaves points untouched with zero strength and rotation', () => {
    for (const p of samples) expect(domainWarp(p, off)).toEqual(p);
  });

  it('keeps each displacement within the summed octave amplitudes', () => {
    const warp: Warp = { ...off, strength: 0.3, octaves: 4 };
    // Octave i moves the point by at most √2 · strength / 2^i.
    const bound = Math.SQRT2 * warp.strength * (2 - 2 ** (1 - warp.octaves));
    for (const p of samples) {
      const [x, y] = domainWarp(p, warp);
      expect(Math.hypot(x - p[0], y - p[1])).toBeLessThanOrEqual(bound + 1e-12);
      expect(Math.hypot(x - p[0], y - p[1])).toBeGreaterThan(0);
    }
  });

  it('rotates without changing the distance to the centre', () => {
    const warp: Warp = { ...off, rotation: 1.2 };
    for (const p of samples) {
      const [x, y] = domainWarp(p, warp);
      expect(Math.hypot(x, y)).toBeCloseTo(Math.hypot(...p), 10);
    }
  });
});
