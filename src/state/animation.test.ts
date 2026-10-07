import { describe, expect, it } from 'vitest';
import { feedbackForFrame } from './animation';
import { DEFAULT_PARAMS, type Params } from './params';

const params: Params = {
  ...DEFAULT_PARAMS,
  feedbackAmount: 0.9,
  feedbackZoom: 1.02,
  feedbackRotation: 0.01,
};

describe('feedbackForFrame', () => {
  it('applies the params as they are at 60 fps', () => {
    const frame = feedbackForFrame(params, 1 / 60);
    expect(frame.amount).toBeCloseTo(0.9, 12);
    expect(frame.zoom).toBeCloseTo(1.02, 12);
    expect(frame.rotation).toBeCloseTo(0.01, 12);
  });

  it('gives two short frames the same effect as one frame of their total length', () => {
    const half = feedbackForFrame(params, 1 / 288);
    const whole = feedbackForFrame(params, 1 / 144);
    expect(half.amount ** 2).toBeCloseTo(whole.amount, 12);
    expect(half.zoom ** 2).toBeCloseTo(whole.zoom, 12);
    expect(half.rotation * 2).toBeCloseTo(whole.rotation, 12);
  });

  it('stays off at any frame rate when the params are neutral', () => {
    const neutral = { ...params, feedbackAmount: 0, feedbackZoom: 1, feedbackRotation: 0 };
    for (const deltaTime of [1 / 144, 1 / 60, 1 / 30]) {
      expect(feedbackForFrame(neutral, deltaTime)).toEqual({ amount: 0, zoom: 1, rotation: 0 });
    }
  });
});
