precision highp float;

varying vec2 v_uv;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

vec3 palette(float t) {
  vec3 a = vec3(0.16, 0.14, 0.28);
  vec3 b = vec3(0.24, 0.26, 0.36);
  vec3 c = vec3(1.0, 1.0, 1.0);
  vec3 d = vec3(0.00, 0.33, 0.67);
  return a + b * cos(6.28318 * (c * t + d));
}

void main() {
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 uv = (v_uv - 0.5) * vec2(aspect, 1.0);
  vec2 m = (u_mouse - 0.5) * 0.35;

  float t = u_time * 0.22;
  vec2 p = uv * 1.65 + m;

  float wave1 = sin(p.x * 2.4 + t) * cos(p.y * 2.1 - t * 0.8);
  float wave2 = sin((p.x + p.y) * 3.1 - t * 1.1);
  float wave3 = cos(length(p - m * 0.5) * 4.2 - t * 1.3);
  float energy = (wave1 + wave2 * 0.7 + wave3 * 0.5) * 0.35;

  vec3 prism = palette(energy + t * 0.18 + length(uv) * 0.25);
  vec3 base = vec3(0.03, 0.045, 0.085);

  vec3 color = mix(base, prism, 0.68);
  float glow = smoothstep(0.65, 0.0, length(uv - m * 0.4));
  color += vec3(0.10, 0.42, 0.65) * glow * 0.24;

  gl_FragColor = vec4(color, 1.0);
}
