#version 300 es
precision highp float;

// Temporary animated test pattern that proves the WebGL 2 → GLSL → animation loop
// pipeline. It will be replaced by the Julia set.

uniform vec2 uResolution;
uniform float uTime;

out vec4 outColor;

const float TAU = 6.28318530718;

// Pixel → centered, aspect-corrected coordinates: y ∈ [-1, 1], x ∈ [-aspect, aspect]
// (FRACTAL_MATH_ENGINE.md §2).
vec2 pixelToWorld(vec2 pixel) {
    return (2.0 * pixel - uResolution) / uResolution.y;
}

// Cosine palette a + b·cos(2π(c·t + d)) (FRACTAL_MATH_ENGINE.md §30).
vec3 palette(float t) {
    return 0.5 + 0.5 * cos(TAU * (t + vec3(0.0, 0.33, 0.67)));
}

void main() {
    vec2 p = pixelToWorld(gl_FragCoord.xy);
    float radius = length(p);
    float angle = atan(p.y, p.x);

    // Concentric rings whose radius wobbles with 6 angular lobes. The lobe count must be
    // an integer so sin(6θ) stays continuous across atan's ±π seam.
    float wobble = 0.12 * sin(6.0 * angle + 0.9 * uTime);
    float rings = sin(14.0 * (radius + wobble) - 2.0 * uTime);

    vec3 color = palette(0.2 * rings + 0.5 * radius - 0.08 * uTime);
    color *= 0.55 + 0.45 * rings;  // darken the troughs between rings
    color *= exp(-0.6 * radius);   // fade toward the edges

    outColor = vec4(color, 1.0);
}
