import { describe, expect, it } from 'vitest';
import type { Vec2 } from '../math/vec2';
import { createAnimation } from '../state/animation';
import { createBrush, type Brush } from '../state/brush';
import { DEFAULT_PARAMS, PARAM_SPECS, type Params } from '../state/params';
import { fractalPointAt, pan, zoomAt } from './viewNavigation';

const plain = (): Params => ({ ...DEFAULT_PARAMS, symmetrySides: 1, warpStrength: 0, warpRotation: 0 });
const kaleidoscopic = (): Params => ({ ...plain(), symmetrySides: 6, symmetryMirror: 1 });
const warped = (): Params => ({ ...kaleidoscopic(), warpStrength: 0.3, warpRotation: 0.8 });
const twisted = (): Params => ({ ...warped(), brushMode: 3, brushRadius: 0.3, brushStrength: 0.8 });
const swallowed = (): Params => ({ ...twisted(), blackHoleSize: 0.15, blackHoleSpin: 0.7 });

const noBrush = createBrush();
// Still fading out after a release, so it acts away from the cursor as well.
const fadingBrush: Brush = { center: [0.5, 0.3], pressed: false, intensity: 0.7 };

const lenses = [
  ['without lens effects', plain, noBrush],
  ['with a kaleidoscope', kaleidoscopic, noBrush],
  ['with kaleidoscope and warp', warped, noBrush],
  ['with kaleidoscope, warp and brush', twisted, fadingBrush],
  ['with black hole, kaleidoscope, warp and brush', swallowed, fadingBrush],
] as const;

const animation = { ...createAnimation(), warpPhase: 1.3, blackHolePhase: 0.6 };

const expectClose = (actual: Vec2, expected: Vec2) => {
  expect(actual[0]).toBeCloseTo(expected[0], 10);
  expect(actual[1]).toBeCloseTo(expected[1], 10);
};

describe('view navigation', () => {
  it('shows the position at the centre of the view', () => {
    const params = { ...plain(), positionX: 0.3, positionY: -0.2 };
    expectClose(fractalPointAt(params, animation, noBrush, [0, 0]), [0.3, -0.2]);
  });

  it('includes the brush in the mapping', () => {
    const near: Vec2 = [0.6, 0.35];
    const [x, y] = fractalPointAt(twisted(), animation, fadingBrush, near);
    const [x0, y0] = fractalPointAt(twisted(), animation, noBrush, near);
    expect(Math.hypot(x - x0, y - y0)).toBeGreaterThan(0.01);
  });

  it.each(lenses)('zooms around the cursor %s', (_, makeParams, brush) => {
    const params = makeParams();
    const cursor: Vec2 = [0.6, 0.35];
    const before = fractalPointAt(params, animation, brush, cursor);

    zoomAt(params, animation, brush, cursor, 1.8);

    expect(params.zoom).toBeCloseTo(DEFAULT_PARAMS.zoom * 1.8, 10);
    expectClose(fractalPointAt(params, animation, brush, cursor), before);
  });

  it.each(lenses)('drags the grabbed point along with the cursor %s', (_, makeParams, brush) => {
    const params = makeParams();
    const from: Vec2 = [0.2, 0.1];
    const to: Vec2 = [0.35, 0.05];
    const grabbed = fractalPointAt(params, animation, brush, from);

    pan(params, animation, brush, from, to);

    expectClose(fractalPointAt(params, animation, brush, to), grabbed);
  });

  it('keeps zoom and position inside their ranges', () => {
    const params = plain();
    zoomAt(params, animation, noBrush, [0.9, 0.9], 1e9);
    expect(params.zoom).toBe(PARAM_SPECS.zoom.max);

    pan(params, animation, noBrush, [0, 0], [-1e6, 0]);
    expect(params.positionX).toBe(PARAM_SPECS.positionX.max);
  });
});
