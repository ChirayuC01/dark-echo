let _ctx = null;

function ctx() {
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

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

export function playFootstep() {
  try {
    const ac = ctx();
    // Soft, low thud — feels like footfall on stone
    const buf = ac.createBuffer(1, ac.sampleRate * 0.06, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
    }
    const src = ac.createBufferSource();
    const g = ac.createGain();
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 180;
    src.buffer = buf;
    src.connect(filter); filter.connect(g); g.connect(ac.destination);
    g.gain.setValueAtTime(0.18, ac.currentTime);
    src.start();
  } catch (_) {}
}

export function playPulse() {
  try {
    const ac = ctx();
    // Deep resonant boom
    osc(90, 'sine', 0.55, 0.5, 28);
    osc(55, 'sine', 0.7, 0.3, 22);
    // Click attack
    const buf = ac.createBuffer(1, ac.sampleRate * 0.02, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2) * 0.6;
    }
    const src = ac.createBufferSource();
    const g = ac.createGain();
    src.buffer = buf; src.connect(g); g.connect(ac.destination);
    g.gain.value = 0.6; src.start();
  } catch (_) {}
}

export function playAlert() {
  try {
    osc(680, 'square', 0.12, 0.06, 720);
    setTimeout(() => osc(780, 'square', 0.12, 0.06, 820), 140);
  } catch (_) {}
}

export function playDeath() {
  try {
    osc(220, 'sawtooth', 0.8, 0.3, 55);
    osc(330, 'sawtooth', 0.6, 0.2, 44);
    setTimeout(() => osc(110, 'sine', 1.2, 0.25, 40), 100);
  } catch (_) {}
}

export function playLevelComplete() {
  try {
    [0, 120, 240, 400].forEach((delay, i) => {
      setTimeout(() => osc([523, 659, 784, 1047][i], 'sine', 0.4, 0.18), delay);
    });
  } catch (_) {}
}

export function playHazardPulse(volume = 1) {
  if (volume <= 0.01) return;
  try {
    osc(420, 'triangle', 0.18, 0.08 * volume, 400);
  } catch (_) {}
}

export function resume() {
  ctx();
}
