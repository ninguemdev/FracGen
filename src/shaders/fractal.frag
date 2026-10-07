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

uniform int uBrushMode;       // 0 off, 1 attract, 2 repel, 3 twist
uniform vec2 uBrushCenter;    // pointer, in view coordinates
uniform float uBrushRadius;   // standard deviation of the Gaussian falloff, in view units
uniform float uBrushStrength; // 0–1, eased in on press and out after release

uniform vec3 uPalette[4];    // cosine palette coefficients a, b, c, d
uniform float uColorFrequency; // palette cycles per escape iteration
uniform float uColorOffset;    // phase + accumulated color cycle, in palette cycles
uniform float uContrast;
uniform float uSaturation;
uniform float uBrightness;

uniform sampler2D uPreviousFrame;
uniform float uFeedbackAmount;   // share of the previous frame kept in this frame
uniform float uFeedbackZoom;     // magnification of the previous frame in this frame
uniform float uFeedbackRotation; // rotation of the previous frame in this frame, in radians
uniform uint uFrame;             // frame counter, seeds the rounding noise

out vec4 outColor;

const float TAU = 6.28318530718;

// Larger than the classic R = 2: the smooth escape formula assumes |z|² ≫ |c| at escape,
// and a small radius leaves visible seams between iteration bands. Costs ~2 extra iterations.
const float ESCAPE_RADIUS = 16.0;

// Phase offset between warp octaves so they don't move in lockstep (must match math/warp.ts).
const float OCTAVE_PHASE_STEP = 1.7;

// Brush modes and their gains at full strength (must match math/brushForce.ts). Attract stays
// one-to-one up to a gain of ≈ 2.24; repel at 1 spreads the point under the pointer widest.
const int BRUSH_ATTRACT = 1;
const int BRUSH_REPEL = 2;
const int BRUSH_TWIST = 3;
const float BRUSH_ATTRACT_GAIN = 2.0;
const float BRUSH_REPEL_GAIN = 1.0;
const float BRUSH_TWIST_ANGLE = 3.14159265359;

// Smallest normal half float; below it half floats are evenly spaced (subnormals).
const float HALF_MIN_NORMAL = 1.0 / 16384.0;

// Pixel → centered, aspect-corrected coordinates: y ∈ [-1, 1], x ∈ [-aspect, aspect]
// (FRACTAL_MATH_ENGINE.md §2).
vec2 pixelToWorld(vec2 pixel) {
    return (2.0 * pixel - uResolution) / uResolution.y;
}

// Inverse of pixelToWorld, normalized to texture coordinates.
vec2 worldToUv(vec2 p) {
    return 0.5 + 0.5 * p * uResolution.y / uResolution;
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

// Mouse brush (FRACTAL_MATH_ENGINE.md §21): moves points near the brush with a Gaussian
// weight. Showing at p what lies farther out squeezes the image toward the brush, so
// attract uses the §21 repulsor formula (p + αgd) and repel the attractor one; twist turns
// the image around the brush, a true rotation rather than §21's linearized one.
vec2 brushForce(vec2 p, vec2 center) {
    vec2 d = p - center;
    float weight = uBrushStrength * exp(-dot(d, d) / (2.0 * uBrushRadius * uBrushRadius));
    if (uBrushMode == BRUSH_ATTRACT) return p + BRUSH_ATTRACT_GAIN * weight * d;
    if (uBrushMode == BRUSH_REPEL) return p - BRUSH_REPEL_GAIN * weight * d;
    if (uBrushMode == BRUSH_TWIST) {
        float angle = -BRUSH_TWIST_ANGLE * weight;
        float c = cos(angle);
        float s = sin(angle);
        return center + mat2(c, s, -s, c) * d;
    }
    return p;
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

// Previous frame, magnified and turned about the centre of the view (§23). Looking it up at
// q = R(−θ)·p / zoom moves what was at q to p, so zoom > 1 makes the image flow outward and
// a small rotation per frame winds the trails into spirals. View coordinates keep the
// rotation round on a non-square canvas.
vec3 previousFrame(vec2 p) {
    float c = cos(uFeedbackRotation);
    float s = sin(uFeedbackRotation);
    vec2 q = mat2(c, -s, s, c) * p / uFeedbackZoom;
    return texture(uPreviousFrame, worldToUv(q)).rgb;
}

// PCG hash (Jarzynski & Olano, "Hash Functions for GPU Rendering", 2020).
uint pcgHash(uint v) {
    uint state = v * 747796405u + 2891336453u;
    uint word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
    return (word >> 22u) ^ word;
}

// Uniform in [0, 1), independent for every pixel and frame. 24 bits convert to float exactly.
float pixelNoise() {
    uvec2 pixel = uvec2(gl_FragCoord.xy);
    return float(pcgHash(pcgHash(pcgHash(pixel.x) + pixel.y) + uFrame) >> 8u) / 16777216.0;
}

// Strong feedback moves a pixel by only (1 − amount) × difference per frame. Once that is
// under the spacing of the half-float buffer, plain rounding (truncation on some GPUs) keeps
// the old value forever and faded images never quite disappear. Rounding to one of the two
// neighbouring half floats at random, with probability proportional to closeness, is exact
// on average, so the fade carries on; the noise is far below one 8-bit display step.
vec3 stochasticRound(vec3 color) {
    // Half floats have 10 mantissa bits: spacing 2^(⌊log₂ x⌋ − 10).
    vec3 spacing = exp2(floor(log2(max(color, HALF_MIN_NORMAL))) - 10.0);
    vec3 lower = floor(color / spacing) * spacing;
    return lower + spacing * step(pixelNoise(), (color - lower) / spacing);
}

void main() {
    vec2 view = pixelToWorld(gl_FragCoord.xy);

    // Lens, in view space: symmetry and warp stay centred and keep their on-screen size,
    // while zoom and position slide the fractal underneath them, like turning a kaleidoscope.
    vec2 p = kaleidoscope(view, uSymmetrySides, uSymmetryMirror);
    if (uBrushStrength > 0.0) {
        // Folding the brush position too makes it act in every kaleidoscope sector at once.
        p = brushForce(p, kaleidoscope(uBrushCenter, uSymmetrySides, uSymmetryMirror));
    }
    p = domainWarp(p);

    // Camera: picks the region of the fractal plane seen through the lens.
    vec2 z = p / uZoom + uCenter;
    float escape = juliaSmoothEscape(z, uJuliaC);

    // fwidth is taken outside any branch: derivatives need t from every pixel of the 2×2 quad.
    float t = uColorFrequency * escape + uColorOffset;
    float footprint = fwidth(t);

    vec3 color = adjustColor(escape < 0.0 ? vec3(0.0) : palette(t, footprint));

    // Temporal feedback (§22): blending the finished colors, rather than escape values before
    // the palette, lets trails keep the palette phase they were drawn with.
    if (uFeedbackAmount > 0.0) {
        color = stochasticRound(mix(color, previousFrame(view), uFeedbackAmount));
    }
    outColor = vec4(color, 1.0);
}
