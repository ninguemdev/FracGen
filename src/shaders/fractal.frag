#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uZoom;
uniform vec2 uCenter;
uniform vec2 uJuliaC;
uniform int uIterations;

uniform vec3 uPalette[4];      // cosine palette coefficients a, b, c, d
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

// Pixel → centered, aspect-corrected coordinates: y ∈ [-1, 1], x ∈ [-aspect, aspect]
// (FRACTAL_MATH_ENGINE.md §2).
vec2 pixelToWorld(vec2 pixel) {
    return (2.0 * pixel - uResolution) / uResolution.y;
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
    vec2 z = pixelToWorld(gl_FragCoord.xy) / uZoom + uCenter;
    float escape = juliaSmoothEscape(z, uJuliaC);

    // fwidth is taken outside any branch: derivatives need t from every pixel of the 2×2 quad.
    float t = uColorFrequency * escape + uColorOffset;
    float footprint = fwidth(t);

    vec3 color = escape < 0.0 ? vec3(0.0) : palette(t, footprint);
    outColor = vec4(adjustColor(color), 1.0);
}
