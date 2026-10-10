import numpy as np, subprocess, wave, sys
import render as R
from render import W, CUTS, BEHIND, DUR, RANGES, SPEECH_DUR, OUTRO_T0

SR = 44100
SRC = R.SRC
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", SRC, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], capture_output=True).stdout
a = np.frombuffer(raw, np.float32).reshape(-1, 2)

# ---- voice cut with micro crossfades
FADE = int(0.012 * SR)
N = int(DUR * SR) + SR
voice = np.zeros((N, 2), np.float32)
pos = 0
for s, e in RANGES:
    seg = a[int(s * SR):int(e * SR)].copy()
    ramp = np.linspace(0, 1, FADE)[:, None]
    seg[:FADE] *= ramp; seg[-FADE:] *= ramp[::-1]
    voice[pos:pos + len(seg)] += seg
    pos += len(seg)
def write(path, x):
    x = np.clip(x, -1, 1)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())
write("voice_cut.wav", voice[:int(DUR * SR)])
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", "voice_cut.wav", "-af",
                "highpass=f=85,afftdn=nf=-28,equalizer=f=250:t=q:w=1.2:g=-2,equalizer=f=3200:t=q:w=1.0:g=3,equalizer=f=9000:t=h:w=1:g=2,"
                "acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=4,loudnorm=I=-16:TP=-2:LRA=9",
                "-ar", str(SR), "-ac", "2", "voice_proc.wav"], check=True)
v = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", "voice_proc.wav", "-f", "f32le", "-"], capture_output=True).stdout, np.float32).reshape(-1, 2)
L = int(DUR * SR)
out = np.zeros((L, 2), np.float32)
out[:min(L, len(v))] += v[:L]

rng = np.random.default_rng(1)
def t_(n): return np.arange(n) / SR
def add(x, t0, g=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= L: return
    x = x[:L - i]
    if x.ndim == 1: x = np.stack([x * (1 - max(0, pan)), x * (1 + min(0, pan))], 1)
    out[i:i + len(x)] += x * g

def lp(x, a_):  # one-pole lowpass with per-sample coefficient array or scalar
    y = np.empty_like(x); acc = 0.0
    a_ = np.broadcast_to(a_, x.shape)
    for i in range(len(x)):
        acc += a_[i] * (x[i] - acc); y[i] = acc
    return y

def whoosh(d=0.45, up=True):
    n = int(d * SR); tt = t_(n)
    noise = rng.normal(0, 1, n).astype(np.float32)
    k = np.linspace(0.02, 0.35, n) if up else np.linspace(0.35, 0.02, n)
    y = lp(noise, k) - lp(noise, k * 0.15)
    env_ = np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 2
    return (y * env_ * 0.6).astype(np.float32)

def pop(f0=900):
    n = int(0.09 * SR); tt = t_(n)
    f = f0 * np.exp(-tt * 25) + 220
    ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) * np.exp(-tt * 45) * 0.7).astype(np.float32)

def impact():
    n = int(0.9 * SR); tt = t_(n)
    f = 55 + 90 * np.exp(-tt * 18)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-tt * 5.5)
    nz = rng.normal(0, 1, n) * np.exp(-tt * 30) * 0.35
    return np.tanh((body + nz) * 1.6).astype(np.float32) * 0.8

def tick():
    n = int(0.03 * SR); tt = t_(n)
    return (np.sin(2 * np.pi * 2400 * tt) * np.exp(-tt * 260) * 0.6).astype(np.float32)

def glitch(d=0.45):
    n = int(d * SR)
    x = rng.normal(0, 1, n).astype(np.float32)
    step = rng.integers(20, 200)
    x = np.repeat(x[::step], step)[:n]
    gate = (np.sin(2 * np.pi * 22 * t_(n)) > 0).astype(np.float32)
    return x * gate * 0.25 * np.exp(-t_(n) * 3)

# ---- SFX placement
for a_, b_ in BEHIND:
    add(whoosh(0.5), max(0, a_ - 0.35), 0.35, pan=-0.2)
for c in [CUTS[5], CUTS[9], CUTS[15], CUTS[23], CUTS[27]]:
    add(whoosh(0.3), c - 0.15, 0.25, pan=0.2)
for ti in [W(43), W(105), W(129), W(36), W(21), 0.02]:
    add(impact(), ti - 0.02, 0.32)
pops = [W(14), W(18), W(22), W(24), W(28), W(30), W(35), W(38), W(46), W(45), W(60), W(66), W(70), W(82), W(89), W(94), W(96),
        W(109), W(117), W(137), W(140), W(147), W(152), 0.25]
