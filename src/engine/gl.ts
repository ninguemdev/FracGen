export function createWebGL2Context(canvas: HTMLCanvasElement): WebGL2RenderingContext {
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false, // every pixel comes from a fullscreen pass; MSAA would only cost memory
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
  });

  if (!gl) {
    throw new Error(
      'WebGL 2 is not available. Enable hardware acceleration in the browser settings ' +
        'or update the GPU drivers.',
    );
  }

  console.info(`[gl] WebGL 2 context created — ${gl.getParameter(gl.VERSION)} · ${gpuName(gl)}`);
  return gl;
}

// Chromium masks RENDERER as "WebKit WebGL" and needs the debug extension for the real name;
// Firefox already reports it in RENDERER and warns when the deprecated extension is requested.
function gpuName(gl: WebGL2RenderingContext): string {
  const renderer: string = gl.getParameter(gl.RENDERER);
  if (renderer !== 'WebKit WebGL') return renderer;
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  return debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : renderer;
}

/** Compiles and links a program. `name` identifies the shader files in error messages. */
export function createProgram(
  gl: WebGL2RenderingContext,
  name: string,
  vertexSource: string,
  fragmentSource: string,
): WebGLProgram {
  const program = gl.createProgram();
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  // Compile status is only queried after a failed link: querying it eagerly forces
  // a synchronous wait and defeats the driver's parallel shader compilation.
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message =
      compileError(gl, vertexShader, `${name} vertex shader`) ??
      compileError(gl, fragmentShader, `${name} fragment shader`) ??
      `[gl] Program "${name}" failed to link:\n${gl.getProgramInfoLog(program)}`;
    throw new Error(message);
  }

  // The linked program keeps its own copy; the shader objects are no longer needed.
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  console.info(`[gl] Program "${name}" compiled and linked`);
  return program;
}

function createShader(gl: WebGL2RenderingContext, type: GLenum, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('[gl] Could not create a shader object (is the WebGL context lost?)');
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

/** Driver log line numbers match the .vert/.frag files because sources are passed unmodified. */
function compileError(gl: WebGL2RenderingContext, shader: WebGLShader, label: string): string | null {
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return null;
  return `[gl] ${label} failed to compile:\n${gl.getShaderInfoLog(shader)}`;
}
