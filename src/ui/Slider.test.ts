import { describe, expect, it } from 'vitest';
import type { ParamSpec } from '../state/params';
import { fromSliderPosition, toSliderPosition } from './Slider';

const linear: ParamSpec = { label: 'Linear', min: -1, max: 1, step: 0.01 };
const logarithmic: ParamSpec = { label: 'Log', min: 0.2, max: 20, step: 0.01, logarithmic: true };

describe('slider scale', () => {
  it('passes linear values through unchanged', () => {
    expect(toSliderPosition(linear, 0.37)).toBe(0.37);
    expect(fromSliderPosition(linear, -0.5)).toBe(-0.5);
  });

  it('round-trips logarithmic values', () => {
    for (const value of [0.2, 1, 3.7, 20]) {
      expect(fromSliderPosition(logarithmic, toSliderPosition(logarithmic, value))).toBeCloseTo(value, 10);
    }
  });

  it('puts the geometric mean of a logarithmic range at the slider midpoint', () => {
    const midpoint = (toSliderPosition(logarithmic, 0.2) + toSliderPosition(logarithmic, 20)) / 2;
    expect(fromSliderPosition(logarithmic, midpoint)).toBeCloseTo(2, 10);
  });
});
