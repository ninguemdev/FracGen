import { createProgram, createWebGL2Context, getUniformLocations } from './gl';
import { PingPongBuffers, type RenderTarget } from './PingPongBuffers';
import { feedbackForFrame, type Animation } from '../state/animation';
import { PALETTES } from '../state/palettes';
import type { Params } from '../state/params';
import vertexSource from '../shaders/fullscreen.vert?raw';
import fragmentSource from '../shaders/fractal.frag?raw';

// Above 2× the extra pixels are barely visible but multiply the per-pixel fractal cost.
const MAX_PIXEL_RATIO = 2;

const UNIFORM_NAMES = [
  'uResolution',
  'uZoom',
  'uCenter',
  'uJuliaC',
  'uIterations',
  'uSymmetrySides',
  'uSymmetryMirror',
  'uWarpStrength',
  'uWarpFrequency',
  'uWarpOctaves',
  'uWarpRotation',
  'uWarpPhase',
  'uPalette',
  'uColorFrequency',
  'uColorOffset',
  'uContrast',
  'uSaturation',
  'uBrightness',
  'uPreviousFrame',
  'uFeedbackAmount',
  'uFeedbackZoom',
  'uFeedbackRotation',
  'uFrame',
] as const;

type UniformName = (typeof UNIFORM_NAMES)[number];

/**
 * Draws the fractal shader over the whole canvas, keeping the drawing buffer at display size.
 * With feedback on, it draws into one of the feedback buffers, blending in the previous
 * frame, and then copies the result to the canvas.
 */
export class Renderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;
  private readonly uniforms: Record<UniformName, WebGLUniformLocation | null>;
  private readonly feedback: PingPongBuffers;
  private frameCount = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.gl = createWebGL2Context(canvas);
    this.program = createProgram(this.gl, 'fractal', vertexSource, fragmentSource);
    this.uniforms = getUniformLocations(this.gl, this.program, UNIFORM_NAMES);
    this.feedback = new PingPongBuffers(this.gl, canvas.width, canvas.height);

    canvas.addEventListener('webglcontextlost', () => {
      console.warn('[gl] WebGL context lost (GPU reset or driver issue). Reload the page.');
    });
  }

  /** `deltaTime` is the length of this frame in seconds; feedback is scaled to it. */
  render(params: Params, animation: Animation, deltaTime: number): void {
    const { gl, feedback } = this;
    this.resizeToDisplaySize();

    // Without feedback the previous frame isn't needed: drawing straight to the canvas saves
    // the buffers' memory traffic, which costs ~20 % at 2× resolution on integrated GPUs.
    const feedbackOn = params.feedbackAmount > 0;
    gl.bindFramebuffer(gl.FRAMEBUFFER, feedbackOn ? feedback.next.framebuffer : null);
    gl.useProgram(this.program);
    this.setFractalUniforms(params, animation);
    this.setFeedbackUniforms(params, deltaTime);

    // Three vertices generated in the vertex shader from gl_VertexID; no buffers needed.
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (feedbackOn) {
      this.present(feedback.next);
      feedback.swap();
    } else {
      feedback.discardHistory();
    }
  }

  private setFractalUniforms(params: Params, animation: Animation): void {
    const { gl, canvas, uniforms } = this;
    gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height);
    gl.uniform1f(uniforms.uZoom, params.zoom);
    gl.uniform2f(uniforms.uCenter, params.positionX, params.positionY);
    gl.uniform2f(uniforms.uJuliaC, params.juliaX, params.juliaY);
    gl.uniform1i(uniforms.uIterations, params.iterations);

    gl.uniform1f(uniforms.uSymmetrySides, params.symmetrySides);
    gl.uniform1i(uniforms.uSymmetryMirror, params.symmetryMirror);

    gl.uniform1f(uniforms.uWarpStrength, params.warpStrength);
    gl.uniform1f(uniforms.uWarpFrequency, params.warpFrequency);
    gl.uniform1i(uniforms.uWarpOctaves, params.warpOctaves);
    gl.uniform1f(uniforms.uWarpRotation, params.warpRotation);
    gl.uniform1f(uniforms.uWarpPhase, animation.warpPhase);

    gl.uniform3fv(uniforms.uPalette, PALETTES[params.palette].coefficients);
    gl.uniform1f(uniforms.uColorFrequency, params.colorFrequency);
    gl.uniform1f(uniforms.uColorOffset, params.colorPhase + animation.colorCycleOffset);
    gl.uniform1f(uniforms.uContrast, params.contrast);
    gl.uniform1f(uniforms.uSaturation, params.saturation);
    gl.uniform1f(uniforms.uBrightness, params.brightness);
  }

  private setFeedbackUniforms(params: Params, deltaTime: number): void {
    const { gl, uniforms, feedback } = this;
    const frame = feedbackForFrame(params, deltaTime);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, feedback.previous.texture);
    gl.uniform1i(uniforms.uPreviousFrame, 0);
    // Until the buffers hold the frame just shown (startup, resize, feedback just turned on),
    // the new frame is drawn alone; it becomes the history for the next one.
    gl.uniform1f(uniforms.uFeedbackAmount, feedback.hasHistory ? frame.amount : 0);
    gl.uniform1f(uniforms.uFeedbackZoom, frame.zoom);
    gl.uniform1f(uniforms.uFeedbackRotation, frame.rotation);
    gl.uniform1ui(uniforms.uFrame, this.frameCount++);
  }

  // Same size on both sides, so the blit is a plain copy (converting half floats to 8 bits).
  private present(target: RenderTarget): void {
    const { gl } = this;
    const { width, height } = this.canvas;
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, target.framebuffer);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.blitFramebuffer(0, 0, width, height, 0, 0, width, height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
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
    this.feedback.resize(width, height);
  }
}
