import { PALETTES } from './palettes';

/**
 * Every user-controllable value lives in this single flat object. Presets, URL state and
 * mutation will all operate on it, so new parameters are added here first.
 */
export interface Params {
  iterations: number;
  juliaX: number;
  juliaY: number;
  zoom: number;
  positionX: number;
  positionY: number;

  /** Number of angular sectors; 1 means no symmetry. */
  symmetrySides: number;
  /** 1 reflects every sector about its centre line (kaleidoscope); 0 only repeats it. */
  symmetryMirror: number;

  /** Displacement of the first warp octave, in view units. */
  warpStrength: number;
  /** Spatial frequency of the first warp octave. */
  warpFrequency: number;
  warpOctaves: number;
  /** Amplitude of the rotational warp, in radians. */
  warpRotation: number;
  /** Warp animation speed, in radians per second. */
  warpSpeed: number;

  /** Horizon radius of the black hole at the centre of the view, in view units; 0 turns it off. */
  blackHoleSize: number;
  /** −1…1, like Kerr's a/M: drags the sky around the hole and sets it orbiting. */
  blackHoleSpin: number;
  /** Brightness of the photon ring around the horizon. */
  blackHoleGlow: number;

  // Feedback values are per frame at 60 fps; they get scaled to the real frame time.
  /** Share of the previous frame blended under each new one; 0 turns feedback off. */
  feedbackAmount: number;
  /** Magnification of the previous frame: above 1 the image flows outward, below 1 inward. */
  feedbackZoom: number;
  /** Rotation of the previous frame, in radians. */
  feedbackRotation: number;

  /** Index into PALETTES. */
  palette: number;
  /** Palette cycles per escape iteration. */
  colorFrequency: number;
  /** Palette offset, in cycles. */
  colorPhase: number;
  /** Palette cycles per second. */
  colorCycle: number;
  saturation: number;
  brightness: number;
  contrast: number;

  /** What the left mouse button does on the canvas; BRUSH_OFF pans the view instead. */
  brushMode: number;
  /** Size of the brush: standard deviation of its Gaussian falloff, in view units. */
  brushRadius: number;
  /** 0–1; each brush mode scales it to its own useful range. */
  brushStrength: number;
}

/** brushMode value with no brush: the left mouse button pans. */
export const BRUSH_OFF = 0;

export type ParamKey = keyof Params;

export interface ParamSpec {
  label: string;
  min: number;
  max: number;
  /** Slider increment and display precision. */
  step: number;
  /** Equal slider distances multiply the value by equal factors (for ranges spanning decades). */
  logarithmic?: boolean;
  /** Discrete choice: the value is an index into these labels. */
  options?: readonly string[];
}

