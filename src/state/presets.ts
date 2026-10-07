import { PARAM_KEYS, resetParams, type ParamKey, type Params } from './params';

// The brush is a tool, not part of the look: presets leave it as the user set it.
type ToolKey = 'brushMode' | 'brushRadius' | 'brushStrength';
const TOOL_KEYS: readonly ParamKey[] = ['brushMode', 'brushRadius', 'brushStrength'];
const LOOK_KEYS = PARAM_KEYS.filter((key) => !TOOL_KEYS.includes(key));

/** A starting point for exploration: the look it sets; anything left out takes its default. */
export interface Preset {
  name: string;
  params: Partial<Omit<Params, ToolKey>>;
}

/** Sets the preset's look, with defaults for whatever it leaves out, keeping the brush. */
export function applyPreset(params: Params, preset: Preset): void {
  resetParams(params, LOOK_KEYS);
  Object.assign(params, preset.params);
}

// Palette indices (see palettes.ts).
const ELECTRIC = 0;
const SPECTRUM = 1;
const CORAL = 2;
const EMBER = 3;
const LAGOON = 4;
const ACID = 5;
const DUSK = 6;

// The first four follow FRACTAL_MATH_ENGINE.md §35–§38, adapted to the parameters that exist.
export const PRESETS: readonly Preset[] = [
  {
    name: 'Breathing Labyrinth',
    params: {
      iterations: 120,
      juliaX: -0.835,
      juliaY: -0.2321,
      zoom: 1.1,
      symmetrySides: 6,
      warpStrength: 0.12,
      warpFrequency: 3.1,
      warpOctaves: 3,
      warpSpeed: 0.25,
      feedbackAmount: 0.8,
      feedbackZoom: 0.997,
      feedbackRotation: 0.002,
      palette: LAGOON,
      colorPhase: 0.85,
    },
  },
  {
    name: 'Infinite Tunnel',
    params: {
      iterations: 96,
      juliaX: -0.75,
      juliaY: 0.11,
      symmetrySides: 8,
      warpStrength: 0.12,
      warpFrequency: 5,
      warpSpeed: 0.4,
      feedbackAmount: 0.95,
      feedbackZoom: 0.985,
      feedbackRotation: 0.006,
      palette: ELECTRIC,
      colorFrequency: 0.08,
    },
  },
  {
    name: 'Organic Melt',
    params: {
      juliaX: 0.285,
      juliaY: 0.01,
      symmetrySides: 3,
      warpStrength: 0.45,
      warpFrequency: 1.7,
      warpOctaves: 4,
      feedbackAmount: 0.88,
      feedbackZoom: 0.999,
      feedbackRotation: 0.001,
      palette: CORAL,
    },
  },
  {
    name: 'Recursive Eyes',
    params: {
      iterations: 150,
      juliaX: -1.3,
      juliaY: 0,
      symmetrySides: 12,
      warpStrength: 0.08,
      feedbackAmount: 0.7,
      feedbackZoom: 0.995,
      feedbackRotation: 0,
      palette: SPECTRUM,
      colorFrequency: 0.1,
    },
  },
  {
    name: 'Electric Coral',
    params: {
      juliaX: -0.162,
      juliaY: 1.04,
      warpStrength: 0.05,
      palette: CORAL,
      colorFrequency: 0.12,
    },
  },
  {
    name: 'Kaleidoscope Melt',
    params: {
      juliaX: -0.7269,
      juliaY: 0.1889,
      symmetrySides: 8,
      warpStrength: 0.45,
      warpFrequency: 2,
      warpOctaves: 4,
      warpRotation: 1.2,
      warpSpeed: 0.6,
      palette: ACID,
    },
  },
  {
    name: 'Spiral Cathedral',
    params: {
      juliaX: -0.75,
      juliaY: 0.11,
      zoom: 1.5,
      symmetrySides: 4,
      feedbackAmount: 0.9,
      feedbackZoom: 1.01,
      feedbackRotation: 0.01,
      palette: EMBER,
    },
  },
  {
    name: 'Chromatic Void',
    params: {
      juliaX: -0.4,
      juliaY: 0.6,
      feedbackAmount: 0.85,
      feedbackZoom: 0.99,
      feedbackRotation: 0.004,
      palette: ELECTRIC,
      colorFrequency: 0.15,
      colorCycle: 0,
      saturation: 1.5,
      contrast: 1.3,
    },
  },
  {
    name: 'Cellular Dream',
    params: {
      juliaX: 0.355,
      juliaY: 0.355,
      warpStrength: 0.08,
      warpFrequency: 10,
      warpOctaves: 5,
      palette: DUSK,
    },
  },
  {
    name: 'Liquid Geometry',
    params: {
      juliaX: -0.70176,
      juliaY: -0.3842,
      symmetrySides: 6,
      warpStrength: 0.35,
      warpFrequency: 1.2,
      warpRotation: 1.5,
      warpSpeed: 0.8,
      palette: ACID,
      colorFrequency: 0.06,
    },
  },
];
