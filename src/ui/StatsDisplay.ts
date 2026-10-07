const REFRESH_INTERVAL_MS = 500;

/** Debug readout of frames per second and drawing-buffer resolution. */
export class StatsDisplay {
  private readonly element: HTMLElement;
  private frameCount = 0;
  private intervalStart = performance.now();

  constructor(element: HTMLElement) {
    this.element = element;
  }

  /** Call once per rendered frame. */
  update(width: number, height: number): void {
    this.frameCount++;
    const now = performance.now();
    const elapsed = now - this.intervalStart;
    if (elapsed < REFRESH_INTERVAL_MS) return;

    const fps = Math.round((this.frameCount * 1000) / elapsed);
    this.element.textContent = `${fps} fps · ${width}×${height}`;
    this.frameCount = 0;
    this.intervalStart = now;
  }
}
