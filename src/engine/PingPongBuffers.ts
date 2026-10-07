/** A texture with a framebuffer attached, so it can be rendered into and sampled afterwards. */
export interface RenderTarget {
  readonly texture: WebGLTexture;
  readonly framebuffer: WebGLFramebuffer;
}

interface TextureFormat {
  name: string;
  internalFormat: GLenum;
  type: GLenum;
}

/**
 * Two same-sized render targets that trade roles every frame: the previous frame is sampled
 * from one while the next is rendered into the other (WebGL can't read a texture it is
 * writing to). This memory is what temporal feedback blends with.
 */
export class PingPongBuffers {
  private readonly gl: WebGL2RenderingContext;
  private readonly format: TextureFormat;
  private readonly targets: [RenderTarget, RenderTarget];
  private width: number;
  private height: number;
  private history = false;

  constructor(gl: WebGL2RenderingContext, width: number, height: number) {
    this.gl = gl;
    this.format = chooseFormat(gl);
    this.width = width;
    this.height = height;
    this.targets = [this.createTarget(), this.createTarget()];
    console.info(`[gl] Feedback framebuffers complete (2 × ${this.format.name})`);
  }

  get previous(): RenderTarget {
    return this.targets[0];
  }

  get next(): RenderTarget {
    return this.targets[1];
  }

  /** Whether `previous` holds the frame just shown (not after startup, a resize or a bypass). */
  get hasHistory(): boolean {
    return this.history;
  }

  /** Call after rendering into `next`: it becomes `previous` for the following frame. */
  swap(): void {
    this.targets.reverse();
    this.history = true;
  }

  /** Call when a frame was shown without going through the buffers. */
  discardHistory(): void {
    this.history = false;
  }

  /** Reallocates both textures, discarding their contents, when the size changes. */
  resize(width: number, height: number): void {
    if (width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;
    for (const target of this.targets) this.allocate(target);
    this.history = false;
  }

  private createTarget(): RenderTarget {
    const { gl } = this;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Feedback samples between texels whenever it zooms or rotates.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // Zooming out or rotating looks past the edges; mirroring continues the image without
    // a seam, where clamping would smear the border pixels into streaks.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);

    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    const target = { texture, framebuffer };
    this.allocate(target);
    return target;
  }

  // Re-specifying the texture keeps it attached to its framebuffer; WebGL fills it with zeros.
  private allocate(target: RenderTarget): void {
    const { gl, format, width, height } = this;
    gl.bindTexture(gl.TEXTURE_2D, target.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, format.internalFormat, width, height, 0, gl.RGBA, format.type, null);

    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      const code = `0x${status.toString(16)}`;
      throw new Error(`[gl] Feedback framebuffer incomplete (${format.name}, status ${code})`);
    }
  }
}

// Strong feedback changes a pixel by tiny amounts per frame, which 8 bits per channel can't
// hold: old images would never finish fading. Half floats keep 11 significant bits, and the
// shader rounds to them stochastically so even the smallest changes add up.
function chooseFormat(gl: WebGL2RenderingContext): TextureFormat {
  if (gl.getExtension('EXT_color_buffer_float')) {
    return { name: 'RGBA16F', internalFormat: gl.RGBA16F, type: gl.HALF_FLOAT };
  }
  console.warn('[gl] EXT_color_buffer_float unavailable: 8-bit feedback, trails may not fully fade');
  return { name: 'RGBA8', internalFormat: gl.RGBA8, type: gl.UNSIGNED_BYTE };
}
