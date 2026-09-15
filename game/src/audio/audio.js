/**
 * Everything you hear is synthesised at runtime: a three-oscillator engine
 * driven by RPM, filtered noise for tyres and wind, and short transients for
 * impacts and checkpoints. No audio files to download.
 */
export class GameAudio {
  constructor() {
    this.ready = false;
    this.muted = false;
    this.ctx = null;
  }

  start() {
    if (this.ready) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();
    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(ctx.destination);

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 7;
    comp.connect(this.master);
    this.bus = comp;

    // ---- engine ----
    this.engineGain = ctx.createGain();
    this.engineGain.gain.value = 0;
    this.engineFilter = ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 900;
    this.engineFilter.Q.value = 3.5;
    const shaper = ctx.createWaveShaper();
    shaper.curve = distortionCurve(28);
    shaper.oversample = '2x';
    this.engineFilter.connect(shaper);
    shaper.connect(this.engineGain);
    this.engineGain.connect(this.bus);

    this.oscs = [];
    for (const [type, detune, gain] of [['sawtooth', 0, 0.5], ['sawtooth', 11, 0.34], ['square', -7, 0.2], ['sine', 0, 0.55]]) {
      const o = ctx.createOscillator();
      o.type = type;
      o.detune.value = detune;
      const g = ctx.createGain();
      g.gain.value = gain;
      o.connect(g);
      g.connect(this.engineFilter);
      o.start();
      this.oscs.push({ o, g, sub: type === 'sine' });
    }

    // ---- noise sources ----
    this.noiseBuf = whiteNoise(ctx, 2.2);
    this.tyre = noiseVoice(ctx, this.bus, 'bandpass', 1800, 6, this.noiseBuf);
    this.wind = noiseVoice(ctx, this.bus, 'lowpass', 520, 0.8, this.noiseBuf);
    this.boost = noiseVoice(ctx, this.bus, 'bandpass', 700, 2.2, this.noiseBuf);

    this.ready = true;
  }

  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
  setMuted(m) { this.muted = m; if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.05); }

  /** Called every frame with the bike state. */
  update(dt, bike, paused) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    const k = 0.05;
    if (paused) {
      this.engineGain.gain.setTargetAtTime(0, t, 0.08);
      this.tyre.gain.gain.setTargetAtTime(0, t, 0.08);
      this.wind.gain.gain.setTargetAtTime(0, t, 0.08);
      this.boost.gain.gain.setTargetAtTime(0, t, 0.08);
      return;
    }
    const rpm = bike.rpm;
    const base = 44 + rpm * 118;           // fundamental, Hz
    for (const { o, sub } of this.oscs) {
      o.frequency.setTargetAtTime(sub ? base * 0.5 : base * (1 + (o.detune.value / 1200)), t, 0.03);
    }
    const load = Math.min(1, 0.25 + rpm * 0.9);
    this.engineFilter.frequency.setTargetAtTime(420 + rpm * 2600 + (bike.boosting ? 900 : 0), t, 0.05);
    this.engineGain.gain.setTargetAtTime(0.11 + load * 0.15, t, k);

    const slide = Math.min(1, Math.abs(bike.slip) * 2.6 * (bike.speed > 6 ? 1 : 0));
    this.tyre.filter.frequency.setTargetAtTime(1500 + slide * 2200, t, 0.05);
    this.tyre.gain.gain.setTargetAtTime(slide * 0.3, t, 0.06);

    this.wind.gain.gain.setTargetAtTime(Math.pow(bike.speed01, 1.7) * 0.22, t, 0.1);
    this.wind.filter.frequency.setTargetAtTime(380 + bike.speed01 * 1500, t, 0.1);

    this.boost.gain.gain.setTargetAtTime(bike.boosting ? 0.16 : 0, t, 0.08);
    this.boost.filter.frequency.setTargetAtTime(bike.boosting ? 1400 : 600, t, 0.12);
  }

  crash(power) {
    if (!this.ready || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(2600, t);
    f.frequency.exponentialRampToValueAtTime(180, t + 0.32);
    const g = ctx.createGain();
    g.gain.setValueAtTime(Math.min(0.6, 0.18 + power * 0.5), t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + 0.42);
    src.connect(f); f.connect(g); g.connect(this.bus);
    src.start(t); src.stop(t + 0.5);
    this.thud(power);
  }

  thud(power) {
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.25);
    const g = ctx.createGain();
    g.gain.setValueAtTime(Math.min(0.55, 0.2 + power * 0.45), t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g); g.connect(this.bus);
    o.start(t); o.stop(t + 0.32);
  }

  land(power) { if (this.ready && !this.muted) this.thud(power * 0.8); }

  beep(freq = 880, dur = 0.12, type = 'triangle', vol = 0.22) {
    if (!this.ready || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    o.connect(g); g.connect(this.bus);
    o.start(t); o.stop(t + dur + 0.02);
  }

  checkpoint(index = 0) {
    this.beep(740 + index * 40, 0.1, 'triangle', 0.2);
    setTimeout(() => this.beep(1180 + index * 50, 0.16, 'triangle', 0.18), 90);
  }
  fanfare() {
    [0, 120, 240, 420].forEach((ms, i) => setTimeout(() => this.beep([660, 880, 990, 1320][i], 0.22, 'triangle', 0.2), ms));
  }
  fail() {
    [0, 180].forEach((ms, i) => setTimeout(() => this.beep([320, 200][i], 0.35, 'sawtooth', 0.16), ms));
  }
}

function whiteNoise(ctx, seconds) {
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function noiseVoice(ctx, dest, type, freq, q, buf) {
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  src.connect(filter); filter.connect(gain); gain.connect(dest);
  src.start();
  return { src, filter, gain };
}

function distortionCurve(amount) {
  const n = 1024, curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / n) * 2 - 1;
    curve[i] = ((3 + amount) * x * 20 * Math.PI / 180) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}
