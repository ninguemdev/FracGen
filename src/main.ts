import './style.css';
import { startAnimationLoop } from './app/animationLoop';
import { Renderer } from './engine/Renderer';
import { attachViewNavigation } from './interaction/viewNavigation';
import { DEFAULT_PARAMS, type Params } from './state/params';
import { ControlsPanel } from './ui/ControlsPanel';
import { StatsDisplay } from './ui/StatsDisplay';

try {
  start();
} catch (error) {
  console.error(error);
  showFatalError(error instanceof Error ? error.message : String(error));
}

function start(): void {
  const canvas = getElement<HTMLCanvasElement>('#canvas');
  const renderer = new Renderer(canvas);
  const stats = new StatsDisplay(getElement('#stats'));

  const params: Params = { ...DEFAULT_PARAMS };
  const controls = new ControlsPanel(getElement('#controls'), params);

  attachViewNavigation(canvas, params, () => controls.refresh());

  getElement('#reset').addEventListener('click', () => {
    Object.assign(params, DEFAULT_PARAMS);
    controls.refresh();
  });

  // Integrated frame by frame rather than computed as speed × elapsed time,
  // so changing the Color Cycle speed never makes the palette jump.
  let colorCycleOffset = 0;

  startAnimationLoop((deltaTime) => {
    colorCycleOffset += params.colorCycle * deltaTime;
    renderer.render(params, colorCycleOffset);
    stats.update(canvas.width, canvas.height);
  });
}

function showFatalError(message: string): void {
  const element = getElement('#fatal-error');
  element.textContent = message;
  element.hidden = false;
}

function getElement<T extends HTMLElement = HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Element "${selector}" not found in index.html`);
  return element;
}
