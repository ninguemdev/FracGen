import { createProgram, createWebGL2Context, getUniformLocations } from './gl';
import type { Params } from '../state/params';
import vertexSource from '../shaders/fullscreen.vert?raw';
import fragmentSource from '../shaders/fractal.frag?raw';

// Above 2× the extra pixels are barely visible but multiply the per-pixel fractal cost.
const MAX_PIXEL_RATIO = 2;

const UNIFORM_NAMES = [
  'uResolution',
  'uTime',
  'uZoom',
  'uCenter',
  'uJuliaC',
  'uIterations',
] as const;

type UniformName = (typeof UNIFORM_NAMES)[number];

/** Draws the fractal shader over the whole canvas, keeping the drawing buffer at display size. */
export class Renderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;
  private readonly uniforms: Record<UniformName, WebGLUniformLocation | null>;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.gl = createWebGL2Context(canvas);
    this.program = createProgram(this.gl, 'fractal', vertexSource, fragmentSource);
    this.uniforms = getUniformLocations(this.gl, this.program, UNIFORM_NAMES);

    canvas.addEventListener('webglcontextlost', () => {
      console.warn('[gl] WebGL context lost (GPU reset or driver issue). Reload the page.');
    });
  }

  /** @param time seconds since the animation started */
  render(time: number, params: Params): void {
    const { gl, canvas, uniforms } = this;
    this.resizeToDisplaySize();

    gl.useProgram(this.program);
    gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height);
    gl.uniform1f(uniforms.uTime, time);
    gl.uniform1f(uniforms.uZoom, params.zoom);
    gl.uniform2f(uniforms.uCenter, params.positionX, params.positionY);
    gl.uniform2f(uniforms.uJuliaC, params.juliaX, params.juliaY);
    gl.uniform1i(uniforms.uIterations, params.iterations);

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
