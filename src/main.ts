import './style.css';
import { startAnimationLoop } from './app/animationLoop';
import { Renderer } from './engine/Renderer';
import { StatsDisplay } from './ui/StatsDisplay';

const canvas = getElement<HTMLCanvasElement>('#canvas');
const stats = new StatsDisplay(getElement('#stats'));

try {
  const renderer = new Renderer(canvas);
  startAnimationLoop((time) => {
    renderer.render(time);
    stats.update(canvas.width, canvas.height);
  });
} catch (error) {
  console.error(error);
  showFatalError(error instanceof Error ? error.message : String(error));
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
