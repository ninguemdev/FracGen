type Vec3 = readonly [number, number, number];

/** A cosine palette a + b·cos(2π(c·t + d)) (FRACTAL_MATH_ENGINE.md §30). */
export interface Palette {
  name: string;
  /** a, b, c, d flattened for the shader's vec3[4] uniform. */
  coefficients: Float32Array;
}

function cosinePalette(name: string, a: Vec3, b: Vec3, c: Vec3, d: Vec3): Palette {
  return { name, coefficients: new Float32Array([...a, ...b, ...c, ...d]) };
}

// Coefficient sets from Inigo Quilez's article on procedural cosine palettes.
export const PALETTES: readonly Palette[] = [
  cosinePalette('Electric', [0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [1, 1, 1], [0, 0.1, 0.2]),
  cosinePalette('Spectrum', [0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [1, 1, 1], [0, 0.33, 0.67]),
  cosinePalette('Coral', [0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [1, 1, 1], [0.3, 0.2, 0.2]),
  cosinePalette('Ember', [0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [1, 1, 0.5], [0.8, 0.9, 0.3]),
  cosinePalette('Lagoon', [0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [1, 0.7, 0.4], [0, 0.15, 0.2]),
  cosinePalette('Acid', [0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [2, 1, 0], [0.5, 0.2, 0.25]),
  cosinePalette('Dusk', [0.8, 0.5, 0.4], [0.2, 0.4, 0.2], [2, 1, 1], [0, 0.25, 0.25]),
];
