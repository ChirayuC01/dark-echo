let _ctx = null;
let _ambientNode = null;
let _ambientGain = null;
let _listenerInitialized = false;
let _convolver = null;
let _reverbSend = null;
let _pendingReverbSize = 'medium';
let _envActive = false;
let _envTimers = [];
let _envSources = [];

function ctx() {
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

// ─── Centralized sound config — tune all sounds here ─────────────────────────
export const SOUND_CONFIG = {
  footstep: {
    gain: 0.18, filterFreq: 180, duration: 0.06, pitchVariation: 0.05, reverb: true,
  },
  footstepWater: {
    gain: 0.28, filterFreq: 320, duration: 0.09, pitchVariation: 0.05, reverb: true,
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
    noiseGain: 0.5, noiseDuration: 0.25, noiseFilterFreq: 300, reverb: true,
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
  enemyFootstep: {
    gain: 0.07, filterFreq: 240, duration: 0.06, reverb: true,
  },
  enemyFootstepHunting: {
    gain: 0.13, filterFreq: 300, duration: 0.05, reverb: true,
  },
  environmental: {
    drip:   { filterFreq: 300, duration: 0.04, gain: 0.06, minInterval: 4000,  maxInterval: 12000 },
    rumble: { filterFreq: 60,  duration: 1.2,  gain: 0.02, minInterval: 18000, maxInterval: 35000 },
    creak:  { filterFreq: 800, filterQ: 3, duration: 0.3, gain: 0.04, minInterval: 12000, maxInterval: 28000 },
  },
  blindStalkerBreath: {
    freq: 110, freqEnd: 95, gain: 0.03, duration: 0.3,
  },
  pulseReady: {
    freq: 1800, gain: 0.08, duration: 0.04,
  },
};

// ─── Reverb helpers ───────────────────────────────────────────────────────────
function createImpulseResponse(ac, duration, decay) {
  const len = Math.ceil(ac.sampleRate * duration);
  const buf = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ac.sampleRate * decay));
    }
  }
  return buf;
}

function initReverb() {
  const ac = ctx();
  _convolver = ac.createConvolver();
  _reverbSend = ac.createGain();
  const sizes = { small: [1.2, 0.4], medium: [2.0, 0.7], large: [3.5, 1.2] };
  const [dur, dec] = sizes[_pendingReverbSize] ?? sizes.medium;
  _convolver.buffer = createImpulseResponse(ac, dur, dec);
  _reverbSend.gain.value = 0.25;
  _convolver.connect(_reverbSend); _reverbSend.connect(ac.destination);
}

function addReverb(gainNode) {
  if (_convolver) gainNode.connect(_convolver);
}

// ─── Internal helpers ─────────────────────────────────────────────────────────
function osc(freq, type, dur, gain, freqEnd, destination, reverb) {
  const ac = ctx();
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.connect(g); g.connect(destination || ac.destination);
  if (reverb) addReverb(g);
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

function noiseNode(ac, cfg, destination) {
  const src = ac.createBufferSource();
  const g = ac.createGain();
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  const variation = cfg.pitchVariation ? (Math.random() * 2 - 1) * cfg.pitchVariation : 0;
  filter.frequency.value = cfg.filterFreq * (1 + variation);
  src.buffer = noiseBuffer(ac, cfg.duration);
  src.connect(filter); filter.connect(g); g.connect(destination || ac.destination);
  if (cfg.reverb) addReverb(g);
  g.gain.setValueAtTime(cfg.gain, ac.currentTime);
  src.start();
}

function createPositionalSource(x, y) {
  const ac = ctx();
  const panner = ac.createPanner();
  panner.panningModel  = 'HRTF';
  panner.distanceModel = 'inverse';
  panner.refDistance   = 120;
  panner.maxDistance   = 600;
  panner.rolloffFactor = 1.2;
  if (panner.positionX) {
    panner.positionX.value = x; panner.positionY.value = 0; panner.positionZ.value = y;
  } else {
    panner.setPosition(x, 0, y);
  }
  panner.connect(ac.destination);
  return panner;
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
    osc(c.freq1, 'sine', c.dur1, c.gain1, c.freqEnd1, null, true);
    osc(c.freq2, 'sine', c.dur2, c.gain2, c.freqEnd2, null, true);
    const src = ac.createBufferSource();
    const g = ac.createGain();
    src.buffer = noiseBuffer(ac, c.clickDur);
    src.connect(g); g.connect(ac.destination);
    g.gain.value = c.clickGain; src.start();
  } catch (_) {}
}

