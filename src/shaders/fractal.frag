#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uZoom;
uniform vec2 uCenter;
uniform vec2 uJuliaC;
uniform int uIterations;

out vec4 outColor;

const float TAU = 6.28318530718;

// Larger than the classic R = 2: the smooth escape formula assumes |z|² ≫ |c| at escape,
// and a small radius leaves visible seams between iteration bands. Costs ~2 extra iterations.
const float ESCAPE_RADIUS = 16.0;

const float COLOR_FREQUENCY = 0.04; // palette cycles per escape iteration
const float COLOR_DRIFT = 0.03;     // palette cycles per second

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

// Cosine palette a + b·cos(2π(c·t + d)) (FRACTAL_MATH_ENGINE.md §30).
vec3 palette(float t) {
    return 0.5 + 0.5 * cos(TAU * (t + vec3(0.0, 0.33, 0.67)));
}

void main() {
    vec2 z = pixelToWorld(gl_FragCoord.xy) / uZoom + uCenter;
    float escape = juliaSmoothEscape(z, uJuliaC);

    vec3 color = escape < 0.0
        ? vec3(0.0)
        : palette(COLOR_FREQUENCY * escape + COLOR_DRIFT * uTime);

    outColor = vec4(color, 1.0);
}
