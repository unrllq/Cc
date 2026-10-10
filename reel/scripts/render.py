import json, sys, os, subprocess, math
import numpy as np, cv2
from lib import *

SRC = "/root/.claude/uploads/52c36dc1-8e89-5753-8257-49250abfdf30/ad6c55d0-telegram_video.mp4"
E = json.load(open("edl.json"))
RANGES, CUTS, WORDS = E["ranges"], E["cuts"], E["words"]
SPEECH_DUR = E["dur"]
OUTRO = 2.2
DUR = SPEECH_DUR + OUTRO
NF = int(round(DUR * FPS))
SW, SH = 464, 848
FACE = json.load(open("face.json"))

def W(i):  # output time of word i
    return WORDS[i]["os"]

# ------------------------------------------------------------------ source mapping
def src_time(t):
    o = 0
    for a, b in RANGES:
        d = b - a
        if t < o + d: return a + (t - o)
        o += d
    return min(RANGES[-1][1], 97.35)

def range_idx(t):
    o = 0
    for i, (a, b) in enumerate(RANGES):
        o += b - a
        if t < o: return i
    return len(RANGES) - 1

# face track smoothing
fx = np.array([f[0] for f in FACE]); fy = np.array([f[1] for f in FACE]); fw = np.array([f[2] for f in FACE])
k = cv2.getGaussianKernel(31, 8).ravel()
def smooth(a): return np.convolve(np.pad(a, 15, mode="edge"), k, mode="valid")
fxs, fys = smooth(fx), smooth(fy)

# ------------------------------------------------------------------ camera / shots
# zoom levels: W wide, M medium, C close
ZL = {"W": 1.0, "M": 1.26, "C": 1.55}
pattern = ["C", "W", "M", "C", "W", "M", "W", "C", "M"]
SHOTS = []
prev = None
pi = 0
for i, (a, b) in enumerate(RANGES):
    d = b - a
    tp = pattern[pi % len(pattern)]; pi += 1
    if tp == prev: tp = pattern[pi % len(pattern)]; pi += 1
    if d < 0.7 and tp == "C": tp = "M"
    if tp == prev: tp = "W" if prev != "W" else "M"
    SHOTS.append(tp); prev = tp
SHOTS[0] = "C"

# accent punch-ins: word index -> extra zoom
PUNCH = {9: .12, 18: .16, 28: .10, 48: .08, 75: .1, 110: .14, 119: .12, 142: .1, 154: .12, 73: .08}
# per-shot center (median face)
def shot_center(i):
    a, b = RANGES[i]
    i0, i1 = int(a * 30), max(int(a * 30) + 1, int(b * 30))
    return float(np.median(fx[i0:i1])), float(np.median(fy[i0:i1]))
CENT = [shot_center(i) for i in range(len(RANGES))]

BEHIND = None
def behind_w(t):
    w = 0.0
    for a, b in BEHIND:
        if a - 0.3 <= t <= b + 0.25:
            k1 = e_in_out((t - (a - 0.3)) / 0.35)
            k2 = e_in_out((b + 0.25 - t) / 0.3)
            w = max(w, min(k1, k2))
    return w

def camera(t):
    z, cx, cy = camera0(t)
    w = behind_w(t)
    if w > 0:
        lt = 0
        for a, b in BEHIND:
            if a - 0.3 <= t <= b + 0.25: lt = t - a
        zt = 1.0 + 0.025 * max(lt, 0)
        vw, vh = SW / zt, (SW * OH / OW) / zt
        cxt = clamp(SW / 2, vw / 2, SW - vw / 2); cyt = clamp(SH / 2, vh / 2, SH - vh / 2)
        z, cx, cy = lerp(z, zt, w), lerp(cx, cxt, w), lerp(cy, cyt, w)
        vw, vh = SW / z, (SW * OH / OW) / z
        cx = clamp(cx, vw / 2, SW - vw / 2); cy = clamp(cy, vh / 2, SH - vh / 2)
    return z, cx, cy

def camera0(t):
    """returns zoom, cx, cy (in source px)"""
    t = min(t, SPEECH_DUR - 0.01)
    ri = range_idx(t)
    t0 = CUTS[ri]
    tp = SHOTS[ri]
    z = ZL[tp]
    lt = t - t0
    # opening: zoom out from tight
    if ri == 0:
        z = lerp(1.95, 1.5, e_out_expo(lt / 0.9))
    # gentle push within shot
    z *= 1 + 0.018 * lt
    # punches
    for wi, dz in PUNCH.items():
        tw = W(wi)
        if CUTS[ri] <= tw and tw <= t:
            z += dz * e_out_expo((t - tw) / 0.22)
    st = src_time(t); si = min(int(st * 30), len(fx) - 1)
    cxm, cym = CENT[ri]
    cx = cxm + (fxs[si] - cxm) * 0.6
    cy = cym + (fys[si] - cym) * 0.6
    vw, vh = SW / z, (SW * OH / OW) / z
    if tp == "W" and ri != 0: cx = SW / 2 + (cx - SW / 2) * 0.3
    cy = cy + (0.5 - 0.40) * vh
    cx = clamp(cx, vw / 2, SW - vw / 2)
    cy = clamp(cy, vh / 2, SH - vh / 2)
    return z, cx, cy

# camera shake impulses (time, strength)
SHAKES = [(W(18), 10), (W(36), 12), (W(43), 14), (W(105), 16), (W(129), 10), (W(54), 8), (W(150), 10)]
def shake(t):
    dx = dy = 0
    for ts, s in SHAKES:
        if 0 <= t - ts < 0.35:
            k_ = (1 - (t - ts) / 0.35) ** 2
            dx += s * k_ * math.sin((t - ts) * 95)
            dy += s * k_ * math.cos((t - ts) * 77)
    return dx, dy

# ------------------------------------------------------------------ grade LUT
x = np.arange(256) / 255.0
curve = np.clip(x + 0.10 * np.sin((x - 0.5) * 2 * np.pi) * -0.5 * 0 + 0.0, 0, 1)
s_curve = 0.5 + (x - 0.5) * 1.12 + 0.06 * np.sin(2 * np.pi * (x - 0.5)) * -1
s_curve = np.clip(s_curve, 0, 1)
LUT_B = np.clip((s_curve * 1.02 + 0.01) * 255, 0, 255).astype(np.uint8)
LUT_G = np.clip(s_curve * 255, 0, 255).astype(np.uint8)
LUT_R = np.clip((s_curve * 1.0) * 255, 0, 255).astype(np.uint8)

def grade(fr):  # BGR uint8
    fr = cv2.merge([cv2.LUT(fr[..., 0], LUT_B), cv2.LUT(fr[..., 1], LUT_G), cv2.LUT(fr[..., 2], LUT_R)])
    hsv = cv2.cvtColor(fr, cv2.COLOR_BGR2HSV)
    hsv[..., 1] = np.clip(hsv[..., 1].astype(np.int16) * 118 // 100, 0, 255).astype(np.uint8)
    return cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)