// ─── Enemy / alert sounds ─────────────────────────────────────────────────────
export function updateListener(px, py) {
  try {
    const ac = ctx();
    const l = ac.listener;
    if (!_listenerInitialized) {
      if (l.forwardX) {
        l.forwardX.value = 0; l.forwardY.value = 0; l.forwardZ.value = 1;
        l.upX.value = 0;      l.upY.value = 1;      l.upZ.value = 0;
      } else { l.setOrientation(0, 0, 1, 0, 1, 0); }
      _listenerInitialized = true;
    }
    if (l.positionX) {
      l.positionX.value = px; l.positionY.value = 0; l.positionZ.value = py;
    } else { l.setPosition(px, 0, py); }
  } catch (_) {}
}

export function playAlert(x, y) {
  try {
    const c = SOUND_CONFIG.alert;
    const dest = (x != null && y != null) ? createPositionalSource(x, y) : ctx().destination;
    osc(c.freq1, 'square', c.duration, c.gain, c.freqEnd1, dest);
    setTimeout(() => { try { osc(c.freq2, 'square', c.duration, c.gain, c.freqEnd2, dest); } catch (_) {} }, c.delay);
  } catch (_) {}
}

export function playSentryAlert(x, y) {
  try {
    const c = SOUND_CONFIG.sentryAlert;
    const dest = (x != null && y != null) ? createPositionalSource(x, y) : ctx().destination;
    osc(c.freq1, 'square', c.duration, c.gain, c.freqEnd1, dest);
    setTimeout(() => { try { osc(c.freq2, 'square', c.duration, c.gain, c.freqEnd2, dest); } catch (_) {} }, c.delay);
  } catch (_) {}
}

export function playEnemyFootstep(x, y) {
  try {
    const ac = ctx();
    noiseNode(ac, SOUND_CONFIG.enemyFootstep, createPositionalSource(x, y));
  } catch (_) {}
}

export function playEnemyFootstepHunting(x, y) {
  try {
    const ac = ctx();
    noiseNode(ac, SOUND_CONFIG.enemyFootstepHunting, createPositionalSource(x, y));
  } catch (_) {}
}

