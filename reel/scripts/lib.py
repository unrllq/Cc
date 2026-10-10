import numpy as np, cv2, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from functools import lru_cache

FPS = 30
OW, OH = 1080, 1920
FD = "fonts/"
F_DELA = FD + "dela-gothic-one-400.ttf"
F_UNB9 = FD + "unbounded-900.ttf"
F_UNB6 = FD + "unbounded-600.ttf"
F_OSW = FD + "oswald-700.ttf"
F_MONO = FD + "jetbrains-mono-500.ttf"
F_MONOB = FD + "jetbrains-mono-800.ttf"
F_PIX = FD + "press-start-2p-400.ttf"
F_RUB = FD + "rubik-mono-one-400.ttf"

LIME = (198, 255, 61)
PURPLE = (124, 58, 255)
ORANGE = (255, 77, 18)
BLUE = (46, 59, 255)
CREAM = (243, 239, 230)
PINK = (255, 79, 216)
BLACK = (12, 12, 12)
WHITE = (255, 255, 255)
GREEN = (52, 232, 120)
RED = (255, 59, 59)


# ---------------- easing ----------------
def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x

def e_out_cubic(x):
    x = clamp(x); return 1 - (1 - x) ** 3

def e_out_expo(x):
    x = clamp(x); return 1.0 if x >= 1 else 1 - 2 ** (-10 * x)

def e_in_out(x):
    x = clamp(x); return 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2

def e_out_back(x, s=1.9):
    x = clamp(x); x -= 1; return x * x * ((s + 1) * x + s) + 1

def e_in_cubic(x):
    x = clamp(x); return x ** 3

def env(t, t0, t1, din=0.3, dout=0.25):
    """returns (in_progress, out_progress) both 0..1 ; out=1 means fully visible"""
    return clamp((t - t0) / din), clamp((t1 - t) / dout)

def lerp(a, b, k):
    return a + (b - a) * k


# ---------------- font / sprites ----------------
@lru_cache(maxsize=256)
def font(path, size):
    return ImageFont.truetype(path, int(size))

def pil_to_spr(im):
    a = np.asarray(im.convert("RGBA")).astype(np.float32)
    al = a[..., 3:4] / 255.0
    out = np.empty_like(a)
    out[..., :3] = a[..., :3] * al
    out[..., 3:] = al
    return out

def text_size(txt, fpath, size, tracking=0):
    f = font(fpath, size)
    if tracking == 0:
        b = f.getbbox(txt)
        return b[2] - b[0], b[3] - b[1], b
    w = sum(f.getlength(c) for c in txt) + tracking * (len(txt) - 1)
    b = f.getbbox(txt)
    return int(w), b[3] - b[1], b

