import { kaleidoscope } from '../math/kaleidoscope';
import type { Vec2 } from '../math/vec2';
import { clampParam, type Params } from '../state/params';

// Zoom factor e^(−rate·pixels): one ~100 px wheel notch zooms by about 16 %.
const WHEEL_ZOOM_RATE = 0.0015;
// Firefox reports mouse-wheel deltas in lines rather than pixels.
const PIXELS_PER_LINE = 16;

/** The fractal-plane point shown at view point p — the CPU twin of the shader's mapping. */
export function fractalPointAt(params: Params, p: Vec2): Vec2 {
  const [x, y] = kaleidoscope(p, params.symmetrySides, params.symmetryMirror === 1);
  return [x / params.zoom + params.positionX, y / params.zoom + params.positionY];
}

/** Zooms by `factor`, keeping the fractal point under view point p in place. */
export function zoomAt(params: Params, p: Vec2, factor: number): void {
  const anchor = fractalPointAt(params, p);
  params.zoom = clampParam('zoom', params.zoom * factor);
  moveUnder(params, anchor, p);
}

/** Moves the fractal so the point that was under `from` ends up under `to`. */
export function pan(params: Params, from: Vec2, to: Vec2): void {
  moveUnder(params, fractalPointAt(params, from), to);
}

// The position enters the mapping as a plain translation, so a single correction places
// `point` exactly at p (unless the position range clamps it).
function moveUnder(params: Params, point: Vec2, p: Vec2): void {
  const [x, y] = fractalPointAt(params, p);
  params.positionX = clampParam('positionX', params.positionX + point[0] - x);
  params.positionY = clampParam('positionY', params.positionY + point[1] - y);
}

/** Drag to pan and wheel to zoom on the canvas; `onChange` runs after every change. */
export function attachViewNavigation(
  canvas: HTMLCanvasElement,
  params: Params,
  onChange: () => void,
): void {
  let dragPoint: Vec2 | null = null;

  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add('dragging');
    dragPoint = viewPoint(canvas, event);
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!dragPoint) return;
    const point = viewPoint(canvas, event);
    pan(params, dragPoint, point);
    dragPoint = point;
    onChange();
  });

  const endDrag = () => {
    dragPoint = null;
    canvas.classList.remove('dragging');
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  canvas.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      const pixels =
        event.deltaMode === WheelEvent.DOM_DELTA_PIXEL ? event.deltaY : event.deltaY * PIXELS_PER_LINE;
      zoomAt(params, viewPoint(canvas, event), Math.exp(-pixels * WHEEL_ZOOM_RATE));
      onChange();
    },
    { passive: false },
  );
}

// CSS pixels → the shader's centred, aspect-corrected view coordinates (y pointing up).
function viewPoint(canvas: HTMLCanvasElement, event: MouseEvent): Vec2 {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  return [(2 * x - rect.width) / rect.height, (rect.height - 2 * y) / rect.height];
}
