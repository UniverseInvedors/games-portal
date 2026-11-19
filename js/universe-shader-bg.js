/**
 * Universe Invedors — Separated GLSL Animated Shader Background Engine (v2.0)
 * Optimized for both Desktop GPUs and Low-End Mobile Hardware:
 *  - Adaptive DPR (1.0 on mobile/low-core devices, <= 1.35 on desktop)
 *  - Adaptive frame pacing (30fps on mobile/low-end, 60fps on desktop)
 *  - mediump float precision on mobile GPUs for fast compilation & low power draw
 *  - Graceful webglcontextlost / reduced-motion / tab-hidden pause & CSS fallback
 */
(function () {
  "use strict";

  if (window.__UNIVERSE_SHADER_BG_INIT__) return;
  window.__UNIVERSE_SHADER_BG_INIT__ = true;

  var IS_MOBILE = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "") ||
                  (window.innerWidth && window.innerWidth <= 768);
  var LOW_CORE_DEVICE = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
                        (navigator.deviceMemory && navigator.deviceMemory <= 4);
  var PRECISION_HEADER = (IS_MOBILE || LOW_CORE_DEVICE) ? "precision mediump float;\n" : "precision highp float;\n";

  var FALLBACK_VERT = [
    "attribute vec2 a_position;",
    "varying vec2 v_uv;",
    "void main() {",
    "  v_uv = a_position * 0.5 + 0.5;",
    "  gl_Position = vec4(a_position, 0.0, 1.0);",
    "}"
  ].join("\n");

  var FALLBACK_FRAGS = {
    aurora: [
      PRECISION_HEADER,
      "varying vec2 v_uv;",
      "uniform float u_time;",
      "uniform vec2 u_resolution;",
      "uniform vec2 u_mouse;",
      "float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}",
      "float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);vec2 u=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x),u.y);}",
      "float fbm(vec2 p){float v=0.0;float a=0.5;mat2 rot=mat2(0.80,0.60,-0.60,0.80);for(int i=0;i<4;i++){v+=a*noise(p);p=rot*p*2.02;a*=0.5;}return v;}",
      "void main(){",
      "  vec2 uv=v_uv;float aspect=u_resolution.x/max(u_resolution.y,1.0);",
      "  vec2 p=(uv-0.5)*vec2(aspect,1.0)+(u_mouse-0.5)*0.22;",
      "  float t=u_time*0.14;",
      "  vec2 q=vec2(fbm(p*1.4+vec2(0.0,t)),fbm(p*1.4+vec2(5.2,-t*0.8)));",
      "  vec2 r=vec2(fbm(p*1.8+3.2*q+vec2(1.7,9.2)+0.15*t),fbm(p*1.8+3.2*q+vec2(8.3,2.8)-0.12*t));",
      "  float f=fbm(p*1.6+2.5*r);",
      "  vec3 col=vec3(0.035,0.045,0.095);",
      "  col=mix(col,vec3(0.55,0.26,0.95)*0.55,smoothstep(0.15,0.75,f));",
      "  col=mix(col,vec3(0.08,0.72,0.96)*0.65,smoothstep(0.35,0.95,length(q)));",
      "  col+=vec3(0.06,0.82,0.62)*0.22*smoothstep(0.55,0.95,r.x);",
      "  col+=vec3(0.92,0.24,0.62)*0.18*smoothstep(0.60,0.98,r.y);",
      "  float vig=1.0-smoothstep(0.35,1.25,length(p));col*=mix(0.62,1.0,vig);",
      "  gl_FragColor=vec4(col,1.0);",
      "}"
    ].join("\n"),
    prism: [
      PRECISION_HEADER,
      "varying vec2 v_uv;",
      "uniform float u_time;",
      "uniform vec2 u_resolution;",
      "uniform vec2 u_mouse;",
      "vec3 palette(float t){return vec3(0.16,0.14,0.28)+vec3(0.24,0.26,0.36)*cos(6.28318*(t+vec3(0.0,0.33,0.67)));}",
      "void main(){",
      "  float aspect=u_resolution.x/max(u_resolution.y,1.0);",
      "  vec2 uv=(v_uv-0.5)*vec2(aspect,1.0);vec2 m=(u_mouse-0.5)*0.30;",
      "  float t=u_time*0.22;vec2 p=uv*1.65+m;",
      "  float e=(sin(p.x*2.4+t)*cos(p.y*2.1-t*0.8)+sin((p.x+p.y)*3.1-t*1.1)*0.7+cos(length(p)*4.2-t*1.3)*0.5)*0.35;",
      "  vec3 col=mix(vec3(0.03,0.045,0.085),palette(e+t*0.18+length(uv)*0.25),0.68);",
      "  gl_FragColor=vec4(col,1.0);",
      "}"
    ].join("\n"),
    cosmic: [
      PRECISION_HEADER,
      "varying vec2 v_uv;",
      "uniform float u_time;",
      "uniform vec2 u_resolution;",
      "uniform vec2 u_mouse;",
      "float hash(vec2 p){return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5453);}",
      "float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);vec2 u=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x),u.y);}",
      "void main(){",
      "  float aspect=u_resolution.x/max(u_resolution.y,1.0);",
      "  vec2 uv=(v_uv-0.5)*vec2(aspect,1.0);vec2 m=(u_mouse-0.5)*0.18;",
      "  float t=u_time*0.16;float r=length(uv+m);float a=atan(uv.y+m.y,uv.x+m.x);",
      "  float mandala=sin(a*8.0+t*1.5)*cos(r*10.0-t*2.0);",
      "  float n1=noise(uv*3.2+vec2(t,-t*0.7));float n2=noise(uv*6.4-vec2(t*0.5,t));",
      "  vec3 col=mix(vec3(0.045,0.035,0.11),vec3(0.32,0.14,0.58),smoothstep(0.2,0.85,n1));",
      "  col+=vec3(0.95,0.64,0.18)*0.22*smoothstep(0.35,0.95,mandala*0.5+0.5)*exp(-r*1.1);",
      "  col+=vec3(0.75,0.22,0.48)*0.18*smoothstep(0.45,0.95,n2);",
      "  gl_FragColor=vec4(col,1.0);",
      "}"
    ].join("\n")
  };

  function detectTheme() {
    var attr = document.body && document.body.getAttribute("data-shader-theme");
    if (attr && FALLBACK_FRAGS[attr]) return attr;
    var host = (window.location.hostname || "").toLowerCase();
    var path = (window.location.pathname || "").toLowerCase();
    if (host.indexOf("astrology") !== -1 || path.indexOf("astrology") !== -1) return "cosmic";
    if (host.indexOf("universeinvedors.info") !== -1 || path.indexOf("/tool-") !== -1 || path.indexOf("info-hub") !== -1) return "prism";
    return "aurora";
  }

  function resolveShaderBase() {
    var scriptEl = document.currentScript || document.querySelector('script[src*="universe-shader-bg.js"], script[src*="shader-bg.js"]');
    if (scriptEl && scriptEl.src) {
      try {
        var u = new URL(scriptEl.src, window.location.href);
        if (u.pathname.indexOf("/_shared/") !== -1) {
          return u.origin + u.pathname.replace(/\/[^/]+$/, "/shaders/");
        }
        return u.origin + "/shaders/";
      } catch (e) {}
    }
    return "/shaders/";
  }

  async function loadShaderText(url, fallback) {
    if (window.location.protocol === "file:") return fallback;
    try {
      var res = await fetch(url, { cache: "force-cache" });
      if (res.ok) {
        var txt = await res.text();
        if (IS_MOBILE || LOW_CORE_DEVICE) {
          txt = txt.replace("precision highp float;", "precision mediump float;");
        }
        return txt;
      }
    } catch (e) {}
    return fallback;
  }

  function compileShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  async function initShaderBackground() {
    if (!document.body) return;

    var theme = detectTheme();
    var shaderBase = resolveShaderBase();
    var fragFileMap = {
      aurora: "aurora-nebula.frag.glsl",
      prism: "prism-plasma.frag.glsl",
      cosmic: "cosmic-gold.frag.glsl"
    };

    var canvas = document.getElementById("universe-glsl-bg");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "universe-glsl-bg";
      canvas.setAttribute("aria-hidden", "true");
      canvas.setAttribute("data-shader-theme", theme);
      canvas.style.cssText = [
        "position:fixed",
        "inset:0",
        "width:100%",
        "height:100%",
        "z-index:0",
        "pointer-events:none",
        "display:block",
        "opacity:0.92"
      ].join(";");
      document.body.insertBefore(canvas, document.body.firstChild);
    }

    document.documentElement.classList.add("universe-glsl-active");
    document.body.classList.add("universe-glsl-active", "universe-theme-" + theme);

    var gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: (IS_MOBILE || LOW_CORE_DEVICE) ? "low-power" : "default"
    }) || canvas.getContext("experimental-webgl");

    if (!gl) {
      canvas.style.background = "radial-gradient(circle at 20% 20%, #1e1b4b 0%, #090d16 55%, #06283d 100%)";
      return;
    }

    canvas.addEventListener("webglcontextlost", function (ev) {
      ev.preventDefault();
      canvas.style.background = "radial-gradient(circle at 20% 20%, #1e1b4b 0%, #090d16 55%, #06283d 100%)";
    }, false);

    var vertSrc = await loadShaderText(shaderBase + "fullscreen-quad.vert.glsl", FALLBACK_VERT);
    var fragSrc = await loadShaderText(shaderBase + fragFileMap[theme], FALLBACK_FRAGS[theme]);

    var vShader = compileShader(gl, gl.VERTEX_SHADER, vertSrc) || compileShader(gl, gl.VERTEX_SHADER, FALLBACK_VERT);
    var fShader = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc) || compileShader(gl, gl.FRAGMENT_SHADER, FALLBACK_FRAGS[theme]);
    if (!vShader || !fShader) return;

    var program = gl.createProgram();
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    gl.useProgram(program);

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

    var posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    var uTime = gl.getUniformLocation(program, "u_time");
    var uRes = gl.getUniformLocation(program, "u_resolution");
    var uMouse = gl.getUniformLocation(program, "u_mouse");

    var mouseX = 0.5, mouseY = 0.5, targetX = 0.5, targetY = 0.5;
    if (!IS_MOBILE) {
      window.addEventListener("pointermove", function (e) {
        targetX = e.clientX / Math.max(window.innerWidth, 1);
        targetY = 1.0 - (e.clientY / Math.max(window.innerHeight, 1));
      }, { passive: true });
    }

    function resize() {
      var maxDpr = (IS_MOBILE || LOW_CORE_DEVICE) ? 1.0 : 1.35;
      var dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      var w = Math.max(1, Math.floor(window.innerWidth * dpr));
      var h = Math.max(1, Math.floor(window.innerHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }
    window.addEventListener("resize", resize, { passive: true });
    resize();

    var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var minFrameIntervalMs = (IS_MOBILE || LOW_CORE_DEVICE) ? 33.3 : 16.0; // 30fps mobile, 60fps desktop
    var lastFrameAt = 0;
    var start = performance.now();

    function frame(now) {
      if (!document.hidden && (now - lastFrameAt >= minFrameIntervalMs || lastFrameAt === 0)) {
        lastFrameAt = now;
        mouseX += (targetX - mouseX) * 0.04;
        mouseY += (targetY - mouseY) * 0.04;
        var elapsed = reducedMotion ? 1.5 : (now - start) * 0.001;
        gl.uniform1f(uTime, elapsed);
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform2f(uMouse, mouseX, mouseY);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      if (!reducedMotion) {
        requestAnimationFrame(frame);
      }
    }
    requestAnimationFrame(frame);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initShaderBackground);
  } else {
    initShaderBackground();
  }
})();
