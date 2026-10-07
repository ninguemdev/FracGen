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
}

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
  iterations: { label: 'Iterations', min: 32, max: 256, step: 1 },
  juliaX: { label: 'Julia X', min: -1.5, max: 1.5, step: 0.001 },
  juliaY: { label: 'Julia Y', min: -1.5, max: 1.5, step: 0.001 },
  zoom: { label: 'Zoom', min: 0.2, max: 20, step: 0.01, logarithmic: true },
  positionX: { label: 'Position X', min: -1.5, max: 1.5, step: 0.001 },
  positionY: { label: 'Position Y', min: -1.5, max: 1.5, step: 0.001 },

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
};

export const DEFAULT_PARAMS: Readonly<Params> = {
  iterations: 128,
  // c = -0.8 + 0.156i sits just outside the main cardioid: a connected set of spiral dendrites.
  juliaX: -0.8,
  juliaY: 0.156,
  zoom: 0.8,
  positionX: 0,
  positionY: 0,

  palette: 0,
  colorFrequency: 0.04,
  colorPhase: 0.38,
  colorCycle: 0.03,
  saturation: 1,
  brightness: 1,
  contrast: 1,
};