def text_img(txt, fpath, size, fill=WHITE, stroke=0, stroke_fill=BLACK, tracking=0, pad=None, outline_only=False, shadow=None):
    f = font(fpath, size)
    asc, desc = f.getmetrics()
    pad = pad if pad is not None else stroke + 6 + (abs(shadow[0]) + abs(shadow[1]) if shadow else 0)
    if tracking == 0:
        w = int(f.getlength(txt))
    else:
        w = int(sum(f.getlength(c) for c in txt) + tracking * (len(txt) - 1))
    h = asc + desc
    im = Image.new("RGBA", (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)

    def draw(xy, fill_, stroke_w, sfill):
        if tracking == 0:
            d.text(xy, txt, font=f, fill=fill_, stroke_width=stroke_w, stroke_fill=sfill)
        else:
            x = xy[0]
            for c in txt:
                d.text((x, xy[1]), c, font=f, fill=fill_, stroke_width=stroke_w, stroke_fill=sfill)
                x += f.getlength(c) + tracking
    if shadow:
        draw((pad + shadow[0], pad + shadow[1]), shadow[2], stroke, shadow[2])
    if outline_only:
        draw((pad, pad), (0, 0, 0, 0), stroke, fill)
        # punch interior
        m = Image.new("L", im.size, 0)
        dm = ImageDraw.Draw(m)
        if tracking == 0:
            dm.text((pad, pad), txt, font=f, fill=255)
        else:
            x = pad
            for c in txt:
                dm.text((x, pad), c, font=f, fill=255); x += f.getlength(c) + tracking
        o = Image.new("RGBA", im.size, (0, 0, 0, 0))
        d2 = ImageDraw.Draw(o)
        if tracking == 0:
            d2.text((pad, pad), txt, font=f, fill=(0, 0, 0, 0), stroke_width=stroke, stroke_fill=fill)
        else:
            x = pad
            for c in txt:
                d2.text((x, pad), c, font=f, fill=(0, 0, 0, 0), stroke_width=stroke, stroke_fill=fill); x += f.getlength(c) + tracking
        arr = np.asarray(o).copy()
        arr[..., 3] = (arr[..., 3].astype(np.int32) * (255 - np.asarray(m).astype(np.int32)) // 255).astype(np.uint8)
        im = Image.fromarray(arr)
    else:
        draw((pad, pad), fill, stroke, stroke_fill)
    return im

def fit_size(txt, fpath, width, tracking=0, start=400):
    s = start
    for _ in range(30):
        w, _, _ = text_size(txt, fpath, s, tracking)
        if abs(w - width) < 4: break
        s = s * width / max(w, 1)
    return int(s)

def rrect(w, h, r, fill, outline=None, ow=0, ss=2):
    im = Image.new("RGBA", (w * ss, h * ss), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w * ss - 1, h * ss - 1], r * ss, fill=fill, outline=outline, width=ow * ss)
    return im.resize((w, h), Image.LANCZOS)

def drop_shadow(im, off=(0, 18), blur=24, alpha=110):
    w, h = im.size
    p = blur * 2 + max(abs(off[0]), abs(off[1]))
    out = Image.new("RGBA", (w + 2 * p, h + 2 * p), (0, 0, 0, 0))
    a = im.split()[3].point(lambda v: v * alpha // 255)
    sh = Image.new("RGBA", im.size, (0, 0, 0, 255)); sh.putalpha(a)
    out.paste(sh, (p + off[0], p + off[1]), sh)
    out = out.filter(ImageFilter.GaussianBlur(blur))
    out.alpha_composite(im, (p, p))
    return out


# ---------------- compositing ----------------
def comp(cv, spr, x, y, sc=1.0, rot=0.0, alpha=1.0, ax=0.5, ay=0.5, sx=None, sy=None):
    """composite premultiplied sprite onto float canvas cv (H,W,3) 0..255. (x,y) = anchor pos on canvas"""
    if alpha <= 0.003: return
    if sc <= 0.01 and sx is None: return
    h, w = spr.shape[:2]
    sx = sc if sx is None else sx
    sy = sc if sy is None else sy
    if abs(sx) < 0.005 or abs(sy) < 0.005: return
    c, s = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    # M maps sprite px -> canvas
    A = np.array([[c * sx, -s * sy], [s * sx, c * sy]])
    off = np.array([x, y]) - A @ np.array([ax * w, ay * h])
    corners = np.array([[0, 0], [w, 0], [0, h], [w, h]]) @ A.T + off
    x0 = int(max(0, math.floor(corners[:, 0].min()) - 1)); x1 = int(min(cv.shape[1], math.ceil(corners[:, 0].max()) + 1))
    y0 = int(max(0, math.floor(corners[:, 1].min()) - 1)); y1 = int(min(cv.shape[0], math.ceil(corners[:, 1].max()) + 1))
    if x1 <= x0 or y1 <= y0: return
    M = np.hstack([A, (off - np.array([x0, y0]))[:, None]])
    simple = abs(rot) < 1e-3 and abs(sx - 1) < 1e-3 and abs(sy - 1) < 1e-3 and abs(off[0] - round(off[0])) < 1e-3 and abs(off[1] - round(off[1])) < 1e-3
    if simple:
        ox, oy = int(round(off[0])), int(round(off[1]))
        sx0, sy0 = x0 - ox, y0 - oy
        reg = spr[max(0, sy0):sy0 + (y1 - y0), max(0, sx0):sx0 + (x1 - x0)]
        if reg.shape[0] != y1 - y0 or reg.shape[1] != x1 - x0:
            tmp = np.zeros((y1 - y0, x1 - x0, 4), np.float32)
            tmp[max(0, -sy0):max(0, -sy0) + reg.shape[0], max(0, -sx0):max(0, -sx0) + reg.shape[1]] = reg
            reg = tmp
        wp = reg
    else:
        interp = cv2.INTER_LINEAR if max(sx, sy) >= 0.5 else cv2.INTER_AREA
        wp = cv2.warpAffine(spr, M, (x1 - x0, y1 - y0), flags=interp, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    if wp.ndim == 2: return
    a = wp[..., 3:4] * alpha
    region = cv[y0:y1, x0:x1]
    region *= (1 - a)
    region += wp[..., :3] * alpha


@lru_cache(maxsize=512)
def spr_text(txt, fpath, size, fill=WHITE, stroke=0, stroke_fill=BLACK, tracking=0, outline_only=False, shadow=None):
    return pil_to_spr(text_img(txt, fpath, size, fill, stroke, stroke_fill, tracking, outline_only=outline_only, shadow=shadow))


# ---------------- pixel icons ----------------
PIX = {
"heart": [
"..XX...XX..",
".XXXX.XXXX.",
"XXXXXXXXXXX",
"XXXXXXXXXXX",
"XXXXXXXXXXX",
".XXXXXXXXX.",
"..XXXXXXX..",
"...XXXXX...",
"....XXX....",
".....X.....",
],
"star": [
".....X.....",
".....X.....",
"....XXX....",
"....XXX....",
"XXXXXXXXXXX",
".XXXXXXXXX.",
"...XXXXX...",
"...XX.XX...",
"..XX...XX..",
".XX.....XX.",
],
"spark": [
"....X....",
"....X....",
"...XXX...",
".XXXXXXX.",
"XXXXXXXXX",
".XXXXXXX.",
"...XXX...",
"....X....",
"....X....",
],
"cursor": [
"X..........",
"XX.........",
"XOX........",
"XOOX.......",
"XOOOX......",
"XOOOOX.....",
"XOOOOOX....",
"XOOOOOOX...",
"XOOOOOOOX..",
"XOOOOOXXXX.",
"XOOXOOX....",
"XOX.XOOX...",
"XX..XOOX...",
"X....XOOX..",
".....XOOX..",
"......XX...",
],
"check": [
"..........XX",
".........XXX",
"........XXX.",
"XX.....XXX..",
"XXX...XXX...",
".XXX.XXX....",
"..XXXXX.....",
"...XXX......",
"....X.......",
],
"cross": [
"XX......XX",
"XXX....XXX",
".XXX..XXX.",
"..XXXXXX..",
"...XXXX...",
"...XXXX...",
"..XXXXXX..",
".XXX..XXX.",
"XXX....XXX",
"XX......XX",
],
"flower": [
"....XXX.XXX....",
"...XOOOXOOOX...",
"...XOOOXOOOX...",
".XXXOOOOOOOXXX.",
"XOOOOOOOOOOOOOX",
"XOOOOOXXXOOOOOX",
".XXOOOX.XOOOXX.",
"XOOOOOXXXOOOOOX",
"XOOOOOOOOOOOOOX",
".XXXOOOOOOOXXX.",
"...XOOOXOOOX...",
"...XOOOXOOOX...",
"....XXX.XXX....",
],
"smile": [
"...XXXXXX...",
".XXOOOOOOXX.",
".XOOOOOOOOX.",
"XOOXOOOOXOOX",
"XOOXOOOOXOOX",
"XOOOOOOOOOOX",
"XOXOOOOOOXOX",
"XOOXOOOOXOOX",
".XOOXXXXOOX.",
".XXOOOOOOXX.",
"...XXXXXX...",
],
"pin": [
"...XXXXX...",
"..XOOOOOX..",
".XOOOOOOOX.",
"XOOOXXXOOOX",
"XOOOX.XOOOX",
"XOOOXXXOOOX",
".XOOOOOOOX.",
"..XOOOOOX..",
"...XOOOX...",
"....XOX....",
".....X.....",
],
"eye": [
"....XXXXXXX....",
"..XXOOOOOOOXX..",
".XOOOOXXXOOOOX.",
"XOOOOXXXXXOOOOX",
"XOOOOXXOXXOOOOX",
"XOOOOXXXXXOOOOX",
".XOOOOXXXOOOOX.",
"..XXOOOOOOOXX..",
"....XXXXXXX....",
],
"arrow": [
"......X....",
"......XX...",
"XXXXXXXXX..",
"XXXXXXXXXX.",
"XXXXXXXXX..",
"......XX...",
"......X....",
],
"plus": [
"...XXX...",
"...XXX...",
"...XXX...",
"XXXXXXXXX",
"XXXXXXXXX",
"XXXXXXXXX",
"...XXX...",
"...XXX...",
"...XXX...",
],
"up": [
"....X....",
"...XXX...",
"..XXXXX..",
".XXXXXXX.",
"XXXXXXXXX",
"...XXX...",
"...XXX...",
"...XXX...",
"...XXX...",
],
}

@lru_cache(maxsize=128)
def pix_img(name, cell, col=BLACK, col2=WHITE, outline=None):
    g = PIX[name]
    h, w = len(g), max(len(r) for r in g)
    pad = cell if outline else 0
    im = Image.new("RGBA", (w * cell + 2 * pad, h * cell + 2 * pad), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if outline:
        for y, r in enumerate(g):
            for x, ch in enumerate(r):
                if ch in "XO":
                    for dx in (-1, 0, 1):
                        for dy in (-1, 0, 1):
                            d.rectangle([pad + (x + dx) * cell, pad + (y + dy) * cell, pad + (x + dx + 1) * cell - 1, pad + (y + dy + 1) * cell - 1], fill=outline)
    for y, r in enumerate(g):
        for x, ch in enumerate(r):
            if ch == "X":
                d.rectangle([pad + x * cell, pad + y * cell, pad + (x + 1) * cell - 1, pad + (y + 1) * cell - 1], fill=col)
            elif ch == "O":
                d.rectangle([pad + x * cell, pad + y * cell, pad + (x + 1) * cell - 1, pad + (y + 1) * cell - 1], fill=col2)
    return im

@lru_cache(maxsize=128)
def spr_pix(name, cell, col=BLACK, col2=WHITE, outline=None):
    return pil_to_spr(pix_img(name, cell, col, col2, outline))


# ---------------- procedural chrome blobs ----------------
def chrome_blob(seed, size=520, tint=(1.0, 1.0, 1.0), n=6):
    rng = np.random.default_rng(seed)
    S = size
    yy, xx = np.mgrid[0:S, 0:S].astype(np.float32) / S
    field = np.zeros((S, S), np.float32)
    for i in range(n):
        cx, cy = rng.uniform(.28, .72), rng.uniform(.28, .72)
        r = rng.uniform(.07, .15)
        field += r * r / ((xx - cx) ** 2 + (yy - cy) ** 2 + 1e-4)
    # a few satellite droplets
    for i in range(2):
        cx, cy = rng.uniform(.15, .85), rng.uniform(.15, .85)
        r = rng.uniform(.035, .05)
        field += r * r / ((xx - cx) ** 2 + (yy - cy) ** 2 + 1e-4)
    thr = 1.0
    inside = np.clip((field - thr) * 6, 0, 1)
    hgt = np.sqrt(np.clip(1 - np.exp(-(field - thr).clip(0) * 2.2), 0, 1))
    hgt = cv2.GaussianBlur(hgt, (0, 0), 3)
    gy, gx = np.gradient(hgt * S * 0.10)
    nz = np.ones_like(gx)
    L = np.sqrt(gx ** 2 + gy ** 2 + nz ** 2)
    nx, ny, nz = -gx / L, -gy / L, nz / L
    # reflective environment lookup (studio chrome)
    rx, ry = nx * 1.6, ny * 1.6
    ang = np.arctan2(ry, rx)
    rad = np.clip(np.sqrt(rx ** 2 + ry ** 2), 0, 1.6)
    envv = 0.92 - 0.55 * np.clip(ry + 0.15, -1, 1)
    envv -= 0.62 * np.exp(-((ry - 0.18) / 0.13) ** 2)
    envv += 0.25 * np.exp(-((ry - 0.55) / 0.2) ** 2)
    envv -= 0.25 * np.exp(-((rx + 0.75) / 0.25) ** 2)
    envv = np.clip(envv, 0.04, 1.0)
    light = np.array([-0.45, -0.65, 0.6]); light /= np.linalg.norm(light)
    hvec = light + np.array([0, 0, 1.0]); hvec /= np.linalg.norm(hvec)
    spec = np.clip(nx * hvec[0] + ny * hvec[1] + nz * hvec[2], 0, 1) ** 90 * 1.6
    spec2 = np.clip(nx * 0.5 + ny * 0.3 + nz * 0.81, 0, 1) ** 140 * 0.8
    fres = (1 - nz) ** 3 * 0.25
    base = 0.18 + 0.82 * envv
    col = np.stack([base * tint[0], base * tint[1], base * tint[2]], -1) + (spec + spec2 + fres)[..., None]
    col = np.clip(col, 0, 1) * 255
    inside = np.clip((field - thr) * 14, 0, 1)
    a = cv2.GaussianBlur(inside, (0, 0), 0.6)
    out = np.dstack([col * a[..., None], a[..., None]]).astype(np.float32)
    return out

def burst_img(R, col, spikes=14, inner=0.62, seed=3, rot=0, outline=None, ow=0):
    rng = np.random.default_rng(seed)
    ss = 2
    im = Image.new("RGBA", (int(2 * R * ss + 20), int(2 * R * ss + 20)), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = im.size[0] / 2
    pts = []
    for i in range(spikes * 2):
        a = math.radians(rot) + math.pi * i / spikes
        r = R * ss * (1 if i % 2 == 0 else inner) * (rng.uniform(.82, 1.0) if i % 2 == 0 else 1)
        pts.append((c + r * math.cos(a), c + r * math.sin(a)))
    d.polygon(pts, fill=col, outline=outline, width=ow * ss)
    return im.resize((im.size[0] // ss, im.size[1] // ss), Image.LANCZOS)
