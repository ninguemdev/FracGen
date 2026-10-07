import { describe, expect, it } from 'vitest';
import { DEFAULT_PARAMS, PARAM_SPECS, type ParamKey, type Params } from './params';
import { applyPreset, PRESETS } from './presets';

const entries = PRESETS.flatMap((preset) =>
  Object.entries(preset.params).map(([key, value]) => [preset.name, key as ParamKey, value] as const),
);

describe('presets', () => {
  it('have unique names', () => {
    expect(new Set(PRESETS.map((preset) => preset.name)).size).toBe(PRESETS.length);
  });

  it.each(entries)('%s: %s lies within its range', (_, key, value) => {
    const { min, max, step } = PARAM_SPECS[key];
    expect(value).toBeGreaterThanOrEqual(min);
    expect(value).toBeLessThanOrEqual(max);
    if (step === 1) expect(Number.isInteger(value)).toBe(true);
  });

  it('sets the preset values and defaults for everything else', () => {
    const preset = PRESETS[1];
    const params: Params = { ...DEFAULT_PARAMS, zoom: 40, contrast: 1.8, warpOctaves: 5 };
    applyPreset(params, preset);
    expect(params).toEqual({ ...DEFAULT_PARAMS, ...preset.params });
  });

  it('keeps the brush as the user set it', () => {
    const params: Params = { ...DEFAULT_PARAMS, brushMode: 3, brushRadius: 0.5, brushStrength: 0.9 };
    applyPreset(params, PRESETS[0]);
    expect(params).toMatchObject({ brushMode: 3, brushRadius: 0.5, brushStrength: 0.9 });
  });
});
