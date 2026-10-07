import { describe, expect, it } from 'vitest';
import { advanceBrush, createBrush } from './brush';

describe('brush envelope', () => {
  it('eases in while pressed and out after release', () => {
    const brush = { ...createBrush(), pressed: true };
    advanceBrush(brush, 0.05);
    const early = brush.intensity;
    expect(early).toBeGreaterThan(0);
    expect(early).toBeLessThan(1);

    advanceBrush(brush, 1);
    expect(brush.intensity).toBeGreaterThan(0.99);
    expect(brush.intensity).toBeLessThanOrEqual(1);

    brush.pressed = false;
    advanceBrush(brush, 0.1);
    expect(brush.intensity).toBeGreaterThan(0);
    expect(brush.intensity).toBeLessThan(1);
  });

  it('ends the fade at exactly zero', () => {
    const brush = { ...createBrush(), intensity: 1 };
    for (let frame = 0; frame < 60; frame++) advanceBrush(brush, 1 / 60);
    expect(brush.intensity).toBe(0);
  });

  it('follows the same curve at any frame rate', () => {
    const slow = { ...createBrush(), pressed: true };
    const fast = { ...createBrush(), pressed: true };
    advanceBrush(slow, 1 / 30);
    advanceBrush(fast, 1 / 60);
    advanceBrush(fast, 1 / 60);
    expect(fast.intensity).toBeCloseTo(slow.intensity, 12);
  });
});
