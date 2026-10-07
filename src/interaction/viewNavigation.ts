import { blackHoleLens } from '../math/blackHole';
import { brushForce } from '../math/brushForce';
import { kaleidoscope } from '../math/kaleidoscope';
import type { Vec2 } from '../math/vec2';
import { domainWarp } from '../math/warp';
import type { Animation } from '../state/animation';
import type { Brush } from '../state/brush';
import { BRUSH_OFF, clampParam, type Params } from '../state/params';

// Zoom factor e^(−rate·pixels): one ~100 px wheel notch zooms by about 16 %.
const WHEEL_ZOOM_RATE = 0.0015;
// Firefox reports mouse-wheel deltas in lines rather than pixels.
const PIXELS_PER_LINE = 16;

/** The fractal-plane point shown at view point p — the CPU twin of the shader's mapping. */
export function fractalPointAt(params: Params, animation: Animation, brush: Brush, p: Vec2): Vec2 {
  const hole = {
    size: params.blackHoleSize,
    spin: params.blackHoleSpin,
    phase: animation.blackHolePhase,
  };
  const mirrored = params.symmetryMirror === 1;
  // The stages ahead of the brush, which its position goes through as well.
  const lensBeforeBrush = (q: Vec2) =>
    kaleidoscope(blackHoleLens(q, hole), params.symmetrySides, mirrored);

  const brushed = brushForce(lensBeforeBrush(p), {
    mode: params.brushMode,
    center: lensBeforeBrush(brush.center),
    radius: params.brushRadius,
    strength: params.brushStrength * brush.intensity,
  });
  const [x, y] = domainWarp(brushed, {
    strength: params.warpStrength,
    frequency: params.warpFrequency,
    octaves: params.warpOctaves,
    rotation: params.warpRotation,
    phase: animation.warpPhase,
  });
  return [x / params.zoom + params.positionX, y / params.zoom + params.positionY];
}

/** Zooms by `factor`, keeping the fractal point under view point p in place. */
export function zoomAt(params: Params, animation: Animation, brush: Brush, p: Vec2, factor: number): void {
  const anchor = fractalPointAt(params, animation, brush, p);
  params.zoom = clampParam('zoom', params.zoom * factor);
  moveUnder(params, animation, brush, anchor, p);
}

/** Moves the fractal so the point that was under `from` ends up under `to`. */
export function pan(params: Params, animation: Animation, brush: Brush, from: Vec2, to: Vec2): void {
  moveUnder(params, animation, brush, fractalPointAt(params, animation, brush, from), to);
}

// The position enters the mapping as a plain translation, so a single correction places
// `point` exactly at p (unless the position range clamps it).
function moveUnder(params: Params, animation: Animation, brush: Brush, point: Vec2, p: Vec2): void {
  const [x, y] = fractalPointAt(params, animation, brush, p);
  params.positionX = clampParam('positionX', params.positionX + point[0] - x);
  params.positionY = clampParam('positionY', params.positionY + point[1] - y);
}

/**
 * Drag to pan and wheel to zoom on the canvas; `onChange` runs after every change. The right
 * button always pans, the left one only while no brush is chosen.
 */
export function attachViewNavigation(
  canvas: HTMLCanvasElement,
  params: Params,
  animation: Animation,
  brush: Brush,
  onChange: () => void,
): void {
  let dragPoint: Vec2 | null = null;

  canvas.addEventListener('pointerdown', (event) => {
    const pans = event.button === 2 || (event.button === 0 && params.brushMode === BRUSH_OFF);
    if (!pans) return;
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add('dragging');
    dragPoint = viewPoint(canvas, event);
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!dragPoint) return;
    const point = viewPoint(canvas, event);
    pan(params, animation, brush, dragPoint, point);
    dragPoint = point;
    onChange();
  });

  const endDrag = () => {
    dragPoint = null;
    canvas.classList.remove('dragging');
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  // The right button drags instead of opening the browser's menu.
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  canvas.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      const pixels =
        event.deltaMode === WheelEvent.DOM_DELTA_PIXEL ? event.deltaY : event.deltaY * PIXELS_PER_LINE;
      zoomAt(params, animation, brush, viewPoint(canvas, event), Math.exp(-pixels * WHEEL_ZOOM_RATE));
      onChange();
    },
    { passive: false },
  );
}

/** CSS pixels → the shader's centred, aspect-corrected view coordinates (y pointing up). */
export function viewPoint(canvas: HTMLCanvasElement, event: MouseEvent): Vec2 {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  return [(2 * x - rect.width) / rect.height, (rect.height - 2 * y) / rect.height];
}
