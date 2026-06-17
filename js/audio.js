let _ctx = null;
let _ambientNode = null;
let _ambientGain = null;

function ctx() {
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

// ─── Centralized sound config — tune all sounds here ─────────────────────────
export const SOUND_CONFIG = {
  footstep: {
    gain: 0.18, filterFreq: 180, duration: 0.06, pitchVariation: 0.05,
  },
  footstepWater: {
    gain: 0.28, filterFreq: 320, duration: 0.09, pitchVariation: 0.05,
  },
  pulse: {
    freq1: 90, freq2: 55, gain1: 0.5, gain2: 0.3,
    dur1: 0.55, dur2: 0.7, freqEnd1: 28, freqEnd2: 22,
    clickGain: 0.6, clickDur: 0.02,
  },
  alert: {
    freq1: 680, freqEnd1: 720, freq2: 780, freqEnd2: 820,
    gain: 0.06, duration: 0.12, delay: 140,
  },
  sentryAlert: {
    freq1: 480, freqEnd1: 520, freq2: 560, freqEnd2: 600,
    gain: 0.07, duration: 0.15, delay: 100,
  },
  death: {
    freq1: 220, freq2: 330, freq3: 110,
    gain1: 0.3, gain2: 0.2, gain3: 0.25,
    dur1: 0.8, dur2: 0.6, dur3: 1.2,
    freqEnd1: 55, freqEnd2: 44, freqEnd3: 40, delay3: 100,
  },
  levelComplete: {
    notes: [523, 659, 784, 1047], gain: 0.18, duration: 0.4,
    delays: [0, 120, 240, 400],
  },
  hazardPulse: {
    freq: 420, freqEnd: 400, gain: 0.08, duration: 0.18,
  },
  collapse: {
    freq: 120, freqEnd: 40, gain: 0.4, duration: 0.35,
    noiseGain: 0.5, noiseDuration: 0.25, noiseFilterFreq: 300,
  },
  doorOpen: {
    freq: 280, freqEnd: 380, gain: 0.2, duration: 0.25,
  },
  keyPickup: {
    freq: 880, freqEnd: 1100, gain: 0.15, duration: 0.2,
  },
  ambient: {
    freq: 55, gain: 0.035, fadeIn: 1.5, fadeOut: 0.5,
  },
};

// ─── Internal helpers ─────────────────────────────────────────────────────────
function osc(freq, type, dur, gain, freqEnd, destination) {
  const ac = ctx();
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.connect(g); g.connect(destination || ac.destination);
  o.type = type; o.frequency.setValueAtTime(freq, ac.currentTime);
  if (freqEnd != null) o.frequency.exponentialRampToValueAtTime(freqEnd, ac.currentTime + dur);
  g.gain.setValueAtTime(gain, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
  o.start(); o.stop(ac.currentTime + dur + 0.01);
}

function noiseBuffer(ac, duration) {
  const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * duration), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
  }
  return buf;
}

function noiseNode(ac, cfg) {
  const src = ac.createBufferSource();
  const g = ac.createGain();
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  const variation = cfg.pitchVariation ? (Math.random() * 2 - 1) * cfg.pitchVariation : 0;
  filter.frequency.value = cfg.filterFreq * (1 + variation);
  src.buffer = noiseBuffer(ac, cfg.duration);
  src.connect(filter); filter.connect(g); g.connect(ac.destination);
  g.gain.setValueAtTime(cfg.gain, ac.currentTime);
  src.start();
}

// ─── Player sounds ────────────────────────────────────────────────────────────
export function playFootstep() {
  try { noiseNode(ctx(), SOUND_CONFIG.footstep); } catch (_) {}
}

export function playFootstepWater() {
  try { noiseNode(ctx(), SOUND_CONFIG.footstepWater); } catch (_) {}
}

export function playFootstepSurface(surface) {
  if (surface === 'water') playFootstepWater();
  else playFootstep();
}

export function playPulse() {
  try {
    const c = SOUND_CONFIG.pulse;
    const ac = ctx();
    osc(c.freq1, 'sine', c.dur1, c.gain1, c.freqEnd1);
    osc(c.freq2, 'sine', c.dur2, c.gain2, c.freqEnd2);
    const src = ac.createBufferSource();
    const g = ac.createGain();
    src.buffer = noiseBuffer(ac, c.clickDur);
    src.connect(g); g.connect(ac.destination);
    g.gain.value = c.clickGain; src.start();
  } catch (_) {}
}

