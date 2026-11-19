precision highp float;

varying vec2 v_uv;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

void main() {
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 uv = (v_uv - 0.5) * vec2(aspect, 1.0);
  vec2 m = (u_mouse - 0.5) * 0.18;

  float t = u_time * 0.16;
  float r = length(uv + m);
  float angle = atan(uv.y + m.y, uv.x + m.x);

  // Sacred geometric harmonic rings + cosmic nebula
  float mandala = sin(angle * 8.0 + t * 1.5) * cos(r * 10.0 - t * 2.0);
  float n1 = noise(uv * 3.2 + vec2(t, -t * 0.7));
  float n2 = noise(uv * 6.4 - vec2(t * 0.5, t));

  vec3 deepIndigo = vec3(0.045, 0.035, 0.11);
  vec3 royalViolet = vec3(0.32, 0.14, 0.58);
  vec3 saffronGold = vec3(0.95, 0.64, 0.18);
  vec3 roseAura = vec3(0.75, 0.22, 0.48);

  vec3 color = mix(deepIndigo, royalViolet, smoothstep(0.2, 0.85, n1));
  color += saffronGold * 0.22 * smoothstep(0.35, 0.95, mandala * 0.5 + 0.5) * exp(-r * 1.1);
  color += roseAura * 0.18 * smoothstep(0.45, 0.95, n2);

  gl_FragColor = vec4(color, 1.0);
}