export function playBlindStalkerBreathing(x, y) {
  try {
    const c = SOUND_CONFIG.blindStalkerBreath;
    osc(c.freq, 'triangle', c.duration, c.gain, c.freqEnd, createPositionalSource(x, y));
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

export function playHazardPulse(x, y, volume = 1) {
  if (volume <= 0.01) return;
  try {
    const c = SOUND_CONFIG.hazardPulse;
    const dest = (x != null && y != null) ? createPositionalSource(x, y) : ctx().destination;
    osc(c.freq, 'triangle', c.duration, c.gain * volume, c.freqEnd, dest);
  } catch (_) {}
}

export function playCollapse() {
  try {
    const c = SOUND_CONFIG.collapse;
    const ac = ctx();
    osc(c.freq, 'sine', c.duration, c.gain, c.freqEnd, null, true);
    const src = ac.createBufferSource();
    const g = ac.createGain();
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = c.noiseFilterFreq;
    src.buffer = noiseBuffer(ac, c.noiseDuration);
    src.connect(filter); filter.connect(g); g.connect(ac.destination);
    addReverb(g);
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

// ─── Environmental sounds ─────────────────────────────────────────────────────
function playDrip() {
  if (!_envActive) return;
  try {
    const ac = ctx();
    const c = SOUND_CONFIG.environmental.drip;
    const src = ac.createBufferSource();
    const g = ac.createGain();
    const filter = ac.createBiquadFilter();
    const panner = ac.createStereoPanner();
    filter.type = 'bandpass'; filter.frequency.value = c.filterFreq;
    panner.pan.value = (Math.random() * 2 - 1);
    src.buffer = noiseBuffer(ac, c.duration);
    src.connect(filter); filter.connect(g); g.connect(panner); panner.connect(ac.destination);
    g.gain.setValueAtTime(c.gain, ac.currentTime);
    src.start();
  } catch (_) {}
  if (!_envActive) return;
  const next = c => c.minInterval + Math.random() * (c.maxInterval - c.minInterval);
  const cfg = SOUND_CONFIG.environmental.drip;
  _envTimers.push(setTimeout(playDrip, next(cfg)));
}

function playRumble() {
  if (!_envActive) return;
  try {
    const ac = ctx();
    const c = SOUND_CONFIG.environmental.rumble;
    const src = ac.createBufferSource();
    const g = ac.createGain();
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = c.filterFreq;
    src.buffer = noiseBuffer(ac, c.duration);
    src.connect(filter); filter.connect(g); g.connect(ac.destination);
    g.gain.setValueAtTime(c.gain, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + c.duration);
    src.start();
  } catch (_) {}
  if (!_envActive) return;
  const next = c => c.minInterval + Math.random() * (c.maxInterval - c.minInterval);
  const cfg = SOUND_CONFIG.environmental.rumble;
  _envTimers.push(setTimeout(playRumble, next(cfg)));
}

function playCreak() {
  if (!_envActive) return;
  try {
    const ac = ctx();
    const c = SOUND_CONFIG.environmental.creak;
    const src = ac.createBufferSource();
    const g = ac.createGain();
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = c.filterFreq; filter.Q.value = c.filterQ;
    src.buffer = noiseBuffer(ac, c.duration);
    src.connect(filter); filter.connect(g); g.connect(ac.destination);
    g.gain.setValueAtTime(c.gain, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + c.duration);
    src.start();
  } catch (_) {}
  if (!_envActive) return;
  const next = c => c.minInterval + Math.random() * (c.maxInterval - c.minInterval);
  const cfg = SOUND_CONFIG.environmental.creak;
  _envTimers.push(setTimeout(playCreak, next(cfg)));
}

export function setReverbSize(size) {
  _pendingReverbSize = size;
  if (_convolver) {
    const ac = ctx();
    const sizes = { small: [1.2, 0.4], medium: [2.0, 0.7], large: [3.5, 1.2] };
    const [dur, dec] = sizes[size] ?? sizes.medium;
    _convolver.buffer = createImpulseResponse(ac, dur, dec);
  }
}

export function startEnvironmental() {
  if (_envActive) return;
  _envActive = true;
  const rand = (min, max) => min + Math.random() * (max - min);
  const { drip, rumble, creak } = SOUND_CONFIG.environmental;
  _envTimers.push(setTimeout(playDrip,   rand(drip.minInterval,   drip.maxInterval)));
  _envTimers.push(setTimeout(playRumble, rand(rumble.minInterval, rumble.maxInterval)));
  _envTimers.push(setTimeout(playCreak,  rand(creak.minInterval,  creak.maxInterval)));
}

export function stopEnvironmental() {
  _envActive = false;
  for (const id of _envTimers) clearTimeout(id);
  _envTimers = [];
}

// ─── Ambient drone ────────────────────────────────────────────────────────────
export function startAmbient() {
  try {
    if (_ambientNode) return;
    const ac = ctx();
    initReverb();
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

export function playPulseReady() {
  try {
    const c = SOUND_CONFIG.pulseReady;
    osc(c.freq, 'sine', c.duration, c.gain);
  } catch (_) {}
}

export function setDangerLevel(t) {
  try {
    if (!_ambientGain) return;
    const ac = ctx();
    _ambientGain.gain.setTargetAtTime(0.035 + t * 0.05, ac.currentTime, 0.1);
  } catch (_) {}
}

export function resume() {
  ctx();
}
