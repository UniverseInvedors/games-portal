precision highp float;

varying vec2 v_uv;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_mode;
uniform float u_pulse;

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
  for (int i = 0; i < 4; i++) {
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
  vec2 m = (u_mouse - 0.5) * vec2(aspect, 1.0);

  float t = u_time * 0.16;
  vec2 q = vec2(
    fbm(p * 1.45 + vec2(0.0, t) + m * 0.15),
    fbm(p * 1.45 + vec2(5.2, -t * 0.8))
  );
  vec2 r = vec2(
    fbm(p * 1.85 + 2.8 * q + vec2(1.7, 9.2) + 0.15 * t),
    fbm(p * 1.85 + 2.8 * q + vec2(8.3, 2.8) - 0.12 * t)
  );
  float f = fbm(p * 1.6 + 2.2 * r);

  vec3 bgDeep = vec3(0.025, 0.035, 0.075);
  vec3 c1 = vec3(0.06, 0.76, 0.98); // Cyan
  vec3 c2 = vec3(0.58, 0.24, 0.96); // Violet
  vec3 c3 = vec3(0.95, 0.22, 0.58); // Magenta

  if (u_mode > 0.5 && u_mode < 1.5) {
    // Aurora mode
    c1 = vec3(0.06, 0.86, 0.68);
    c2 = vec3(0.18, 0.52, 0.98);
    c3 = vec3(0.55, 0.26, 0.95);
  } else if (u_mode >= 1.5) {
    // Cosmic Forge mode
    c1 = vec3(0.98, 0.52, 0.14);
    c2 = vec3(0.86, 0.18, 0.48);
    c3 = vec3(0.45, 0.20, 0.92);
  }

  vec3 color = bgDeep;
  color = mix(color, c2 * 0.48, smoothstep(0.15, 0.78, f));
  color = mix(color, c1 * 0.52, smoothstep(0.35, 0.95, length(q)));
  color += c3 * 0.20 * smoothstep(0.55, 0.98, r.y);

  // Cyber-Arcade Perspective Horizon Grid (lower viewport)
  if (uv.y < 0.48) {
    float horizon = 0.48 - uv.y;
    float z = 0.28 / max(horizon, 0.025);
    float gx = abs(fract((p.x + m.x * 0.25) * z * 0.85) - 0.5);
    float gz = abs(fract(z * 0.45 - u_time * 0.55) - 0.5);
    float lineX = smoothstep(0.045, 0.0, gx);
    float lineZ = smoothstep(0.055, 0.0, gz);
    float gridMask = smoothstep(0.48, 0.12, uv.y) * exp(-horizon * 2.2);
    float grid = max(lineX, lineZ) * gridMask;
    color += mix(c1, c3, 0.35) * grid * 0.42;
  }

  // Pointer-reactive aura & click shockwave pulse
  float distMouse = length(p - m);
  float aura = exp(-distMouse * 3.2) * 0.22;
  color += c1 * aura;

  if (u_pulse > 0.001) {
    float ringRadius = (1.0 - u_pulse) * 1.45;
    float ring = exp(-abs(distMouse - ringRadius) * 18.0) * u_pulse;
    color += mix(c1, c3, 0.5) * ring * 0.85;
  }

  // Twinkling starfield
  vec2 starGrid = floor(uv * vec2(190.0 * aspect, 190.0));
  float starVal = hash(starGrid);
  if (starVal > 0.993) {
    float twinkle = 0.55 + 0.45 * sin(u_time * 2.8 + starVal * 120.0);
    color += vec3(0.88, 0.94, 1.0) * twinkle * 0.5;
  }

  // Subtle scanline & vignette
  float scan = 0.97 + 0.03 * sin(uv.y * u_resolution.y * 1.15);
  color *= scan;
  float vig = 1.0 - smoothstep(0.35, 1.32, length(p));
  color *= mix(0.58, 1.0, vig);

  gl_FragColor = vec4(color, 1.0);
}
