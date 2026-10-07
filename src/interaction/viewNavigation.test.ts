import { describe, expect, it } from 'vitest';
import type { Vec2 } from '../math/vec2';
import { createAnimation } from '../state/animation';
import { DEFAULT_PARAMS, PARAM_SPECS, type Params } from '../state/params';
import { fractalPointAt, pan, zoomAt } from './viewNavigation';

const plain = (): Params => ({ ...DEFAULT_PARAMS, symmetrySides: 1, warpStrength: 0, warpRotation: 0 });
const kaleidoscopic = (): Params => ({ ...plain(), symmetrySides: 6, symmetryMirror: 1 });
const warped = (): Params => ({ ...kaleidoscopic(), warpStrength: 0.3, warpRotation: 0.8 });

const lenses = [
  ['without lens effects', plain],
  ['with a kaleidoscope', kaleidoscopic],
  ['with kaleidoscope and warp', warped],
] as const;

const animation = { ...createAnimation(), warpPhase: 1.3 };

const expectClose = (actual: Vec2, expected: Vec2) => {
  expect(actual[0]).toBeCloseTo(expected[0], 10);
  expect(actual[1]).toBeCloseTo(expected[1], 10);
};

describe('view navigation', () => {
  it('shows the position at the centre of the view', () => {
    const params = { ...plain(), positionX: 0.3, positionY: -0.2 };
    expectClose(fractalPointAt(params, animation, [0, 0]), [0.3, -0.2]);
  });

  it.each(lenses)('zooms around the cursor %s', (_, makeParams) => {
    const params = makeParams();
    const cursor: Vec2 = [0.6, 0.35];
    const before = fractalPointAt(params, animation, cursor);

    zoomAt(params, animation, cursor, 1.8);

    expect(params.zoom).toBeCloseTo(DEFAULT_PARAMS.zoom * 1.8, 10);
    expectClose(fractalPointAt(params, animation, cursor), before);
  });

  it.each(lenses)('drags the grabbed point along with the cursor %s', (_, makeParams) => {
    const params = makeParams();
    const from: Vec2 = [0.2, 0.1];
    const to: Vec2 = [0.35, 0.05];
    const grabbed = fractalPointAt(params, animation, from);

    pan(params, animation, from, to);

    expectClose(fractalPointAt(params, animation, to), grabbed);
  });

  it('keeps zoom and position inside their ranges', () => {
    const params = plain();
    zoomAt(params, animation, [0.9, 0.9], 1e9);
    expect(params.zoom).toBe(PARAM_SPECS.zoom.max);

    pan(params, animation, [0, 0], [-1e6, 0]);
    expect(params.positionX).toBe(PARAM_SPECS.positionX.max);
  });
});
