import { describe, expect, it } from 'vitest';
import { DEFAULT_PARAMS, PARAM_SPECS, type ParamKey } from './params';

const keys = Object.keys(PARAM_SPECS) as ParamKey[];

describe('params', () => {
  it('defines a default for every spec and nothing else', () => {
    expect(Object.keys(DEFAULT_PARAMS).sort()).toEqual([...keys].sort());
  });

  it.each(keys)('%s default lies within its range', (key) => {
    const { min, max } = PARAM_SPECS[key];
    expect(DEFAULT_PARAMS[key]).toBeGreaterThanOrEqual(min);
    expect(DEFAULT_PARAMS[key]).toBeLessThanOrEqual(max);
  });

  it.each(keys)('%s has a valid range', (key) => {
    const { min, max, step, logarithmic } = PARAM_SPECS[key];
    expect(min).toBeLessThan(max);
    expect(step).toBeGreaterThan(0);
    if (logarithmic) expect(min).toBeGreaterThan(0);
  });

  it.each(keys.filter((key) => PARAM_SPECS[key].options))('%s indexes exactly its options', (key) => {
    const { min, max, step, options = [] } = PARAM_SPECS[key];
    expect(min).toBe(0);
    expect(max).toBe(options.length - 1);
    expect(step).toBe(1);
    expect(Number.isInteger(DEFAULT_PARAMS[key])).toBe(true);
  });
});
