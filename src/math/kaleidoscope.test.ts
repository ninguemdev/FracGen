import { describe, expect, it } from 'vitest';
import { kaleidoscope } from './kaleidoscope';
import type { Vec2 } from './vec2';

const rotate = ([x, y]: Vec2, angle: number): Vec2 => [
  x * Math.cos(angle) - y * Math.sin(angle),
  x * Math.sin(angle) + y * Math.cos(angle),
];

const expectClose = (actual: Vec2, expected: Vec2) => {
  expect(actual[0]).toBeCloseTo(expected[0], 10);
  expect(actual[1]).toBeCloseTo(expected[1], 10);
};

const samples: Vec2[] = [
  [0.7, 0.2],
  [-0.4, 0.9],
  [-1.1, -0.3],
  [0.25, -0.8],
];

describe('kaleidoscope', () => {
  it('leaves points untouched with a single side', () => {
    for (const p of samples) {
      expect(kaleidoscope(p, 1, true)).toEqual(p);
      expect(kaleidoscope(p, 1, false)).toEqual(p);
    }
  });

  it.each([2, 3, 6, 16])('repeats every sector with %i sides', (sides) => {
    for (const p of samples) {
      for (const mirrored of [false, true]) {
        expectClose(kaleidoscope(rotate(p, (2 * Math.PI) / sides), sides, mirrored), kaleidoscope(p, sides, mirrored));
      }
    }
  });

  it('reflects about the sector centre line when mirrored', () => {
    for (const [x, y] of samples) {
      expectClose(kaleidoscope([x, -y], 6, true), kaleidoscope([x, y], 6, true));
    }
  });

  it('keeps the radius and lands inside the first sector', () => {
    const sides = 5;
    const halfSector = Math.PI / sides;
    for (const p of samples) {
      for (const mirrored of [false, true]) {
        const [x, y] = kaleidoscope(p, sides, mirrored);
        const angle = Math.atan2(y, x);
        expect(Math.hypot(x, y)).toBeCloseTo(Math.hypot(...p), 10);
        expect(angle).toBeGreaterThanOrEqual(mirrored ? -1e-12 : -halfSector - 1e-12);
        expect(angle).toBeLessThanOrEqual(halfSector + 1e-12);
      }
    }
  });
});
