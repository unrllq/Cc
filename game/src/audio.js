// Синтезированный звук: турбина, ветер, форсаж, бипы колец. Без внешних файлов.
export function createAudio() {
  let ctx = null, on = true;
  const nodes = {};

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();

    const master = ctx.createGain();
    master.gain.value = 0.32;
    master.connect(ctx.destination);

    // турбина: две расстроенные пилы через lowpass
    const engine = ctx.createGain(); engine.gain.value = 0;
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 900; filt.Q.value = 6;
    const o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 70;
    const o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.value = 71.5;
    o1.connect(engine); o2.connect(engine);
    engine.connect(filt); filt.connect(master);
    o1.start(); o2.start();

    // ветер: розовый-ish шум
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.2;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf; noise.loop = true;
    const nGain = ctx.createGain(); nGain.gain.value = 0;
    const nFilt = ctx.createBiquadFilter();
    nFilt.type = 'bandpass'; nFilt.frequency.value = 700; nFilt.Q.value = 0.6;
    noise.connect(nFilt); nFilt.connect(nGain); nGain.connect(master);
    noise.start();

    Object.assign(nodes, { master, engine, filt, o1, o2, nGain, nFilt });
  }

  function update(speed01, boost) {
    if (!ctx || !on) return;
    const t = ctx.currentTime;
    const f = 58 + speed01 * 190 + boost * 90;
    nodes.o1.frequency.setTargetAtTime(f, t, 0.08);
    nodes.o2.frequency.setTargetAtTime(f * 1.5 + 2, t, 0.08);
    nodes.engine.gain.setTargetAtTime(0.06 + speed01 * 0.14 + boost * 0.1, t, 0.12);
    nodes.filt.frequency.setTargetAtTime(600 + speed01 * 2600 + boost * 1800, t, 0.1);
    nodes.nGain.gain.setTargetAtTime(speed01 * 0.16 + boost * 0.12, t, 0.2);
    nodes.nFilt.frequency.setTargetAtTime(500 + speed01 * 2200, t, 0.2);
  }

  function blip(freq = 880, dur = 0.16, type = 'triangle') {
    if (!ctx || !on) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g); g.connect(nodes.master);
    o.start(); o.stop(ctx.currentTime + dur + 0.02);
  }

  function crash() {
    if (!ctx || !on) return;
    const len = ctx.sampleRate * 0.6;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const g = ctx.createGain(); g.gain.value = 0.5;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1200;
    src.connect(f); f.connect(g); g.connect(nodes.master);
    src.start();
  }

  function setEnabled(v) {
    on = v;
    if (nodes.master) nodes.master.gain.value = v ? 0.32 : 0;
  }

  function resume() { ctx?.resume?.(); }

  return { init, update, blip, crash, setEnabled, resume };
}
