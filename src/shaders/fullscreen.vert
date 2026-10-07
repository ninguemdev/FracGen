#version 300 es

// Fullscreen pass with a single oversized triangle instead of a two-triangle quad:
// no vertex buffer, and no wasted fragment work along the quad's diagonal.
// gl_VertexID 0, 1, 2 → (0,0), (2,0), (0,2) → clip space (-1,-1), (3,-1), (-1,3),
// which covers the whole [-1, 1]² viewport; the part outside is clipped for free.
void main() {
    vec2 corner = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
    gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
}
