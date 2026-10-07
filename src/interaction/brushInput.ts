import type { Brush } from '../state/brush';
import { BRUSH_OFF, type Params } from '../state/params';
import { viewPoint } from './viewNavigation';

/** With a brush mode chosen, holding the left button applies the brush under the pointer. */
export function attachBrushInput(canvas: HTMLCanvasElement, params: Params, brush: Brush): void {
  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || params.brushMode === BRUSH_OFF) return;
    canvas.setPointerCapture(event.pointerId);
    brush.center = viewPoint(canvas, event);
    brush.pressed = true;
  });

  canvas.addEventListener('pointermove', (event) => {
    canvas.classList.toggle('brushing', params.brushMode !== BRUSH_OFF);
    if (brush.pressed) brush.center = viewPoint(canvas, event);
  });

  const release = () => {
    brush.pressed = false;
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
}
