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
}

export const PARAM_SPECS: Record<ParamKey, ParamSpec> = {
  iterations: { label: 'Iterations', min: 32, max: 256, step: 1 },
  juliaX: { label: 'Julia X', min: -1.5, max: 1.5, step: 0.001 },
  juliaY: { label: 'Julia Y', min: -1.5, max: 1.5, step: 0.001 },
  zoom: { label: 'Zoom', min: 0.2, max: 20, step: 0.01, logarithmic: true },
  positionX: { label: 'Position X', min: -1.5, max: 1.5, step: 0.001 },
  positionY: { label: 'Position Y', min: -1.5, max: 1.5, step: 0.001 },
};

export const DEFAULT_PARAMS: Readonly<Params> = {
  iterations: 128,
  // c = -0.8 + 0.156i sits just outside the main cardioid: a connected set of spiral dendrites.
  juliaX: -0.8,
  juliaY: 0.156,
  zoom: 0.8,
  positionX: 0,
  positionY: 0,
};
