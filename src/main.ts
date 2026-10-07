import './style.css';
import { startAnimationLoop } from './app/animationLoop';
import { Renderer } from './engine/Renderer';
import { attachBrushInput } from './interaction/brushInput';
import { attachViewNavigation } from './interaction/viewNavigation';
import { advanceAnimation, createAnimation } from './state/animation';
import { advanceBrush, createBrush } from './state/brush';
import { DEFAULT_PARAMS, resetParams, type Params } from './state/params';
import { applyPreset, PRESETS } from './state/presets';
import { ControlsPanel } from './ui/ControlsPanel';
import { createPresetList } from './ui/presetList';
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
  const animation = createAnimation();
  const brush = createBrush();
  const controls = new ControlsPanel(getElement('#parameters'), params);

  getElement('#presets').append(
    createPresetList(PRESETS, (preset) => {
      applyPreset(params, preset);
      // Restarting the animation phases opens the preset exactly as it was designed.
      Object.assign(animation, createAnimation());
      controls.refresh();
    }),
  );

  attachViewNavigation(canvas, params, animation, brush, () => controls.refresh());
  attachBrushInput(canvas, params, brush);

  getElement('#reset').addEventListener('click', () => {
    resetParams(params);
    controls.refresh();
  });

  startAnimationLoop((deltaTime) => {
    advanceAnimation(animation, params, deltaTime);
    advanceBrush(brush, deltaTime);
    renderer.render(params, animation, brush, deltaTime);
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