VIG = None
def vignette():
    global VIG
    if VIG is None:
        yy, xx = np.mgrid[0:OH, 0:OW].astype(np.float32)
        r = np.sqrt(((xx - OW / 2) / (OW * 0.75)) ** 2 + ((yy - OH / 2) / (OH * 0.72)) ** 2)
        VIG = (1 - 0.38 * np.clip(r - 0.35, 0, 1) ** 1.6)[..., None].astype(np.float32)
    return VIG

GRAIN = [np.random.default_rng(i).normal(0, 5.0, (OH // 2, OW // 2)).astype(np.float32) for i in range(6)]

# ------------------------------------------------------------------ subtitle grouping
KEY = {15, 18, 21, 22, 24, 28, 30, 36, 39, 43, 48, 54, 63, 68, 73, 74, 75, 90, 96, 105, 109, 110, 118, 119, 129, 137, 140, 142, 150, 153, 165}
STARTS = [0,2,7,10,13,16,19,21,22,23,25,27,29,31,35,37,40,41,44,46,49,52,54,55,58,60,62,64,67,68,69,72,73,74,75,76,79,81,83,85,89,91,94,96,97,98,101,102,105,106,109,111,113,115,118,120,121,126,129,130,134,137,138,141,143,147,150,151,154,155,158,161,164,165,166,168,171]
def build_groups():
    out = []
    for gi, s0 in enumerate(STARTS):
        e0 = STARTS[gi + 1] if gi + 1 < len(STARTS) else len(WORDS)
        g = list(range(s0, e0))
        t0 = WORDS[g[0]]["os"] - 0.05
        t1 = WORDS[e0]["os"] - 0.05 if e0 < len(WORDS) else SPEECH_DUR
        t1 = min(t1, WORDS[g[-1]]["oe"] + 0.5)
        out.append((t0, t1, g))
    return out
GROUPS = build_groups()

SUB_Y = 1395
SUB_SIZE = 62
def draw_subs(cv, t):
    for t0, t1, g in GROUPS:
        if not (t0 <= t < t1): continue
        f = font(F_UNB9, SUB_SIZE)
        words = [WORDS[i]["w"].upper() for i in g]
        sp = f.getlength(" ") + 26
        ws = [f.getlength(w) for w in words]
        # line wrap
        lines = [[]]; lw = 0
        for j, w in enumerate(ws):
            if lines[-1] and lw + sp + w > 920:
                lines.append([]); lw = 0
            lw += (sp if lines[-1] else 0) + w; lines[-1].append(j)
        lh = SUB_SIZE * 1.32
        y0 = SUB_Y - (len(lines) - 1) * lh / 2
        gp = e_out_back((t - t0) / 0.22, 1.6)
        for li, line in enumerate(lines):
            tw = sum(ws[j] for j in line) + sp * (len(line) - 1)
            x = OW / 2 - tw / 2
            for j in line:
                wi = g[j]
                wt0 = WORDS[wi]["os"] - 0.04
                wt1 = WORDS[wi]["oe"] + 0.04
                nxt = WORDS[wi + 1]["os"] - 0.04 if wi + 1 < len(WORDS) else 999
                active = wt0 <= t < min(nxt, wt1 + 0.25)
                appeared = t >= wt0
                cxw = x + ws[j] / 2
                if appeared:
                    p = e_out_back((t - wt0) / 0.16, 2.2)
                    sc = lerp(0.55, 1.0, p) * lerp(0.9, 1, gp)
                    yy = y0 + li * lh + (1 - e_out_cubic((t - wt0) / 0.16)) * 22
                    if active:
                        comp(cv, _pspr(int(ws[j] + 34), int(SUB_SIZE * 1.28)), cxw, yy + 2, sc=sc * 1.0, rot=-2.0 if (wi % 2) else 2.0)
                        comp(cv, spr_text(words[j], F_UNB9, SUB_SIZE, BLACK), cxw, yy, sc=sc * 1.04, rot=-2.0 if (wi % 2) else 2.0)
                    else:
                        col = LIME if wi in KEY else WHITE
                        comp(cv, spr_text(words[j], F_UNB9, SUB_SIZE, col, 7, BLACK, shadow=(0, 6, (0, 0, 0, 160))), cxw, yy, sc=sc)
                else:
                    pass
                x += ws[j] + sp

@lru_cache(maxsize=256)
def _pspr(w, h):
    return pil_to_spr(rrect(w, h, 18, LIME + (255,)))


# ------------------------------------------------------------------ elements
BACK, FRONT = [], []
def el(layer, t0, t1):
    def deco(fn):
        layer.append((t0, t1, fn)); return fn
    return deco

def big_letters(cv, t, t0, t1, txt, fpath, y, width=1000, fill=LIME, stagger=0.045, outline=None, rot=0, x=OW / 2, size=None, drift=18):
    """letter-by-letter rise; returns nothing"""
    if not (t0 <= t < t1): return
    size = size or fit_size(txt, fpath, width)
    f = font(fpath, size)
    tw = f.getlength(txt)
    xs = x - tw / 2
    pin, pout = env(t, t0, t1, 0.5, 0.3)
    dr = (t - t0) * drift
    for i, ch in enumerate(txt):
        cw = f.getlength(ch)
        if ch == " ": xs += cw; continue
        p = e_out_expo((t - t0 - i * stagger) / 0.55)
        if p <= 0: xs += cw; continue
        po = e_in_cubic(1 - pout)
        yy = y + (1 - p) * size * 0.9 - po * size * 0.5
        sc = lerp(1.35, 1.0, p)
        a = clamp(p * 1.6) * (1 - po)
        if outline:
            comp(cv, spr_text(ch, fpath, size, outline, 4, outline, outline_only=True), xs + cw / 2 + 14 - dr * 0.4, yy + 14, sc=sc, alpha=a * 0.9, rot=rot)
        comp(cv, spr_text(ch, fpath, size, fill), xs + cw / 2 + dr * 0.2, yy, sc=sc, alpha=a, rot=rot)
        xs += cw

def marquee(cv, t, t0, t1, txt, fpath, size, y, speed, fill, outline=False, rot=0, alpha=1.0, stroke=4):
    if not (t0 <= t < t1): return
    pin, pout = env(t, t0, t1, 0.35, 0.3)
    spr = spr_text(txt, fpath, size, fill, stroke if outline else 0, fill, outline_only=outline)
    w = spr.shape[1]
    off = ((t - t0) * speed) % w
    a = alpha * e_out_cubic(pin) * e_out_cubic(pout)
    yy = y + (1 - e_out_expo(pin)) * 80
    for k_ in range(-2, 3):
        comp(cv, spr, OW / 2 + k_ * w - off, yy, rot=rot, alpha=a)

def ftext(d, xy, txt, fpath, maxw, maxsize, fill):
    sz = maxsize
    while font(fpath, sz).getlength(txt) > maxw and sz > 10: sz -= 2
    d.text(xy, txt, font=font(fpath, sz), fill=fill)
    return sz

def card(w, h, fill, label=None, label_col=BLACK, outline=None, r=34):
    im = rrect(w, h, r, fill + (255,), outline=(outline + (255,)) if outline else None, ow=4 if outline else 0)
    if label:
        d = ImageDraw.Draw(im)
        d.text((28, 22), label, font=font(F_MONO, 24), fill=label_col)
    return im

@lru_cache(maxsize=64)
def C_img(key):
    return pil_to_spr(drop_shadow(MAKERS[key]()))

def pop(cv, spr, t, t0, t1, x, y, rot=0, din=0.35, dout=0.25, sc=1.0, from_dx=0, from_dy=0, float_amp=6, spin=0):
    if not (t0 <= t < t1): return
    pin, pout = env(t, t0, t1, din, dout)
    s = e_out_back(pin, 2.0) * lerp(0.6, 1, e_in_out(pout)) * sc
    a = clamp(pin * 3) * e_in_out(pout)
    fl = math.sin((t - t0) * 2.4) * float_amp
    comp(cv, spr, x + from_dx * (1 - e_out_expo(pin)), y + from_dy * (1 - e_out_expo(pin)) + fl, sc=s, rot=rot + spin * (t - t0) + math.sin((t - t0) * 1.7) * 1.2, alpha=a)

def slide(cv, spr, t, t0, t1, x, y, dx=0, dy=0, rot=0, din=0.45, dout=0.3):
    if not (t0 <= t < t1): return
    pin, pout = env(t, t0, t1, din, dout)
    p = e_out_expo(pin); q = e_in_cubic(1 - pout)
    comp(cv, spr, x + dx * (1 - p) - dx * q * 0.6, y + dy * (1 - p) - dy * q * 0.6, rot=rot, alpha=clamp(pin * 2.5) * (1 - q))

# ---- makers (static card images) ----
def mk_role():
    im = card(470, 170, BLACK, "ROLE //  2026", LIME, outline=LIME)
    d = ImageDraw.Draw(im)
    d.text((28, 62), "SALES", font=font(F_UNB9, 70), fill=LIME)
    return im
def mk_tag():
    im = rrect(560, 78, 39, BLACK + (255,), outline=LIME + (255,), ow=3)
    d = ImageDraw.Draw(im)
    d.ellipse([28, 29, 48, 49], fill=(255, 59, 59))
    d.text((64, 18), "ОТКЛИК НА ВАКАНСИЮ", font=font(F_MONOB, 32), fill=LIME)
    return im
def mk_chance():
    im = rrect(470, 190, 95, PURPLE + (255,))
    d = ImageDraw.Draw(im)
    f = font(F_DELA, 112)
    tw = f.getlength("ШАНС")
    d.text(((470 - tw) / 2, 18), "ШАНС", font=f, fill=LIME)
    return im
def mk_pill(txt, bg, fg, f=F_UNB9, size=58, icon=None, padx=40):
    fo = font(f, size)
    tw = fo.getlength(txt)
    iw = 0
    if icon: iw = icon.size[0] + 22
    w = int(tw + 2 * padx + iw); h = int(size * 1.9)
    im = rrect(w, h, h // 2, bg + (255,))
    d = ImageDraw.Draw(im)
    asc, desc = fo.getmetrics()
    d.text((padx, (h - (asc + desc)) / 2 + 2), txt, font=fo, fill=fg)
    if icon: im.alpha_composite(icon, (int(padx + tw + 22), (h - icon.size[1]) // 2))
    return im
def mk_benefit():
    im = card(420, 300, ORANGE, "01 / ДЛЯ КОМПАНИИ", WHITE)
    d = ImageDraw.Draw(im)
    ftext(d, (28, 160), "ПОЛЬЗА", F_DELA, 364, 78, WHITE)
    im.alpha_composite(pix_img("heart", 7, WHITE), (300, 40))
    return im
def mk_feedback():
    im = card(420, 300, CREAM, "02 / ОБРАТНАЯ СВЯЗЬ", BLACK)
    d = ImageDraw.Draw(im)
    ftext(d, (28, 160), "ФИДБЭК", F_DELA, 364, 74, BLACK)
    d.rounded_rectangle([270, 50, 390, 120], 26, fill=PURPLE)
    d.polygon([(290, 118), (310, 118), (282, 140)], fill=PURPLE)
    for i in range(3): d.ellipse([292 + i * 30, 76, 308 + i * 30, 92], fill=LIME)
    return im
def mk_honest():
    R = 150
    im = Image.new("RGBA", (2 * R, 2 * R), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse([0, 0, 2 * R - 1, 2 * R - 1], fill=LIME)
    f = font(F_MONOB, 30)
    txt = "СКАЖУ ЧЕСТНО • СКАЖУ ЧЕСТНО • "
    n = len(txt)
    for i, ch in enumerate(txt):
        a = 2 * math.pi * i / n
        ci = Image.new("RGBA", (40, 40), (0, 0, 0, 0))
        ImageDraw.Draw(ci).text((20, 20), ch, font=f, fill=BLACK, anchor="mm")
        ci = ci.rotate(-math.degrees(a) - 90 + 180, resample=Image.BICUBIC)
        ci = ci.rotate(180)
        x_ = R + (R - 30) * math.cos(a - math.pi / 2); y_ = R + (R - 30) * math.sin(a - math.pi / 2)
        im.alpha_composite(ci, (int(x_ - 20), int(y_ - 20)))
    im.alpha_composite(pix_img("heart", 8, BLACK), (R - 44, R - 40))
    return im
def mk_check(items_done=0):
    pass
def mk_germany():
    im = card(660, 230, BLACK, "LOCATION //", WHITE, outline=WHITE)
    d = ImageDraw.Draw(im)
    im.alpha_composite(pix_img("pin", 9, BLACK, LIME), (26, 70))
    ftext(d, (150, 70), "ГЕРМАНИЯ", F_UNB9, 480, 62, WHITE)
    for i, c in enumerate([(20, 20, 20), (221, 0, 0), (255, 206, 0)]):
        d.rounded_rectangle([150 + i * 128, 160, 150 + i * 128 + 116, 190], 8, fill=c, outline=(80, 80, 80) if i == 0 else None, width=2)
    return im
def mk_newview():
    im = mk_pill("НОВЫЙ ВЗГЛЯД", CREAM, BLACK, F_UNB9, 52, icon=pix_img("eye", 7, BLACK, PURPLE))
    return im
def mk_yesno():
    im = card(620, 300, CREAM, "ВАШЕ РЕШЕНИЕ?", BLACK)
    return im
def mk_end_tile(kind):
    if kind == "lets":
        im = card(1000, 280, LIME, "NEXT STEP //", BLACK)
        d = ImageDraw.Draw(im)
        ftext(d, (28, 70), "НАЧНЁМ", F_DELA, 640, 92, BLACK)
        ftext(d, (28, 160), "ВМЕСТЕ?", F_DELA, 640, 92, BLACK)
        d.ellipse([760, 50, 960, 250], fill=BLACK)
        im.alpha_composite(pix_img("arrow", 14, LIME), (783, 101))
        return im
    if kind == "sales":
        im = card(470, 210, PURPLE, "ROLE //", WHITE)
        d = ImageDraw.Draw(im)
        ftext(d, (28, 80), "SALES", F_UNB9, 414, 88, LIME)
        return im
    if kind == "de":
        im = card(470, 210, BLACK, "BASED IN", WHITE, outline=WHITE)
        d = ImageDraw.Draw(im)
        d.text((28, 70), "DE  +", font=font(F_UNB9, 64), fill=WHITE)
        d.text((28, 148), "INTERNATIONAL", font=font(F_MONOB, 34), fill=LIME)
        return im
    if kind == "fb":
        im = card(470, 300, CREAM, "ЖДУ ОТ ВАС", BLACK)
        d = ImageDraw.Draw(im)
        ftext(d, (28, 130), "ФИДБЭК", F_DELA, 414, 84, BLACK)
        im.alpha_composite(pix_img("heart", 7, PINK, BLACK), (350, 30))
        return im

MAKERS = {
    "role": mk_role, "tag": mk_tag, "chance": mk_chance,
    "nonstop": lambda: mk_pill("БЕСПРЕРЫВНО", LIME, BLACK, icon=pix_img("arrow", 8, BLACK)),
    "consist": lambda: mk_pill("ПОСЛЕДОВАТЕЛЬНО", PURPLE, WHITE, size=52, icon=pix_img("arrow", 7, LIME)),
    "benefit": mk_benefit, "feedback": mk_feedback, "honest": mk_honest, "germany": mk_germany,
    "newview": mk_newview, "accept": lambda: mk_pill("ПРИНЯЛИ", GREEN, BLACK, size=50, icon=pix_img("check", 7, BLACK)),
    "reject": lambda: mk_pill("НЕ ПРИНЯЛИ", ORANGE, WHITE, size=50, icon=pix_img("cross", 6, WHITE)),
    "end_lets": lambda: mk_end_tile("lets"), "end_sales": lambda: mk_end_tile("sales"),
    "end_de": lambda: mk_end_tile("de"), "end_fb": lambda: mk_end_tile("fb"),
    "plus": lambda: pix_img("plus", 18, LIME, BLACK, outline=BLACK),
    "intl": lambda: mk_pill("МЕЖДУНАРОДНЫЙ РЫНОК", BLUE, WHITE, size=44),
}

@lru_cache(maxsize=8)
def BLOB(seed, tint=(1.0, 1.0, 1.0)):
    return chrome_blob(seed, 520, tint)

def float_blob(cv, t, t0, t1, seed, x, y, sc, tint=(1.0, 1.0, 1.0), rot0=0, from_dy=300):
    if not (t0 <= t < t1): return
    pin, pout = env(t, t0, t1, 0.7, 0.5)
    p = e_out_expo(pin)
    comp(cv, BLOB(seed, tint), x + math.sin((t - t0) * 1.3) * 14, y + (1 - p) * from_dy + math.cos((t - t0) * 1.1) * 18,
         sc=sc * lerp(0.4, 1, e_out_back(pin, 1.4)) * lerp(0.3, 1, e_in_out(pout)), rot=rot0 + (t - t0) * 9, alpha=clamp(pin * 2) * e_in_out(pout))

def pix_burst(cv, t, ts, name, x, y, col, n=7, cell=5, spread=260, dur=1.1, seed=0):
    if not (ts <= t < ts + dur): return
    rng = np.random.default_rng(seed)
    for i in range(n):
        ang = rng.uniform(0, 2 * math.pi); sp = rng.uniform(0.5, 1.0) * spread
        lt = (t - ts) / dur
        p = e_out_expo(lt * 1.3)
        comp(cv, spr_pix(name, cell, col, BLACK), x + math.cos(ang) * sp * p, y + math.sin(ang) * sp * p - 60 * lt,
             sc=lerp(0.3, 1.1, e_out_back(lt * 3)) * (1 - lt * 0.4), rot=rng.uniform(-25, 25) + lt * 40, alpha=1 - e_in_cubic(lt))

def burst_star(cv, t, t0, t1, x, y, R, col, seed=3, alpha=1.0):
    if not (t0 <= t < t1): return
    pin, pout = env(t, t0, t1, 0.3, 0.25)
    comp(cv, _burst(R, col, seed), x, y, sc=e_out_back(pin, 2.4) * e_in_out(pout), rot=(t - t0) * 25, alpha=alpha)

@lru_cache(maxsize=16)
def _burst(R, col, seed):
    return pil_to_spr(burst_img(R, col + (255,), seed=seed, outline=BLACK + (255,), ow=5))

# ---- dynamic drawn widgets (per-frame PIL) ----
def globe_spr(t, R=150, col=WHITE, bg=None):
    S = 2 * R + 20
    im = Image.new("RGBA", (S * 2, S * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = S; Rr = R * 2
    if bg: d.ellipse([c - Rr, c - Rr, c + Rr, c + Rr], fill=bg)
    lw = 6
    d.ellipse([c - Rr, c - Rr, c + Rr, c + Rr], outline=col, width=lw)
    for k_ in range(6):
        ph = (t * 0.6 + k_ * math.pi / 6) % math.pi
        rx = abs(math.cos(ph)) * Rr
        if rx > 4: d.ellipse([c - rx, c - Rr, c + rx, c + Rr], outline=col, width=lw)
    for lat in (-0.55, 0, 0.55):
        yy = c + lat * Rr; rx = math.sqrt(1 - lat * lat) * Rr
        d.line([c - rx, yy, c + rx, yy], fill=col, width=lw)
    im = im.resize((S, S), Image.LANCZOS)
    return pil_to_spr(im)

def chart_spr(p, w=420, h=320):
    im = card(w, h, BLACK, "PROFIT //", LIME, outline=LIME)
    d = ImageDraw.Draw(im)
    vals = [0.25, 0.42, 0.6, 0.92]
    bw = 62
    for i, v in enumerate(vals):
        pp = e_out_back(clamp(p * 1.6 - i * 0.22), 1.5)
        bh = v * 190 * pp
        x0 = 40 + i * (bw + 22)
        if bh > 2: d.rounded_rectangle([x0, h - 36 - bh, x0 + bw, h - 36], 10, fill=LIME if i == 3 else (90, 90, 90))
    if p > 0.7:
        a = clamp((p - 0.7) / 0.3)
        up = pix_img("up", 9, LIME, BLACK)
        im.alpha_composite(up, (330, int(40 + (1 - a) * 30)))
    return pil_to_spr(drop_shadow(im))

def counter_spr(p):
    im = card(470, 300, CREAM, "МИР ИЗМЕНИЛСЯ //", BLACK)
    d = ImageDraw.Draw(im)
    yr = int(round(lerp(2015, 2025, e_in_out(p))))
    d.text((28, 70), "10", font=font(F_DELA, 150), fill=BLACK)
    d.text((248, 98), "ЛЕТ", font=font(F_DELA, 64), fill=PURPLE)
    d.text((250, 178), f"2015-{yr}", font=font(F_MONOB, 32), fill=BLACK)
    d.rounded_rectangle([28, 262, 28 + 414 * e_in_out(p), 276], 7, fill=PURPLE)
    return pil_to_spr(drop_shadow(im))

def funnel_spr(p):
    w, h = 560, 420
    im = card(w, h, BLACK, "КАК РАБОТАЮТ ПРОДАЖИ //", WHITE, outline=WHITE)
    d = ImageDraw.Draw(im)
    rows = [("ВНИМАНИЕ", LIME, 480), ("ИНТЕРЕС", PURPLE, 380), ("ДОВЕРИЕ", ORANGE, 280), ("СДЕЛКА", WHITE, 190)]
    for i, (txt, c, ww) in enumerate(rows):
        pp = e_out_expo(clamp(p * 2.2 - i * 0.35))
        if pp <= 0: continue
        ww2 = ww * pp
        y0 = 78 + i * 80
        d.rounded_rectangle([w / 2 - ww2 / 2, y0, w / 2 + ww2 / 2, y0 + 64], 32, fill=c)
        if pp > 0.6:
            f = font(F_UNB9, 30); tw = f.getlength(txt)
            d.text((w / 2 - tw / 2, y0 + 14), txt, font=f, fill=BLACK if c != PURPLE else WHITE)
    return pil_to_spr(drop_shadow(im))

def target_spr(t):
    im = card(560, 300, PURPLE, "ЦЕЛЬ //", WHITE)
    d = ImageDraw.Draw(im)
    cx_, cy_ = 440, 160
    for i, r in enumerate([95, 68, 42, 16]):
        d.ellipse([cx_ - r, cy_ - r, cx_ + r, cy_ + r], fill=LIME if i % 2 == 0 else PURPLE, outline=BLACK, width=3)
    d.text((28, 120), "ЧТО", font=font(F_DELA, 52), fill=WHITE)
    d.text((28, 180), "НУЖНО", font=font(F_DELA, 52), fill=WHITE)
    d.text((28, 240), "КЛИЕНТУ?", font=font(F_MONOB, 30), fill=LIME)
    return pil_to_spr(drop_shadow(im))

def checklist_spr(t, marks):
    w, h = 900, 380
    im = card(w, h, CREAM, "ИЗ ЧЕГО СТРОИТСЯ ПОКУПКА //", BLACK)
    d = ImageDraw.Draw(im)
    items = ["ПОКУПАТЕЛЬНАЯ СПОСОБНОСТЬ", "МОТИВАЦИЯ", "И ТАК ДАЛЕЕ"]
    for i, txt in enumerate(items):
        y0 = 84 + i * 96
        m = marks[i]
        if m < 0: continue
        a = int(255 * clamp(m * 3))
        d.rounded_rectangle([28, y0, 100, y0 + 72], 16, fill=(BLACK if m > 0.25 else CREAM), outline=BLACK, width=4)
        if m > 0.25:
            ck = pix_img("check", 5, LIME)
            im.alpha_composite(ck, (34, y0 + 14))
        tt = txt
        if i == 2:
            n_ = int((t * 3) % 4)
            tt = "И ТАК ДАЛЕЕ" + "." * n_
        ftext(d, (124, y0 + 14), tt, F_UNB9, 740, 44, BLACK if i != 1 else PURPLE)
    return pil_to_spr(drop_shadow(im))

def clock_spr(t, p):
    w, h = 520, 250
    im = card(w, h, BLUE, "ВРЕМЯ ПОКАЖЕТ //", WHITE)
    d = ImageDraw.Draw(im)
    cx_, cy_, R = 400, 135, 82
    d.ellipse([cx_ - R, cy_ - R, cx_ + R, cy_ + R], fill=CREAM, outline=BLACK, width=5)
    for i in range(12):
        a = i * math.pi / 6
        d.line([cx_ + math.cos(a) * (R - 16), cy_ + math.sin(a) * (R - 16), cx_ + math.cos(a) * (R - 6), cy_ + math.sin(a) * (R - 6)], fill=BLACK, width=4)
    a1 = t * 5.0 - math.pi / 2; a2 = t * 0.6 - math.pi / 2
    d.line([cx_, cy_, cx_ + math.cos(a1) * (R - 18), cy_ + math.sin(a1) * (R - 18)], fill=ORANGE, width=7)
    d.line([cx_, cy_, cx_ + math.cos(a2) * (R - 38), cy_ + math.sin(a2) * (R - 38)], fill=BLACK, width=9)
    d.ellipse([cx_ - 9, cy_ - 9, cx_ + 9, cy_ + 9], fill=BLACK)
    ftext(d, (28, 76), "ВРЕМЯ", F_DELA, 270, 64, LIME)
    ftext(d, (28, 158), "ПОКАЖЕТ", F_DELA, 270, 60, WHITE)
    return pil_to_spr(drop_shadow(im))

def chat_spr(t, p):
    w, h = 600, 220
    im = Image.new("RGBA", (w + 40, h + 60), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w, h], 60, fill=LIME)
    d.polygon([(80, h - 4), (150, h - 4), (60, h + 50)], fill=LIME)
    d.text((44, 30), "ЖДУ ОТ ВАС", font=font(F_MONOB, 34), fill=BLACK)
    d.text((44, 82), "ФИДБЭК", font=font(F_DELA, 96), fill=BLACK)
    for i in range(3):
        ph = math.sin(t * 9 - i * 0.9) * 0.5 + 0.5
        d.ellipse([470 + i * 34 - 12, 50 - ph * 10 - 12, 470 + i * 34 + 12, 50 - ph * 10 + 12], fill=BLACK)
    return pil_to_spr(drop_shadow(im))

def agree_spr(t, click_p):
    w, h = 640, 290
    im = card(w, h, CREAM, "ВЫ СОГЛАСНЫ? //", BLACK)
    d = ImageDraw.Draw(im)
    yes_s = 1 + 0.08 * math.sin(clamp(click_p) * math.pi)
    bx0, by0, bx1, by1 = 28, 110, 330, 250
    cxb, cyb = (bx0 + bx1) / 2, (by0 + by1) / 2
    hw, hh = (bx1 - bx0) / 2 * yes_s, (by1 - by0) / 2 * yes_s
    d.rounded_rectangle([cxb - hw, cyb - hh, cxb + hw, cyb + hh], 70, fill=GREEN if click_p > 0.5 else BLACK)
    f = font(F_DELA, 74)
    d.text((cxb - f.getlength("ДА") / 2, cyb - 52), "ДА", font=f, fill=BLACK if click_p > 0.5 else LIME)
    d.rounded_rectangle([352, 110, 612, 250], 70, outline=BLACK, width=5)
    d.text((482 - font(F_DELA, 60).getlength("НЕТ") / 2, 138), "НЕТ", font=font(F_DELA, 60), fill=(150, 150, 150))
    return pil_to_spr(drop_shadow(im))


# ================================================================== TIMELINE
T_END = SPEECH_DUR
BEHIND = [(1.6, W(13) - 0.05), (W(21) - 0.1, W(25) - 0.1), (W(36) - 0.1, W(38) - 0.15), (W(43) - 0.12, W(45) - 0.3),
          (W(68) - 0.08, W(69) + 0.6), (W(90) - 0.1, W(93)), (W(96) - 0.1, W(98) + 0.4), (W(105) - 0.1, W(106) + 0.2),
          (W(129) - 0.1, W(133) + 0.2), (W(150) - 0.1, W(151) - 0.1), (W(165) - 0.1, W(167) - 0.1)]

def back_layer(cv, t):
    # 1 HOOK: ПОЧЕМУ / Я?
    big_letters(cv, t, 0.05, W(13) - 0.05, "ПОЧЕМУ", F_DELA, 230, 1000, LIME, outline=PURPLE)
    big_letters(cv, t, 0.35, W(13) - 0.05, "Я?", F_DELA, 520, 300, PURPLE, outline=LIME, x=880)
    # 2 ПРОДАЖИ marquee
    t0 = W(21) - 0.1; t1 = W(25) - 0.1
    marquee(cv, t, t0, t1, "ПРОДАЖИ • ПРОДАЖИ • ", F_DELA, 200, 230, 260, LIME)
    marquee(cv, t, t0 + 0.08, t1, "ПРОДАЖИ • ПРОДАЖИ • ", F_DELA, 200, 450, -220, PURPLE, outline=True, stroke=5)
    marquee(cv, t, t0 + 0.16, t1, "ПРОДАЖИ • ПРОДАЖИ • ", F_DELA, 200, 670, 300, LIME, outline=True, stroke=5)
    # 3 PROFIT
    big_letters(cv, t, W(36) - 0.1, W(38) - 0.15, "PROFIT", F_UNB9, 230, 1000, ORANGE, outline=LIME, stagger=0.03)
    # 4 ПРИЗВАНИЕ
    big_letters(cv, t, W(43) - 0.12, W(45) - 0.3, "ПРИЗВАНИЕ", F_DELA, 215, 1020, LIME, outline=PURPLE, stagger=0.03)
    marquee(cv, t, W(43) + 0.1, W(45) - 0.3, "ПРИЗВАНИЕ • ПРИЗВАНИЕ • ", F_DELA, 150, 430, -260, PURPLE, outline=True, stroke=4)
    # 5 КЛИЕНТ
    big_letters(cv, t, W(68) - 0.08, W(69) + 0.6, "КЛИЕНТ", F_DELA, 215, 1000, PURPLE, outline=LIME)
    # 6 ГЕРМАНИЯ marquee
    marquee(cv, t, W(90) - 0.1, W(93), "DEUTSCHLAND • ГЕРМАНИЯ • ", F_UNB9, 150, 240, 240, WHITE, outline=True, stroke=4)
    marquee(cv, t, W(90) - 0.0, W(93), "ГЕРМАНИЯ • DEUTSCHLAND • ", F_UNB9, 150, 450, -200, LIME)
    # 7 GLOBAL
    marquee(cv, t, W(96) - 0.1, W(98) + 0.4, "GLOBAL MARKET • ", F_UNB9, 170, 280, 330, LIME, outline=True, stroke=5)
    # 8 НЕЗАМЕНИМЫЙ
    big_letters(cv, t, W(105) - 0.1, W(106) + 0.2, "НЕЗАМЕНИМЫЙ", F_DELA, 215, 1020, LIME, outline=ORANGE, stagger=0.025)
    marquee(cv, t, W(105) + 0.0, W(106) + 0.2, "НЕЗАМЕНИМЫЙ • ", F_DELA, 150, 420, 300, ORANGE, outline=True, stroke=4)
    # 9 СПАСИБО
    big_letters(cv, t, W(129) - 0.1, W(133) + 0.2, "СПАСИБО", F_DELA, 215, 1010, PINK, outline=LIME, stagger=0.04)
    # 10 ФИДБЭК
    marquee(cv, t, W(150) - 0.1, W(151) - 0.1, "ФИДБЭК • ФИДБЭК • ", F_DELA, 200, 250, 300, LIME)
    marquee(cv, t, W(150) - 0.0, W(151) - 0.1, "ФИДБЭК • ФИДБЭК • ", F_DELA, 200, 480, -260, PURPLE, outline=True, stroke=5)
    # 11 ВМЕСТЕ
    big_letters(cv, t, W(165) - 0.1, W(167) - 0.1, "ВМЕСТЕ", F_DELA, 215, 1000, LIME, outline=PURPLE)

def front_layer(cv, t):
    # intro tag
    slide(cv, C_img("tag"), t, 0.25, W(15), 330, 96, dx=-600)
    float_blob(cv, t, 0.6, W(13), 5, 880, 1080, 0.48)
    pix_burst(cv, t, W(9), "spark", 820, 820, LIME, n=6, seed=1)
    # role
    pop(cv, C_img("role"), t, W(14) - 0.1, W(17), 300, 1060, rot=-4)
    # chance
    pop(cv, C_img("chance"), t, W(18) - 0.06, W(19) + 0.5, 760, 1100, rot=7, din=0.3)
    pix_burst(cv, t, W(18), "star", 760, 1100, LIME, n=8, seed=2)
    # nonstop / consistent
    slide(cv, C_img("nonstop"), t, W(22) - 0.05, W(25) + 0.2, 420, 1040, dx=-900, rot=-3)
    slide(cv, C_img("consist"), t, W(24) - 0.05, W(25) + 0.2, 600, 1170, dx=900, rot=2)
    # benefit / feedback
    pop(cv, C_img("benefit"), t, W(28) - 0.1, W(31) + 0.3, 285, 1060, rot=-5)
    pop(cv, C_img("feedback"), t, W(30) - 0.1, W(31) + 0.3, 790, 1080, rot=5)
    # profit chart
    if W(35) - 0.2 <= t < W(38):
        p = clamp((t - (W(36) - 0.25)) / 0.9)
        pop(cv, chart_spr(p), t, W(35) - 0.2, W(38), 760, 1060, rot=4)
    pix_burst(cv, t, W(36), "plus", 760, 960, LIME, n=7, cell=4, seed=4)
    # honest badge
    if W(38) - 0.1 <= t < W(40) + 0.4:
        pop(cv, C_img("honest"), t, W(38) - 0.1, W(40) + 0.4, 820, 1060, spin=-40)
    # призвание blobs + sparks
    float_blob(cv, t, W(43) - 0.2, W(45), 1, 170, 1120, 0.55, rot0=-20)
    float_blob(cv, t, W(43) - 0.0, W(45), 9, 930, 1000, 0.42, tint=(0.82, 1.05, 0.35), rot0=30)
    pix_burst(cv, t, W(43), "spark", 540, 600, LIME, n=10, cell=6, spread=420, seed=5)
    # 10 years counter + globe
    if W(46) <= t < W(55):
        p = clamp((t - W(48)) / 1.2)
        pop(cv, counter_spr(p), t, W(46), W(55), 300, 1080, rot=-3)
        pop(cv, globe_spr(t), t, W(45), W(55), 820, 1060, sc=1.0)
    # funnel
    if W(60) <= t < W(66):
        pop(cv, funnel_spr(clamp((t - W(61)) / 1.4)), t, W(60), W(66), 540, 1090, rot=-2)
    # target
    if W(66) <= t < W(69) + 0.4:
        pop(cv, target_spr(t), t, W(66), W(69) + 0.4, 540, 1090, rot=3)
    # checklist
    if W(70) - 0.1 <= t < W(81) - 0.1:
        marks = [clamp((t - W(73)) / 0.3) if t > W(73) else (0 if t > W(71) else -1),
                 clamp((t - W(75)) / 0.3) if t > W(75) else -1,
                 clamp((t - W(78)) / 0.3) if t > W(78) else -1]
        pop(cv, checklist_spr(t, marks), t, W(70) - 0.1, W(81) - 0.1, 540, 1080, rot=-2)
    pix_burst(cv, t, W(73) + 0.1, "check", 150, 1000, LIME, n=5, cell=4, seed=6)
    pix_burst(cv, t, W(75) + 0.1, "check", 150, 1100, LIME, n=5, cell=4, seed=7)
    # plus
    pop(cv, C_img("plus"), t, W(82) - 0.1, W(86), 880, 1040, spin=90)
    # germany
    pop(cv, C_img("germany"), t, W(89), W(94), 540, 1080, rot=-3, from_dy=200)
    pix_burst(cv, t, W(90), "heart", 540, 1020, (255, 206, 0), n=6, cell=4, seed=8)
    # international
    if W(94) <= t < W(98) + 0.4:
        pop(cv, globe_spr(t * 1.5, 130, LIME, BLUE + (255,)), t, W(94), W(98) + 0.4, 820, 1050)
        slide(cv, C_img("intl"), t, W(96) - 0.1, W(98) + 0.4, 400, 1170, dx=-900, rot=-3)
    # незаменимый burst + blobs
    burst_star(cv, t, W(105) - 0.05, W(106) + 0.2, 180, 1110, 150, LIME)
    float_blob(cv, t, W(104), W(106) + 0.3, 1, 900, 1100, 0.5, rot0=60)
    # new view
    pop(cv, C_img("newview"), t, W(109) - 0.1, W(112) + 0.4, 540, 1100, rot=-3)
    # time will tell
    if W(117) <= t < W(121):
        pop(cv, clock_spr(t, 0), t, W(117), W(121), 540, 1090, rot=3)
    # thank you hearts
    for k_, sd in enumerate([10, 11, 12]):
        pix_burst(cv, t, W(129) + k_ * 0.25, "heart", 540, 760, PINK if k_ != 1 else LIME, n=6, cell=6, spread=480, dur=1.4, seed=sd)
    # accept / reject
    pop(cv, C_img("accept"), t, W(137) - 0.08, W(143), 330, 1060, rot=-5)
    pop(cv, C_img("reject"), t, W(140) - 0.08, W(143), 730, 1170, rot=4)
    if W(141) <= t < W(143) + 0.6:
        lt = t - W(141)
        p = e_in_out(lt / 0.7)
        cx_ = lerp(950, 380, p); cy_ = lerp(1400, 1080, p)
        click = lt > 0.8 and lt < 1.0
        comp(cv, spr_pix("cursor", 6, BLACK, WHITE), cx_, cy_, sc=0.85 if click else 1.0, ax=0.1, ay=0.05)
    # chat feedback
    if W(147) - 0.1 <= t < W(151):
        pop(cv, chat_spr(t, 0), t, W(147) - 0.1, W(151), 540, 1090, rot=-3)
    # agree?
    if W(152) <= t < W(158):
        cp = clamp((t - W(154)) / 0.3)
        pop(cv, agree_spr(t, cp), t, W(152), W(158), 540, 1090, rot=2)
        lt = t - W(152)
        p = e_in_out(lt / 1.1)
        comp(cv, spr_pix("cursor", 6, BLACK, WHITE), lerp(900, 420, p), lerp(1400, 1120, p), sc=0.85 if 0 < t - W(154) < 0.18 else 1, ax=0.1, ay=0.05)
        pix_burst(cv, t, W(154) + 0.05, "spark", 400, 1100, GREEN, n=8, cell=5, seed=13)
    # сотрудничать
    float_blob(cv, t, W(164), W(167), 9, 180, 1080, 0.45, tint=(0.82, 1.05, 0.35))
    pix_burst(cv, t, W(165), "smile", 540, 760, LIME, n=7, cell=5, spread=440, seed=14)


# ------------------------------------------------------------------ OUTRO bento
OUTRO_T0 = W(167) - 0.1
def outro(cv_video, t):
    """returns final canvas for outro period: black bento with video card"""
    p = e_in_out((t - OUTRO_T0) / 0.8)
    out = np.empty_like(cv_video); out[:] = (8, 8, 8)
    # video card target rect
    tx0, ty0, tx1, ty1 = 40, 300, 560, 1220
    x0 = lerp(0, tx0, p); y0 = lerp(0, ty0, p); x1 = lerp(OW, tx1, p); y1 = lerp(OH, ty1, p)
    w = int(x1 - x0); h = int(y1 - y0)
    # fit video (cover) into rect
    sc = max(w / OW, h / OH)
    vw, vh = int(OW * sc), int(OH * sc)
    small = cv2.resize(cv_video, (vw, vh), interpolation=cv2.INTER_AREA)
    ox, oy = (vw - w) // 2, (vh - h) // 2
    crop = small[oy:oy + h, ox:ox + w]
    r = int(lerp(0, 40, p))
    mask = np.zeros((h, w), np.float32)
    cv2.rectangle(mask, (r, 0), (w - r, h), 1, -1); cv2.rectangle(mask, (0, r), (w, h - r), 1, -1)
    for cx_, cy_ in [(r, r), (w - r - 1, r), (r, h - r - 1), (w - r - 1, h - r - 1)]:
        cv2.circle(mask, (cx_, cy_), r, 1, -1, lineType=cv2.LINE_AA)
    ix0, iy0 = int(x0), int(y0)
    reg = out[iy0:iy0 + h, ix0:ix0 + w]
    m = mask[..., None]
    reg[:] = reg * (1 - m) + crop * m
    lt = t - OUTRO_T0
    # tiles
    pop(out, C_img("end_sales"), lt, 0.35, 99, 810, 410, din=0.4)
    pop(out, C_img("end_de"), lt, 0.5, 99, 810, 650, din=0.4)
    pop(out, C_img("end_fb"), lt, 0.65, 99, 810, 945, din=0.4)
    pop(out, C_img("end_lets"), lt, 0.8, 99, 540, 1420, din=0.45, sc=1.0)
    # header
    hp = e_out_expo((lt - 0.2) / 0.6)
    comp(out, spr_text("ОТКЛИК • SALES", F_UNB9, 64, LIME), 40, 200 + (1 - hp) * 40, ax=0, ay=0.5, alpha=hp)
    comp(out, spr_text("спасибо за просмотр", F_MONO, 32, WHITE), 42, 1640, ax=0, alpha=e_out_expo((lt - 1.0) / 0.5))
    comp(out, spr_pix("smile", 7, BLACK, LIME), 1000, 1640, alpha=e_out_expo((lt - 1.0) / 0.5), rot=math.sin(lt * 3) * 10)
    float_blob(out, lt, 0.9, 99, 5, 990, 1230, 0.34)
    return out


# ------------------------------------------------------------------ video frame build
def load_all():
    cap = cv2.VideoCapture(SRC); frames = []
    while True:
        ok, f = cap.read()
        if not ok: break
        frames.append(grade(f))
    m = subprocess.run(["ffmpeg", "-v", "error", "-i", "mask.mkv", "-f", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True).stdout
    masks = np.frombuffer(m, np.uint8).reshape(-1, SH, SW)
    return frames, masks

FR = MK = None

def glitch_amt(t):
    g = 0
    for ts, d in [(W(54), 0.45), (W(126) - 0.35, 0.18), (CUTS[9], 0.12)]:
        if ts <= t < ts + d: g = max(g, 1 - (t - ts) / d)
    return g

def flash_amt(t):
    a = 0
    for ts in [W(43), W(105), W(129), W(0) - 0.25]:
        if ts <= t < ts + 0.18: a = max(a, 0.55 * (1 - (t - ts) / 0.18))
    return a

def whip_amt(t):
    # motion blur around selected cuts
    for c in [CUTS[5], CUTS[9], CUTS[15], CUTS[23], CUTS[27]]:
        if abs(t - c) < 0.1: return 1 - abs(t - c) / 0.1
    return 0

def render_frame(fi):
    t = fi / FPS
    tt = min(t, SPEECH_DUR - 1 / FPS)
    st = src_time(tt)
    si = min(int(round(st * FPS)), len(FR) - 1)
    src = FR[si]; msk = MK[min(si, len(MK) - 1)]
    z, cx, cy = camera(tt)
    sdx, sdy = shake(t)
    sc = OW / SW * z
    M = np.array([[sc, 0, OW / 2 - sc * cx + sdx], [0, sc, OH / 2 - sc * cy + sdy]], np.float32)
    vid = cv2.warpAffine(src, M, (OW, OH), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
    mm = cv2.warpAffine(msk, M, (OW, OH), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
    # sharpen
    bl = cv2.GaussianBlur(vid, (0, 0), 2.2)
    vid = cv2.addWeighted(vid, 1.45, bl, -0.45, 0)
    wa = whip_amt(t)
    if wa > 0:
        k_ = int(9 + wa * 50) | 1
        ker = np.zeros((k_, k_), np.float32); ker[:, k_ // 2] = 1 / k_
        vid = cv2.filter2D(vid, -1, ker)
    vid = cv2.cvtColor(vid, cv2.COLOR_BGR2RGB).astype(np.float32)
    person = vid.copy()
    m = (mm.astype(np.float32) / 255.0)
    m = np.clip((m - 0.35) / 0.4, 0, 1)
    m = cv2.GaussianBlur(m, (0, 0), 1.5)[..., None]
    cv = vid
    # BACK layer + person on top
    back_layer(cv, t)
    cv[:] = cv * (1 - m) + person * m
    # FRONT
    front_layer(cv, t)
    draw_subs(cv, t)
    # glitch
    g = glitch_amt(t)
    if g > 0:
        rng = np.random.default_rng(fi)
        sh = int(18 * g)
        cv[..., 0] = np.roll(cv[..., 0], sh, axis=1); cv[..., 2] = np.roll(cv[..., 2], -sh, axis=1)
        for _ in range(int(8 * g)):
            y0 = rng.integers(0, OH - 80); hh = rng.integers(10, 80)
            cv[y0:y0 + hh] = np.roll(cv[y0:y0 + hh], int(rng.integers(-60, 60) * g), axis=1)
    fa = flash_amt(t)
    if fa > 0: cv[:] = cv * (1 - fa) + 255 * fa
    if t >= OUTRO_T0:
        cv = outro(cv, t)
    # progress bar
    pw = int(OW * min(1, t / DUR))
    cv[0:8, :pw] = LIME
    # vignette + grain
    cv *= vignette()
    gr = cv2.resize(GRAIN[fi % 6], (OW, OH), interpolation=cv2.INTER_LINEAR)
    cv += gr[..., None]
    return np.clip(cv, 0, 255).astype(np.uint8)


def worker(args):
    a, b, path = args
    p = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{OW}x{OH}", "-r", str(FPS), "-i", "-",
                          "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", path], stdin=subprocess.PIPE)
    for fi in range(a, b):
        p.stdin.write(render_frame(fi).tobytes())
        if fi % 100 == 0: print("frame", fi, flush=True)
    p.stdin.close(); p.wait()
    return path


if __name__ == "__main__":
    FR, MK = load_all()
    mode = sys.argv[1]
    if mode == "stills":
        ts = [float(x) for x in sys.argv[2:]]
        for t in ts:
            fi = int(t * FPS)
            Image.fromarray(render_frame(fi)).save(f"still_{t:06.2f}.jpg", quality=88)
        print("ok")
    elif mode == "info":
        print("DUR", DUR, "NF", NF)
        print(list(zip([round(c, 2) for c in CUTS], SHOTS)))
        for g in GROUPS: print(round(g[0], 2), " ".join(WORDS[i]["w"] for i in g[2]))
    else:
        import multiprocessing as mpc
        nproc = int(sys.argv[2]) if len(sys.argv) > 2 else 4
        a0 = int(sys.argv[3]) if len(sys.argv) > 3 else 0
        a1 = int(sys.argv[4]) if len(sys.argv) > 4 else NF
        step = (a1 - a0 + nproc - 1) // nproc
        jobs = [(a0 + i * step, min(a1, a0 + (i + 1) * step), f"part_{i}.mp4") for i in range(nproc)]
        with mpc.get_context("fork").Pool(nproc) as pool:
            parts = pool.map(worker, jobs)
        with open("parts.txt", "w") as f:
            for p in parts: f.write(f"file '{p}'\n")
        print("done")
