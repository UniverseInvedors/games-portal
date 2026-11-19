precision highp float;

varying vec2 v_uv;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = rot * p * 2.02;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = v_uv;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
  vec2 mouseOffset = (u_mouse - 0.5) * 0.25;
  p += mouseOffset;

  float t = u_time * 0.14;
  vec2 q = vec2(
    fbm(p * 1.4 + vec2(0.0, t)),
    fbm(p * 1.4 + vec2(5.2, -t * 0.8))
  );
  vec2 r = vec2(
    fbm(p * 1.8 + 3.2 * q + vec2(1.7, 9.2) + 0.15 * t),
    fbm(p * 1.8 + 3.2 * q + vec2(8.3, 2.8) - 0.12 * t)
  );
  float f = fbm(p * 1.6 + 2.5 * r);

  // Rich dark-cosmos base with luminous aurora ribbons
  vec3 bgDeep = vec3(0.035, 0.045, 0.095);
  vec3 colCyan = vec3(0.08, 0.72, 0.96);
  vec3 colViolet = vec3(0.55, 0.26, 0.95);
  vec3 colEmerald = vec3(0.06, 0.82, 0.62);
  vec3 colMagenta = vec3(0.92, 0.24, 0.62);

  vec3 color = bgDeep;
  color = mix(color, colViolet * 0.55, smoothstep(0.15, 0.75, f));
  color = mix(color, colCyan * 0.65, smoothstep(0.35, 0.95, length(q)));
  color += colEmerald * 0.22 * smoothstep(0.55, 0.95, r.x);
  color += colMagenta * 0.18 * smoothstep(0.60, 0.98, r.y);

  // Subtle twinkling starfield
  vec2 starGrid = floor(uv * vec2(180.0 * aspect, 180.0));
  float starVal = hash(starGrid);
  if (starVal > 0.994) {
    float twinkle = 0.55 + 0.45 * sin(u_time * 2.5 + starVal * 100.0);
    color += vec3(0.85, 0.92, 1.0) * twinkle * 0.45;
  }

  // Soft vignette to keep center readable
  float vig = 1.0 - smoothstep(0.35, 1.25, length(p));
  color *= mix(0.62, 1.0, vig);

  gl_FragColor = vec4(color, 1.0);
}
