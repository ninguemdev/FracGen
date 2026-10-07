import { createProgram, createWebGL2Context } from './gl';
import vertexSource from '../shaders/fullscreen.vert?raw';
import fragmentSource from '../shaders/pattern.frag?raw';

// Above 2× the extra pixels are barely visible but multiply the per-pixel fractal cost.
const MAX_PIXEL_RATIO = 2;

/** Draws the fragment shader over the whole canvas, keeping the drawing buffer at display size. */
export class Renderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;
  private readonly resolutionLocation: WebGLUniformLocation | null;
  private readonly timeLocation: WebGLUniformLocation | null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.gl = createWebGL2Context(canvas);
    this.program = createProgram(this.gl, 'pattern', vertexSource, fragmentSource);
    this.resolutionLocation = this.gl.getUniformLocation(this.program, 'uResolution');
    this.timeLocation = this.gl.getUniformLocation(this.program, 'uTime');

    canvas.addEventListener('webglcontextlost', () => {
      console.warn('[gl] WebGL context lost (GPU reset or driver issue). Reload the page.');
    });
  }

  /** @param time seconds since the animation started */
  render(time: number): void {
    const { gl, canvas } = this;
    this.resizeToDisplaySize();

    gl.useProgram(this.program);
    gl.uniform2f(this.resolutionLocation, canvas.width, canvas.height);
    gl.uniform1f(this.timeLocation, time);

    // Three vertices generated in the vertex shader from gl_VertexID; no buffers needed.
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  // Checked every frame (cheap) instead of on resize events, so it also catches
  // devicePixelRatio changes, e.g. when the window moves to another monitor.
  private resizeToDisplaySize(): void {
    const { canvas } = this;
    const pixelRatio = Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO);
    const width = Math.max(1, Math.round(canvas.clientWidth * pixelRatio));
    const height = Math.max(1, Math.round(canvas.clientHeight * pixelRatio));
    if (canvas.width === width && canvas.height === height) return;

    canvas.width = width;
    canvas.height = height;
    this.gl.viewport(0, 0, width, height);
  }
}