export const PARAM_SPECS: Record<ParamKey, ParamSpec> = {
  // Deep zooms need the high end; the cost per pixel grows linearly with it.
  iterations: { label: 'Iterations', min: 32, max: 1024, step: 1 },
  juliaX: { label: 'Julia X', min: -1.5, max: 1.5, step: 0.001 },
  juliaY: { label: 'Julia Y', min: -1.5, max: 1.5, step: 0.001 },
  // Beyond ~2000 the shader's float32 coordinates start to show as blocky pixels.
  zoom: { label: 'Zoom', min: 0.2, max: 2000, step: 0.01, logarithmic: true },
  positionX: { label: 'Position X', min: -1.5, max: 1.5, step: 0.0001 },
  positionY: { label: 'Position Y', min: -1.5, max: 1.5, step: 0.0001 },

  // Whole numbers only: a fractional sector count leaves a seam where the sectors don't close.
  symmetrySides: { label: 'Sides', min: 1, max: 16, step: 1 },
  symmetryMirror: { label: 'Mirror', min: 0, max: 1, step: 1, options: ['Off', 'On'] },

  warpStrength: { label: 'Strength', min: 0, max: 1.5, step: 0.001 },
  warpFrequency: { label: 'Frequency', min: 0.1, max: 12, step: 0.01, logarithmic: true },
  warpOctaves: { label: 'Octaves', min: 1, max: 5, step: 1 },
  warpRotation: { label: 'Rotation', min: -3, max: 3, step: 0.01 },
  warpSpeed: { label: 'Animation', min: -3, max: 3, step: 0.01 },

  blackHoleSize: { label: 'Size', min: 0, max: 0.6, step: 0.005 },
  blackHoleSpin: { label: 'Spin', min: -1, max: 1, step: 0.01 },
  blackHoleGlow: { label: 'Glow', min: 0, max: 2, step: 0.01 },

  feedbackAmount: { label: 'Amount', min: 0, max: 0.99, step: 0.01 },
  feedbackZoom: { label: 'Zoom', min: 0.96, max: 1.04, step: 0.001 },
  feedbackRotation: { label: 'Rotation', min: -0.03, max: 0.03, step: 0.0005 },

  palette: {
    label: 'Palette',
    min: 0,
    max: PALETTES.length - 1,
    step: 1,
    options: PALETTES.map((palette) => palette.name),
  },
  colorFrequency: { label: 'Frequency', min: 0.005, max: 0.5, step: 0.001, logarithmic: true },
  colorPhase: { label: 'Phase', min: 0, max: 1, step: 0.001 },
  colorCycle: { label: 'Color Cycle', min: -0.5, max: 0.5, step: 0.005 },
  saturation: { label: 'Saturation', min: 0, max: 2, step: 0.01 },
  brightness: { label: 'Brightness', min: 0, max: 2, step: 0.01 },
  contrast: { label: 'Contrast', min: 0, max: 2, step: 0.01 },

  brushMode: { label: 'Brush', min: 0, max: 3, step: 1, options: ['Off', 'Attract', 'Repel', 'Twist'] },
  brushRadius: { label: 'Radius', min: 0.03, max: 1, step: 0.01, logarithmic: true },
  brushStrength: { label: 'Strength', min: 0, max: 1, step: 0.01 },
};

export const DEFAULT_PARAMS: Readonly<Params> = {
  iterations: 128,
  // c = -0.8 + 0.156i sits just outside the main cardioid: a connected set of spiral dendrites.
  juliaX: -0.8,
  juliaY: 0.156,
  zoom: 0.8,
  positionX: 0,
  positionY: 0,

  symmetrySides: 1,
  symmetryMirror: 1,

  warpStrength: 0,
  warpFrequency: 3,
  warpOctaves: 3,
  warpRotation: 0,
  warpSpeed: 0.5,

  // Off by default; spin and glow are set so that raising Size alone already shows a live hole.
  blackHoleSize: 0,
  blackHoleSpin: 0.5,
  blackHoleGlow: 1,

  // Off by default; zoom and rotation are set so that raising Amount alone already spirals.
  feedbackAmount: 0,
  feedbackZoom: 1.01,
  feedbackRotation: 0.005,

  palette: 0,
  colorFrequency: 0.04,
  colorPhase: 0.38,
  colorCycle: 0.03,
  saturation: 1,
  brightness: 1,
  contrast: 1,

  brushMode: BRUSH_OFF,
  brushRadius: 0.2,
  brushStrength: 0.6,
};

export const PARAM_KEYS = Object.keys(PARAM_SPECS) as ParamKey[];

/** Puts the given parameters, or all of them, back to their defaults. */
export function resetParams(params: Params, keys: readonly ParamKey[] = PARAM_KEYS): void {
  for (const key of keys) params[key] = DEFAULT_PARAMS[key];
}

/** Limits a value to the parameter's range, for changes that don't come from its slider. */
export function clampParam(key: ParamKey, value: number): number {
  const { min, max } = PARAM_SPECS[key];
  return Math.min(max, Math.max(min, value));
}
