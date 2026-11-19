/**
 * Universe Invedors — Procedural Web Audio Gaming SFX & Ambient Engine
 * Zero external audio files; instant, user-gesture-safe Web Audio synthesis.
 */
(function () {
  "use strict";

  if (window.UniverseArcadeSFX) return;

  var SFX_KEY = "universe_arcade_sfx";
  var BGM_KEY = "universe_arcade_bgm";

  var ctx = null;
  var masterGain = null;
  var bgmNodes = null;

  var state = {
    sfx: localStorage.getItem(SFX_KEY) !== "false",
    bgm: localStorage.getItem(BGM_KEY) === "true"
  };

  function ensureContext() {
    if (!ctx) {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.35;
      masterGain.connect(ctx.destination);
    }
    if (ctx.state === "suspended") {
      ctx.resume().catch(function () {});
    }
    return ctx;
  }

  function playTone(opts) {
    if (!state.sfx) return;
    var c = ensureContext();
    if (!c) return;
    var now = c.currentTime + (opts.delay || 0);
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = opts.type || "sine";
    osc.frequency.setValueAtTime(opts.freq || 440, now);
    if (opts.freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.freqEnd), now + (opts.dur || 0.1));
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(opts.vol || 0.15, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (opts.dur || 0.1));

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + (opts.dur || 0.1) + 0.02);
  }

  function startBgm() {
    var c = ensureContext();
    if (!c || bgmNodes) return;
    var filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;

    var bgmGain = c.createGain();
    bgmGain.gain.setValueAtTime(0.0001, c.currentTime);
    bgmGain.gain.linearRampToValueAtTime(0.08, c.currentTime + 1.2);

    var osc1 = c.createOscillator();
    osc1.type = "sawtooth";
    osc1.frequency.value = 55; // A1

    var osc2 = c.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.value = 82.41; // E2

    var lfo = c.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.18;
    var lfoGain = c.createGain();
    lfoGain.gain.value = 180;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(bgmGain);
    bgmGain.connect(masterGain);

    osc1.start();
    osc2.start();
    lfo.start();
    bgmNodes = { osc1: osc1, osc2: osc2, lfo: lfo, bgmGain: bgmGain };
  }

  function stopBgm() {
    if (!bgmNodes || !ctx) return;
    var nodes = bgmNodes;
    bgmNodes = null;
    try {
      nodes.bgmGain.gain.setValueAtTime(nodes.bgmGain.gain.value, ctx.currentTime);
      nodes.bgmGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      setTimeout(function () {
        try {
          nodes.osc1.stop();
          nodes.osc2.stop();
          nodes.lfo.stop();
        } catch (e) {}
      }, 400);
    } catch (e) {}
  }

  var api = {
    hover: function () {
      playTone({ type: "triangle", freq: 720, freqEnd: 980, dur: 0.045, vol: 0.06 });
    },
    click: function () {
      playTone({ type: "sine", freq: 520, freqEnd: 880, dur: 0.075, vol: 0.12 });
    },
    filter: function () {
      playTone({ type: "triangle", freq: 440, freqEnd: 660, dur: 0.08, vol: 0.1 });
      playTone({ type: "sine", freq: 660, freqEnd: 990, dur: 0.09, vol: 0.08, delay: 0.04 });
    },
    launch: function () {
      playTone({ type: "sawtooth", freq: 220, freqEnd: 660, dur: 0.18, vol: 0.11 });
      playTone({ type: "triangle", freq: 440, freqEnd: 880, dur: 0.22, vol: 0.12, delay: 0.06 });
      playTone({ type: "sine", freq: 660, freqEnd: 1320, dur: 0.25, vol: 0.1, delay: 0.12 });
    },
    burst: function () {
      playTone({ type: "sine", freq: 180, freqEnd: 60, dur: 0.28, vol: 0.2 });
      playTone({ type: "triangle", freq: 520, freqEnd: 1240, dur: 0.22, vol: 0.1, delay: 0.03 });
    },
    isSfxEnabled: function () { return state.sfx; },
    isBgmEnabled: function () { return state.bgm; },
    toggleSfx: function () {
      state.sfx = !state.sfx;
      localStorage.setItem(SFX_KEY, String(state.sfx));
      if (state.sfx) api.click();
      return state.sfx;
    },
    toggleBgm: function () {
      state.bgm = !state.bgm;
      localStorage.setItem(BGM_KEY, String(state.bgm));
      if (state.bgm) startBgm();
      else stopBgm();
      return state.bgm;
    }
  };

  window.UniverseArcadeSFX = api;

  // Resume / start BGM on first user gesture if enabled
  function unlockAudio() {
    ensureContext();
    if (state.bgm && !bgmNodes) startBgm();
    window.removeEventListener("pointerdown", unlockAudio);
    window.removeEventListener("keydown", unlockAudio);
  }
  window.addEventListener("pointerdown", unlockAudio, { passive: true });
  window.addEventListener("keydown", unlockAudio, { passive: true });

  // Event-delegated hover & click SFX across UI controls and cards
  var lastHoverEl = null;
  document.addEventListener("pointerover", function (e) {
    var target = e.target && e.target.closest && e.target.closest(".game-card, .genre-btn, .hud-btn, .btn-home, .btn-launch, .cta-btn, .nav-links a");
    if (target && target !== lastHoverEl) {
      lastHoverEl = target;
      api.hover();
    } else if (!target) {
      lastHoverEl = null;
    }
  }, { passive: true });

  document.addEventListener("click", function (e) {
    var launchTarget = e.target && e.target.closest && e.target.closest(".game-card, .btn-launch, .cta-primary");
    if (launchTarget) {
      api.launch();
      return;
    }
    var uiTarget = e.target && e.target.closest && e.target.closest(".hud-btn, .btn-home, .nav-links a");
    if (uiTarget) {
      api.click();
    }
  }, { passive: true });
})();
