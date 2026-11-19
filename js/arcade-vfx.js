/**
 * Universe Invedors — Arcade VFX GLSL Shader Engine
 * Supports live shader modes (cyber, aurora, cosmic), pointer shockwave pulses,
 * adaptive DPR & mobile frame pacing, and clean CSS fallback.
 */
(function () {
  "use strict";

  if (window.__UNIVERSE_SHADER_BG_INIT__) return;
  window.__UNIVERSE_SHADER_BG_INIT__ = true;

  var MODE_KEY = "universe_vfx_mode";
  var MODES = ["cyber", "aurora", "cosmic"];
  var currentMode = localStorage.getItem(MODE_KEY) || "cyber";
  if (MODES.indexOf(currentMode) === -1) currentMode = "cyber";

  var IS_MOBILE = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "") ||
                  (window.innerWidth && window.innerWidth <= 768);
  var LOW_CORE_DEVICE = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
                        (navigator.deviceMemory && navigator.deviceMemory <= 4);
  var PRECISION_HEADER = (IS_MOBILE || LOW_CORE_DEVICE) ? "precision mediump float;\n" : "precision highp float;\n";

  var VERT_SRC = [
    "attribute vec2 a_position;",
    "varying vec2 v_uv;",
    "void main() {",
    "  v_uv = a_position * 0.5 + 0.5;",
    "  gl_Position = vec4(a_position, 0.0, 1.0);",
    "}"
  ].join("\n");

  var FALLBACK_FRAG = [
    PRECISION_HEADER,
    "varying vec2 v_uv;",
    "uniform float u_time;",
    "uniform vec2 u_resolution;",
    "uniform vec2 u_mouse;",
    "uniform float u_mode;",
    "uniform float u_pulse;",
    "float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}",
    "float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);vec2 u=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x),u.y);}",
    "float fbm(vec2 p){float v=0.0;float a=0.5;mat2 rot=mat2(0.80,0.60,-0.60,0.80);for(int i=0;i<4;i++){v+=a*noise(p);p=rot*p*2.02;a*=0.5;}return v;}",
    "void main(){",
    "  vec2 uv=v_uv;float aspect=u_resolution.x/max(u_resolution.y,1.0);",
    "  vec2 p=(uv-0.5)*vec2(aspect,1.0);vec2 m=(u_mouse-0.5)*vec2(aspect,1.0);",
    "  float t=u_time*0.16;float f=fbm(p*1.5+vec2(t,-t*0.7));",
    "  vec3 c1=u_mode<0.5?vec3(0.06,0.76,0.98):(u_mode<1.5?vec3(0.06,0.86,0.68):vec3(0.98,0.52,0.14));",
    "  vec3 c2=u_mode<0.5?vec3(0.58,0.24,0.96):(u_mode<1.5?vec3(0.18,0.52,0.98):vec3(0.86,0.18,0.48));",
    "  vec3 col=mix(vec3(0.025,0.035,0.075),c2*0.48,smoothstep(0.15,0.8,f));",
    "  col+=c1*0.28*exp(-length(p-m)*2.8);",
    "  if(u_pulse>0.001){float rr=(1.0-u_pulse)*1.4;col+=c1*exp(-abs(length(p-m)-rr)*16.0)*u_pulse*0.8;}",
    "  gl_FragColor=vec4(col,1.0);",
    "}"
  ].join("\n");

  var pulseVal = 0.0;
  var mouseX = 0.5, mouseY = 0.5;

  window.UniverseVFX = {
    getMode: function () { return currentMode; },
    setMode: function (mode) {
      if (MODES.indexOf(mode) !== -1) {
        currentMode = mode;
        localStorage.setItem(MODE_KEY, mode);
        pulseVal = 1.0;
      }
      return currentMode;
    },
    cycleMode: function () {
      var next = MODES[(MODES.indexOf(currentMode) + 1) % MODES.length];
      return this.setMode(next);
    },
    pulse: function () {
      pulseVal = 1.0;
    }
  };

  function resolveShaderUrl() {
    var scriptEl = document.currentScript || document.querySelector('script[src*="arcade-vfx.js"]');
    if (scriptEl && scriptEl.src) {
      try {
        var u = new URL(scriptEl.src, window.location.href);
        return u.origin + u.pathname.replace(/\/js\/[^/]+$/, "/shaders/arcade-vfx.frag.glsl");
      } catch (e) {}
    }
    return "/shaders/arcade-vfx.frag.glsl";
  }

  async function loadFragShader(url) {
    if (window.location.protocol === "file:") return FALLBACK_FRAG;
    try {
      var res = await fetch(url, { cache: "force-cache" });
      if (!res.ok) return FALLBACK_FRAG;
      var txt = await res.text();
      return txt.replace(/precision\s+(highp|mediump|lowp)\s+float\s*;/, PRECISION_HEADER.trim());
    } catch (e) {
      return FALLBACK_FRAG;
    }
  }

  function compileShader(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  async function init() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var canvas = document.createElement("canvas");
    canvas.id = "universe-glsl-bg";
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;display:block;";
    document.body.insertBefore(canvas, document.body.firstChild);

    var gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" }) ||
             canvas.getContext("experimental-webgl");
    if (!gl) return;

    var fragSrc = await loadFragShader(resolveShaderUrl());
    var vs = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC);
    var fs = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc) || compileShader(gl, gl.FRAGMENT_SHADER, FALLBACK_FRAG);
    if (!vs || !fs) return;

    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    var locPos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(locPos);
    gl.vertexAttribPointer(locPos, 2, gl.FLOAT, false, 0, 0);

    var uTime = gl.getUniformLocation(prog, "u_time");
    var uRes = gl.getUniformLocation(prog, "u_resolution");
    var uMouse = gl.getUniformLocation(prog, "u_mouse");
    var uMode = gl.getUniformLocation(prog, "u_mode");
    var uPulse = gl.getUniformLocation(prog, "u_pulse");

    function resize() {
      var dpr = IS_MOBILE ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.35);
      canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
      canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", function (e) {
      mouseX = e.clientX / Math.max(1, window.innerWidth);
      mouseY = 1.0 - (e.clientY / Math.max(1, window.innerHeight));
    }, { passive: true });

    var start = performance.now();
    var lastFrame = 0;
    var minInterval = (IS_MOBILE || LOW_CORE_DEVICE) ? (1000 / 30) : 0;

    function frame(now) {
      requestAnimationFrame(frame);
      if (document.hidden) return;
      if (minInterval && now - lastFrame < minInterval) return;
      lastFrame = now;

      if (pulseVal > 0.0) {
        pulseVal = Math.max(0.0, pulseVal - 0.025);
      }
      var modeIndex = MODES.indexOf(currentMode);
      gl.uniform1f(uTime, (now - start) * 0.001);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uMouse, mouseX, mouseY);
      gl.uniform1f(uMode, modeIndex < 0 ? 0.0 : modeIndex);
      gl.uniform1f(uPulse, pulseVal);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    requestAnimationFrame(frame);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