for i, ti in enumerate(pops):
    add(pop(700 + (i % 4) * 180), ti - 0.08, 0.22, pan=(-0.3 if i % 2 else 0.3))
for ti in [W(73), W(75), W(78), W(154), W(141) + 0.8]:
    add(tick(), ti, 0.4)
add(glitch(), W(54), 0.35)
for k, ti in enumerate([0.35, 0.5, 0.65, 0.8]):
    add(pop(800 + k * 120), OUTRO_T0 + ti, 0.22)
add(whoosh(0.7), OUTRO_T0 - 0.1, 0.35)

# ---- music bed (100 bpm minimal groove)
if "--nomusic" not in sys.argv:
    bpm = 100; beat = 60 / bpm
    mus = np.zeros((L, 2), np.float32)
    def put(x, t0, g, pan=0):
        i = int(t0 * SR)
        if i >= L: return
        x = x[:L - i]
        mus[i:i + len(x), 0] += x * g * (1 - max(0, pan)); mus[i:i + len(x), 1] += x * g * (1 + min(0, pan))
    def kick():
        n = int(0.35 * SR); tt = t_(n); f = 48 + 110 * np.exp(-tt * 30)
        return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9)).astype(np.float32)
    def hat():
        n = int(0.05 * SR); x = rng.normal(0, 1, n).astype(np.float32)
        x = x - lp(x, 0.6); return x * np.exp(-t_(n) * 90)
    def clap():
        n = int(0.18 * SR); x = rng.normal(0, 1, n).astype(np.float32)
        x = lp(x, 0.4) - lp(x, 0.05); e = np.exp(-t_(n) * 22)
        return x * e
    roots = [57, 53, 48, 55]  # A F C G (midi)
    chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
    def mtof(m): return 440 * 2 ** ((m - 69) / 12)
    def pad(notes, d):
        n = int(d * SR); tt = t_(n); y = np.zeros(n, np.float32)
        for m in notes:
            for det in (-0.08, 0.08):
                f = mtof(m + 12) * (1 + det / 100)
                y += (2 * ((tt * f) % 1) - 1).astype(np.float32)
        y = lp(y, 0.035)
        env_ = np.minimum(1, tt / 0.4) * np.minimum(1, (d - tt) / 0.4)
        return y * env_ * 0.12
    def bass(m, d):
        n = int(d * SR); tt = t_(n); f = mtof(m - 12)
        y = np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt)
        return (y * np.minimum(1, tt / 0.01) * np.exp(-tt * 1.8)).astype(np.float32)
    bar = 4 * beat
    nb = int(DUR / bar) + 2
    for b in range(nb):
        t0 = b * bar
        ci = b % 4
        put(pad(chords[ci], bar), t0, 0.5)
        for q in range(4):
            tq = t0 + q * beat
            put(kick(), tq, 0.55 if q % 2 == 0 else 0.0)
            if q % 2 == 1: put(clap(), tq, 0.18)
            put(hat(), tq + beat / 2, 0.16, pan=0.3)
            put(hat(), tq, 0.07, pan=-0.3)
        put(bass(roots[ci], beat * 1.5), t0, 0.32); put(bass(roots[ci], beat * 0.5), t0 + beat * 1.5, 0.25)
        put(bass(roots[ci], beat * 1.5), t0 + beat * 2, 0.3); put(bass(roots[ci] + 7, beat), t0 + beat * 3, 0.22)
    # sidechain duck under voice
    vv = np.abs(out[:, 0]) if False else np.abs(v[:L, 0]) if len(v) >= L else np.pad(np.abs(v[:, 0]), (0, L - len(v)))
    hop = 441
    envv = np.array([vv[i:i + hop].max() for i in range(0, L, hop)])
    envv = np.convolve(envv, np.ones(15) / 15, mode="same")
    duck = 1 - 0.55 * np.clip(envv / 0.25, 0, 1)
    duck = np.repeat(duck, hop)[:L]
    mus *= duck[:, None]
    # fade in / out
    fi = np.minimum(1, t_(L) / 1.0); fo = np.clip((DUR - t_(L)) / 1.2, 0, 1)
    # outro: music up
    up = 1 + 0.8 * np.clip((t_(L) - OUTRO_T0) / 0.6, 0, 1)
    mus *= (fi * fo * up)[:, None]
    out += mus * 0.16

write("mix_pre.wav", out)
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", "mix_pre.wav", "-af", "loudnorm=I=-14:TP=-1.0:LRA=9", "-ar", "48000", "final_audio.wav"], check=True)
print("audio ok", DUR)