// ─── Enemy / alert sounds ─────────────────────────────────────────────────────
export function playAlert() {
  try {
    const c = SOUND_CONFIG.alert;
    osc(c.freq1, 'square', c.duration, c.gain, c.freqEnd1);
    setTimeout(() => osc(c.freq2, 'square', c.duration, c.gain, c.freqEnd2), c.delay);
  } catch (_) {}
}

export function playSentryAlert() {
  try {
    const c = SOUND_CONFIG.sentryAlert;
    osc(c.freq1, 'square', c.duration, c.gain, c.freqEnd1);
    setTimeout(() => osc(c.freq2, 'square', c.duration, c.gain, c.freqEnd2), c.delay);
  } catch (_) {}
}

// ─── Game event sounds ────────────────────────────────────────────────────────
export function playDeath() {
  try {
    const c = SOUND_CONFIG.death;
    osc(c.freq1, 'sawtooth', c.dur1, c.gain1, c.freqEnd1);
    osc(c.freq2, 'sawtooth', c.dur2, c.gain2, c.freqEnd2);
    setTimeout(() => osc(c.freq3, 'sine', c.dur3, c.gain3, c.freqEnd3), c.delay3);
  } catch (_) {}
}

export function playLevelComplete() {
  try {
    const { notes, gain, duration, delays } = SOUND_CONFIG.levelComplete;
    delays.forEach((delay, i) => {
      setTimeout(() => osc(notes[i], 'sine', duration, gain), delay);
    });
  } catch (_) {}
}

export function playHazardPulse(volume = 1) {
  if (volume <= 0.01) return;
  try {
    const c = SOUND_CONFIG.hazardPulse;
    osc(c.freq, 'triangle', c.duration, c.gain * volume, c.freqEnd);
  } catch (_) {}
}

export function playCollapse() {
  try {
    const c = SOUND_CONFIG.collapse;
    const ac = ctx();
    osc(c.freq, 'sine', c.duration, c.gain, c.freqEnd);
    const src = ac.createBufferSource();
    const g = ac.createGain();
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = c.noiseFilterFreq;
    src.buffer = noiseBuffer(ac, c.noiseDuration);
    src.connect(filter); filter.connect(g); g.connect(ac.destination);
    g.gain.setValueAtTime(c.noiseGain, ac.currentTime);
    src.start();
  } catch (_) {}
}

export function playDoorOpen() {
  try {
    const c = SOUND_CONFIG.doorOpen;
    osc(c.freq, 'triangle', c.duration, c.gain, c.freqEnd);
  } catch (_) {}
}

export function playKeyPickup() {
  try {
    const c = SOUND_CONFIG.keyPickup;
    osc(c.freq, 'sine', c.duration, c.gain, c.freqEnd);
  } catch (_) {}
}

// ─── Ambient drone ────────────────────────────────────────────────────────────
export function startAmbient() {
  try {
    if (_ambientNode) return;
    const ac = ctx();
    const c = SOUND_CONFIG.ambient;
    _ambientNode = ac.createOscillator();
    _ambientGain = ac.createGain();
    _ambientNode.connect(_ambientGain);
    _ambientGain.connect(ac.destination);
    _ambientNode.type = 'sine';
    _ambientNode.frequency.value = c.freq;
    _ambientGain.gain.setValueAtTime(0, ac.currentTime);
    _ambientGain.gain.linearRampToValueAtTime(c.gain, ac.currentTime + c.fadeIn);
    _ambientNode.start();
  } catch (_) {}
}

export function stopAmbient() {
  try {
    if (!_ambientNode) return;
    const ac = ctx();
    const c = SOUND_CONFIG.ambient;
    _ambientGain.gain.linearRampToValueAtTime(0, ac.currentTime + c.fadeOut);
    const nodeToStop = _ambientNode;
    _ambientNode = null;
    _ambientGain = null;
    nodeToStop.stop(ac.currentTime + c.fadeOut + 0.05);
  } catch (_) {}
}

export function resume() {
  ctx();
}
