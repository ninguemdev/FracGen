#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uZoom;
uniform vec2 uCenter;
uniform vec2 uJuliaC;
uniform int uIterations;

uniform float uSymmetrySides;
uniform bool uSymmetryMirror;

uniform float uWarpStrength;  // displacement of the first octave, in view units
uniform float uWarpFrequency; // spatial frequency of the first octave
uniform int uWarpOctaves;
uniform float uWarpRotation;  // amplitude of the rotational warp, in radians
uniform float uWarpPhase;     // animation phase accumulated from the warp speed

uniform vec3 uPalette[4];    // cosine palette coefficients a, b, c, d
uniform float uColorFrequency; // palette cycles per escape iteration
uniform float uColorOffset;    // phase + accumulated color cycle, in palette cycles
uniform float uContrast;
uniform float uSaturation;
uniform float uBrightness;

out vec4 outColor;

const float TAU = 6.28318530718;

// Larger than the classic R = 2: the smooth escape formula assumes |z|² ≫ |c| at escape,
// and a small radius leaves visible seams between iteration bands. Costs ~2 extra iterations.
const float ESCAPE_RADIUS = 16.0;

// Phase offset between warp octaves so they don't move in lockstep (must match math/warp.ts).
const float OCTAVE_PHASE_STEP = 1.7;

// Pixel → centered, aspect-corrected coordinates: y ∈ [-1, 1], x ∈ [-aspect, aspect]
// (FRACTAL_MATH_ENGINE.md §2).
vec2 pixelToWorld(vec2 pixel) {
    return (2.0 * pixel - uResolution) / uResolution.y;
}

// Kaleidoscope fold (FRACTAL_MATH_ENGINE.md §5). The plane is cut into `sides` angular
// sectors centred on the +x axis and every sector is mapped onto that first one: N-fold
// rotational repetition. Mirroring also reflects each sector about its centre line, giving
// the 2N alternating wedges of a kaleidoscope with no seams between neighbours.
vec2 kaleidoscope(vec2 p, float sides, bool mirrored) {
    if (sides < 2.0) return p;

    float sector = TAU / sides;
    // Shifting by half a sector before the mod centres each sector on angle 0.
    float angle = mod(atan(p.y, p.x) + 0.5 * sector, sector) - 0.5 * sector;
    if (mirrored) angle = abs(angle);
    return length(p) * vec2(cos(angle), sin(angle));
}

// Domain warp (FRACTAL_MATH_ENGINE.md §8–§10). Each octave doubles the frequency and halves
// the amplitude (§9); octaves are composed — each displaces the already displaced point —
// which folds the field into itself and reads as liquid rather than a plain wobble.
// The rotational warp (§10) then turns every point by an angle that oscillates with its
// radius, twisting concentric rings in alternating directions.
vec2 domainWarp(vec2 p) {
    float amplitude = uWarpStrength;
    float frequency = uWarpFrequency;
    for (int i = 0; i < uWarpOctaves; i++) {
        float offset = float(i) * OCTAVE_PHASE_STEP;
        p += amplitude * vec2(sin(frequency * p.y + uWarpPhase + offset),
                              cos(frequency * p.x - uWarpPhase + offset));
        amplitude *= 0.5;
        frequency *= 2.0;
    }

    float angle = uWarpRotation * sin(uWarpFrequency * length(p) - uWarpPhase);
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, s, -s, c) * p;
}

// (x + iy)² = x² − y² + 2xy·i
vec2 complexSquare(vec2 z) {
    return vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y);
}

// Iterates z → z² + c and returns the continuous escape count ν (§16),
// or -1 when z never escapes (the point belongs to the filled Julia set).
float juliaSmoothEscape(vec2 z, vec2 c) {
    for (int i = 0; i < uIterations; i++) {
        z = complexSquare(z) + c;
        if (dot(z, z) > ESCAPE_RADIUS * ESCAPE_RADIUS) {
            // Near escape |z| roughly squares each step, so log₂(log|z|) grows by ~1 per
            // iteration; subtracting it turns the integer count into a continuous one.
            return float(i) + 1.0 - log2(log(length(z)));
        }
    }
    return -1.0;
}

// Cosine palette a + b·cos(2π(c·t + d)) (§30), filtered over the pixel. `footprint` is how
// much t changes across one pixel; where a channel would cycle within a single pixel it
// cannot be resolved, so its oscillation fades to the average (a) instead of turning into
// noise near the fractal boundary.
vec3 palette(float t, float footprint) {
    vec3 a = uPalette[0], b = uPalette[1], c = uPalette[2], d = uPalette[3];
    vec3 resolvable = 1.0 - smoothstep(0.0, 1.0, c * footprint);
    return a + b * resolvable * cos(TAU * (c * t + d));
}

// Contrast pivots around mid-gray; saturation mixes toward Rec. 709 luma; brightness is a gain,
// so black stays black.
vec3 adjustColor(vec3 color) {
    color = (color - 0.5) * uContrast + 0.5;
    float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
    color = mix(vec3(luma), color, uSaturation);
    return clamp(color * uBrightness, 0.0, 1.0);
}

void main() {
    // Lens, in view space: symmetry and warp stay centred and keep their on-screen size,
    // while zoom and position slide the fractal underneath them, like turning a kaleidoscope.
    vec2 p = pixelToWorld(gl_FragCoord.xy);
    p = kaleidoscope(p, uSymmetrySides, uSymmetryMirror);
    p = domainWarp(p);

    // Camera: picks the region of the fractal plane seen through the lens.
    vec2 z = p / uZoom + uCenter;
    float escape = juliaSmoothEscape(z, uJuliaC);

    // fwidth is taken outside any branch: derivatives need t from every pixel of the 2×2 quad.
    float t = uColorFrequency * escape + uColorOffset;
    float footprint = fwidth(t);

    vec3 color = escape < 0.0 ? vec3(0.0) : palette(t, footprint);
    outColor = vec4(adjustColor(color), 1.0);
}
