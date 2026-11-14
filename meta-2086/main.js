import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const BG = 0xc4c5c8;
const GREEN = '#7dff4a';

/* ---------- renderer / scene ---------- */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
scene.background = new THREE.Color(BG);
scene.fog = new THREE.Fog(BG, 9, 22);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
scene.environmentIntensity = 0.9;

const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
const TARGET = new THREE.Vector3(0, 1.02, 0);
const controls = new OrbitControls(camera, canvas);
controls.target.copy(TARGET);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 2.2;
controls.maxDistance = 11;
controls.minPolarAngle = 0.35;
controls.maxPolarAngle = Math.PI / 2 - 0.03;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.55;

const key = new THREE.DirectionalLight(0xffffff, 1.9);
key.position.set(-3.5, 6.5, 4.5);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -3.5, right: 3.5, top: 4, bottom: -2, near: 1, far: 16 });
key.shadow.bias = -0.0004;
key.shadow.radius = 7;
scene.add(key);
const rim = new THREE.DirectionalLight(0xffffff, 1.3);
rim.position.set(4, 3, -4);
scene.add(rim);
scene.add(new THREE.HemisphereLight(0xffffff, 0x9a9ca0, 0.55));

/* ---------- materials ---------- */
const M = {
  puffer: new THREE.MeshPhysicalMaterial({ color: 0x07070a, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.28 }),
  leather: new THREE.MeshPhysicalMaterial({ color: 0x0a0a0c, roughness: 0.42, clearcoat: 0.3, clearcoatRoughness: 0.4, side: THREE.DoubleSide }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.7 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.38, metalness: 0.75 }),
  plastic: new THREE.MeshStandardMaterial({ color: 0x0b0b0d, roughness: 0.5 }),
  skin: new THREE.MeshStandardMaterial({ color: 0xc9a58f, roughness: 0.6 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0x020203, roughness: 0.05, clearcoat: 1 }),
  white: new THREE.MeshPhysicalMaterial({ color: 0xf1f1f2, roughness: 0.22, clearcoat: 0.6 }),
};

/* ---------- helpers ---------- */
let seed = 2086;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const rr = (a, b) => a + (b - a) * rnd();
const UP = new THREE.Vector3(0, 1, 0);
const V = (x, y, z) => new THREE.Vector3(x, y, z);

function mesh(geo, mat, parent, pos, shadow = true) {
  const m = new THREE.Mesh(geo, mat);
  if (pos) m.position.set(pos[0], pos[1], pos[2]);
  m.castShadow = shadow;
  m.receiveShadow = shadow;
  parent.add(m);
  return m;
}
// cylinder stretched between two points
function rod(a, b, r, mat, parent, r2 = r) {
  const d = b.clone().sub(a);
  const m = mesh(new THREE.CylinderGeometry(r2, r, d.length(), 10), mat, parent);
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(UP, d.normalize());
  return m;
}
function spike(parent, pos, dir, len, r, mat = M.puffer) {
  const m = mesh(new THREE.ConeGeometry(r, len, 14), mat, parent);
  const n = dir.clone().normalize();
  m.quaternion.setFromUnitVectors(UP, n);
  m.position.copy(pos).addScaledVector(n, len / 2);
  return m;
}
// closed-in-u parametric surface with smooth seam
function surface(fn, nu, nv) {
  const pos = new Float32Array((nu + 1) * (nv + 1) * 3);
  const p = new THREE.Vector3();
  let k = 0;
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    fn((i % nu) / nu, j / nv, p);
    pos[k++] = p.x; pos[k++] = p.y; pos[k++] = p.z;
  }
  const idx = [];
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const n = g.attributes.normal;
  for (let j = 0; j <= nv; j++) {
    const a = j * (nu + 1), b = a + nu;
    const x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b);
    const l = Math.hypot(x, y, z) || 1;
    n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l);
  }
  return g;
}
// quilted "puffer" tube: stacked bulging bands puckered at the seams
function pufferGeo({ ys, rs, bulge, sx = 1, sz = 1, pleats = 22, pucker = 0.06, nu = 120, per = 14 }) {
  const n = bulge.length;
  return surface((u, v, p) => {
    const f = Math.min(v * n, n - 1e-6), b = Math.floor(f), t = f - b;
    const th = u * Math.PI * 2 - Math.PI / 2; // seam at the back
    const s = Math.sin(Math.PI * t);
    let r = THREE.MathUtils.lerp(rs[b], rs[b + 1], t) + bulge[b] * Math.pow(s, 0.55);
    r *= 1 - pucker * Math.pow(1 - s, 2.2) * (0.5 + 0.5 * Math.cos(pleats * th + b * 1.7));
    r *= 1 + 0.012 * Math.sin(7 * th + b * 2.1) * s + 0.008 * Math.sin(13 * th + 9 * t);
    const y = THREE.MathUtils.lerp(ys[b], ys[b + 1], t) + 0.006 * Math.sin(5 * th + b);
    p.set(Math.cos(th) * r * sx, y, -Math.sin(th) * r * sz);
  }, nu, n * per);
}
function puffBall(r, sy, pleats = 12) {
  return surface((u, v, p) => {
    const th = u * Math.PI * 2, ph = v * Math.PI;
    const s = Math.sin(ph);
    const k = r * (1 - 0.07 * Math.pow(1 - s, 2) * Math.cos(pleats * th));
    p.set(Math.cos(th) * s * k, -Math.cos(ph) * k * sy, Math.sin(th) * s * k);
  }, 48, 24);
}

/* ---------- screen textures (canvas) ---------- */
const screens = [];
function makeScreen(w, h, draw, live = false) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const s = { tex, live, redraw: (t) => { draw(ctx, w, h, t); tex.needsUpdate = true; } };
  s.redraw(0);
  screens.push(s);
  return tex;
}
function grid(c, w, h, step, col = 'rgba(255,255,255,.28)') {
  c.strokeStyle = col; c.lineWidth = 1; c.beginPath();
  for (let x = step; x < w; x += step) { c.moveTo(x + .5, 0); c.lineTo(x + .5, h); }
  for (let y = step; y < h; y += step) { c.moveTo(0, y + .5); c.lineTo(w, y + .5); }
  c.stroke();
}
// tiny puffer silhouette, echoing the hero figure
function figure(c, x, y, s, col, spiky = true) {
  c.fillStyle = col;
  const e = (cx, cy, rx, ry) => { c.beginPath(); c.ellipse(x + cx * s, y + cy * s, rx * s, ry * s, 0, 0, 7); c.fill(); };
  e(0, -1.55, .2, .22);
  if (spiky) for (let i = 0; i < 7; i++) {
    const a = -Math.PI + (i / 6) * Math.PI;
    c.beginPath();
    c.moveTo(x + Math.cos(a - .18) * .2 * s, y + (-1.55 + Math.sin(a - .18) * .2) * s);
    c.lineTo(x + Math.cos(a) * .38 * s, y + (-1.55 + Math.sin(a) * .38) * s);
    c.lineTo(x + Math.cos(a + .18) * .2 * s, y + (-1.55 + Math.sin(a + .18) * .2) * s);
    c.fill();
  }
  e(0, -1.22, .3, .16); e(0, -.95, .46, .2); e(0, -.66, .5, .2); e(0, -.4, .48, .19); e(0, -.16, .42, .16);
  c.fillRect(x - .16 * s, y - .1 * s, .1 * s, .75 * s); c.fillRect(x + .06 * s, y - .1 * s, .1 * s, .75 * s);
  c.fillRect(x - .2 * s, y + .5 * s, .17 * s, .22 * s); c.fillRect(x + .03 * s, y + .5 * s, .17 * s, .22 * s);
}
function cross(c, x, y, r) {
  c.strokeStyle = GREEN; c.lineWidth = 2; c.beginPath();
  c.arc(x, y, r, 0, 7); c.moveTo(x - r * 2.2, y); c.lineTo(x + r * 2.2, y); c.moveTo(x, y - r * 2.2); c.lineTo(x, y + r * 2.2); c.stroke();
}
function glitch(c, x, y, w, h, n) {
  for (let i = 0; i < n; i++) {
    c.fillStyle = rnd() > .5 ? '#fff' : '#000';
    c.fillRect(x + rnd() * w, y + rnd() * h, rr(4, w * .22), rr(3, 12));
  }
}

const texA = makeScreen(960, 620, (c, w, h, t) => {            // big landscape: collage on grid
  seed = 11;
  c.fillStyle = '#060607'; c.fillRect(0, 0, w, h);
  grid(c, w, h, 62);
  const tiles = [[190, 60, 210, 330, '#d9d9db', '#111'], [400, 100, 190, 270, '#17171a', '#e9e9ea'], [545, 190, 190, 300, '#3a3b40', '#f4f4f4'], [190, 250, 120, 250, '#0d0d0f', '#55565c']];
  for (const [x, y, tw, th, bg, fg] of tiles) {
    c.fillStyle = bg; c.fillRect(x, y, tw, th);
    c.save(); c.beginPath(); c.rect(x, y, tw, th); c.clip();
    figure(c, x + tw / 2, y + th * .7, th * .36, fg); c.restore();
  }
  glitch(c, 560, 420, 200, 90, 26);
  c.fillStyle = '#fff'; c.font = 'bold 15px Helvetica,Arial'; c.fillText('prepare_tier', 742, 62);
  c.fillRect(742, 72, 150, 2);
  c.font = '11px monospace'; c.fillText('REC ' + String(Math.floor(t * 24) % 100000).padStart(5, '0'), 742, 92);
  c.strokeStyle = GREEN; c.lineWidth = 2;
  const sy = 124 + Math.sin(t * .7) * 26, sx = 580 + Math.cos(t * .5) * 40;
  c.beginPath(); c.moveTo(0, sy); c.lineTo(w, sy); c.moveTo(sx, 0); c.lineTo(sx, h); c.stroke();
  cross(c, sx, sy, 10);
}, true);

const texB = makeScreen(520, 900, (c, w, h) => {               // portrait filmstrip
  seed = 23;
  c.fillStyle = '#050506'; c.fillRect(0, 0, w, h);
  const cols = [['#8f9096', '#1b1b1e'], ['#0b0b0d', '#2a2a2e'], ['#3d4a66', '#0a0a0c']];
  for (let j = 0; j < 9; j++) for (let i = 0; i < 3; i++) {
    const x = 26 + i * 158, y = 16 + j * 78, [bg, fg] = cols[i];
    c.fillStyle = bg; c.fillRect(x, y, 150, 72);
    c.save(); c.beginPath(); c.rect(x, y, 150, 72); c.clip();
    c.fillStyle = fg;
    if (i === 0) { c.beginPath(); c.ellipse(x + 70, y + 46, 62, 24, -.25, 0, 7); c.fill(); c.fillStyle = '#f2f2f2'; c.fillRect(x + 10, y + 60, 120, 5); }
    else if (i === 1) { c.fillRect(x + 42, y + 14, 66, 46); c.fillStyle = '#e8b48a'; c.fillRect(x + 104, y + 30, 46, 16); }
    else figure(c, x + 75, y + 78, 44, fg);
    c.restore();
  }
  c.fillStyle = '#050506'; c.fillRect(0, 720, w, 180);
  glitch(c, 30, 730, 300, 130, 60);
  c.fillStyle = '#fff'; c.font = 'bold 22px Helvetica,Arial'; c.fillText('W//C', 150, 800);
});

const texC = makeScreen(480, 900, (c, w, h, t) => {            // portrait scopes / levels
  seed = 37;
  c.fillStyle = '#050506'; c.fillRect(0, 0, w, h);
  grid(c, w, h, 48, 'rgba(255,255,255,.1)');
  const tile = (y, bg, fg) => { c.fillStyle = bg; c.fillRect(130, y, 230, 190); c.save(); c.beginPath(); c.rect(130, y, 230, 190); c.clip(); figure(c, 245, y + 150, 86, fg); c.restore(); };
  tile(30, '#cfc3a0', '#18c58a'); tile(240, '#c9bd9b', '#12b37c');
  c.fillStyle = '#fff'; c.font = '13px monospace'; c.fillText('MFW 2.0', 138, 236); c.fillText('MFW 2.5', 138, 446);
  for (const x of [34, 78, 384, 428]) {                         // level meters
    const lv = .55 + .4 * Math.abs(Math.sin(t * 2.3 + x));
    c.fillStyle = '#12301a'; c.fillRect(x, 30, 22, 400);
    for (let y = 0; y < 400 * lv; y += 9) { c.fillStyle = y > 330 ? '#ffd23c' : GREEN; c.fillRect(x, 430 - y - 6, 22, 6); }
  }
  for (let j = 0; j < 12; j++) for (let i = 0; i < 9; i++) {    // pixel mosaic
    const hue = [330, 200, 260, 20, 0][Math.floor(rnd() * 5)];
    c.fillStyle = `hsl(${hue} ${rr(15, 45)}% ${rr(30, 78)}%)`;
    c.fillRect(120 + i * 27, 470 + j * 24, 27, 24);
  }
  c.strokeStyle = GREEN; c.lineWidth = 2; c.strokeRect(120, 470, 243, 288);
  const cy = 520 + ((t * 60) % 230);
  c.beginPath(); c.moveTo(60, cy); c.lineTo(420, cy); c.stroke(); cross(c, 242, 610, 12);
  c.strokeStyle = '#ff5a3c'; c.beginPath(); c.moveTo(30, 800); c.lineTo(450, 800); c.stroke();
  c.strokeStyle = '#4aa8ff'; c.beginPath(); c.moveTo(30, 812); c.lineTo(450, 812); c.stroke();
  c.fillStyle = '#fff'; c.font = '11px monospace'; c.fillText('Video Output Opt Scope', 150, 792);
}, true);

function collage(sd, accent) {                                   // small monitors: tile wall
  return (c, w, h) => {
    seed = sd;
    c.fillStyle = '#050506'; c.fillRect(0, 0, w, h);
    grid(c, w, h, 32, 'rgba(255,255,255,.14)');
    for (let i = 0; i < 16; i++) {
      const tw = rr(40, 110), th = rr(40, 100), x = rr(10, w - tw - 10), y = rr(10, h - th - 10);
      const light = rnd() > .5;
      c.fillStyle = light ? `hsl(0 0% ${rr(70, 95)}%)` : `hsl(0 0% ${rr(8, 30)}%)`;
      if (accent && i % 5 === 0) c.fillStyle = accent;
      c.fillRect(x, y, tw, th);
      c.save(); c.beginPath(); c.rect(x, y, tw, th); c.clip();
      figure(c, x + tw / 2, y + th * .72, th * .36, light ? '#111' : '#ddd', i % 2 === 0); c.restore();
    }
    glitch(c, 0, 0, w, h, 14);
  };
}
const texD = makeScreen(520, 330, collage(51));
const texE = makeScreen(440, 270, collage(77, '#e0a7a0'));
const texF = makeScreen(400, 260, (c, w, h, t) => {            // waveform timeline
  seed = 91;
  c.fillStyle = '#050506'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#bfb48f'; c.fillRect(20, 20, 150, 120);
  figure(c, 95, 118, 54, '#10b57a');
  c.fillStyle = GREEN;
  for (let x = 20; x < w - 20; x += 5) { const a = (Math.sin(x * .21 + t * 3) * .5 + .5) * (Math.sin(x * .043 + t) * .5 + .5) * 60 + 3; c.fillRect(x, 196 - a / 2, 3, a); }
  c.fillStyle = '#e8873a'; c.fillRect(190, 96, 190, 10); c.fillStyle = '#d4d4d6'; c.fillRect(190, 112, 150, 10);
  c.fillStyle = '#fff'; c.font = '12px monospace'; c.fillText('new_meta_v1_16', 190, 40); c.fillText('f ' + (Math.floor(t * 24) % 240), 190, 58);
}, true);
const texG = makeScreen(320, 280, (c, w, h, t) => {            // low box monitor
  seed = 5;
  c.fillStyle = '#060607'; c.fillRect(0, 0, w, h);
  grid(c, w, h, 28, 'rgba(255,255,255,.2)');
  glitch(c, 20, 20, 200, 60, 30);
  figure(c, 205, 215, 62, '#f0f0f0');
  c.fillStyle = '#fff'; c.font = 'bold 30px Helvetica,Arial'; c.fillText('YK', 150 - 40, 250);
  cross(c, 205, 130 + Math.sin(t) * 10, 9);
}, true);
const texH = makeScreen(240, 150, (c, w, h, t) => {            // tiny field monitor
  c.fillStyle = '#060607'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#fff'; c.font = '12px monospace'; c.fillText('REC', 12, 22); c.fillRect(12, 30, 90, 3);
  c.strokeStyle = GREEN; c.lineWidth = 3; c.beginPath();
  for (let x = 10; x < w - 10; x += 4) { const y = 95 + Math.sin(x * .18 + t * 5) * 26 * Math.sin(x * .03 + t); x === 10 ? c.moveTo(x, y) : c.lineTo(x, y); }
  c.stroke();
}, true);

/* ---------- world (everything that gets mirrored in the floor) ---------- */
const world = new THREE.Group();
scene.add(world);

/* ----- the figure ----- */
function buildFigure() {
  const g = new THREE.Group();

  // legs + garter straps
  for (const s of [-1, 1]) {
    rod(V(s * .105, .3, 0), V(s * .12, .82, 0), .05, M.skin, g, .062);
    rod(V(s * .12, .5, .058), V(s * .13, .8, .066), .007, M.plastic, g);
    mesh(new THREE.BoxGeometry(.03, .02, .012), M.metal, g, [s * .122, .56, .062]);

    // platform boots
    const b = new THREE.Group();
    b.position.set(s * .115, 0, .02);
    b.rotation.y = s * -.06;
    mesh(new RoundedBoxGeometry(.165, .075, .33, 4, .028), M.rubber, b, [0, .0375, .035]);
    mesh(new RoundedBoxGeometry(.17, .02, .34, 2, .008), M.white, b, [0, .082, .035]);
    mesh(new RoundedBoxGeometry(.15, .13, .29, 5, .055), M.puffer, b, [0, .155, .04]);
    mesh(new THREE.CylinderGeometry(.082, .074, .2, 24), M.puffer, b, [0, .3, -.035]);
    mesh(new RoundedBoxGeometry(.19, .1, .13, 4, .04), M.leather, b, [0, .36, -.03]);   // cuff
    for (const y of [.2, .27]) mesh(new RoundedBoxGeometry(.185, .028, .2, 3, .012), M.plastic, b, [0, y, -.01]);
    mesh(new THREE.BoxGeometry(.03, .04, .012), M.metal, b, [s * .05, .27, .092]);
    spike(b, V(s * .085, .36, -.03), V(s, .25, 0), .07, .016, M.metal);
    g.add(b);
  }

  // pleated skirt
  const skirt = surface((u, v, p) => {
    const th = u * Math.PI * 2;
    const r = THREE.MathUtils.lerp(.38, .22, v) * (1 + .05 * (1 - v * .6) * Math.sign(Math.sin(26 * th)) * Math.pow(Math.abs(Math.sin(26 * th)), .5));
    p.set(Math.cos(th) * r, THREE.MathUtils.lerp(.5, .86, v) + .012 * Math.sin(th * 3), -Math.sin(th) * r * .84);
  }, 312, 6);
  mesh(skirt, M.leather, g);

  // puffer body: five quilted bands, hem → collar
  mesh(pufferGeo({
    ys: [.72, .93, 1.1, 1.26, 1.41, 1.56],
    rs: [.33, .36, .345, .32, .23, .12],
    bulge: [.12, .1, .1, .13, .1],
    sx: 1.06, sz: .8,
  }), M.puffer, g);
  // ruffled hem
  mesh(pufferGeo({ ys: [.66, .76], rs: [.36, .34], bulge: [.05], sx: 1.08, sz: .82, pleats: 34, pucker: .16, per: 10 }), M.leather, g);

  // sleeves: chains of puffed segments swallowed by the body
  for (const s of [-1, 1]) {
    const seg = [[.36, 1.27, .17], [.43, 1.1, .17], [.46, .93, .16], [.46, .78, .14]];
    seg.forEach(([x, y, r], i) => {
      const m = mesh(puffBall(r, .72, 10 + i), M.puffer, g, [s * x, y, .03]);
      m.rotation.z = s * (-.25 + i * .09);
    });
    const cuff = mesh(pufferGeo({ ys: [0, .07], rs: [.09, .085], bulge: [.035], pleats: 16, pucker: .2, nu: 64, per: 8 }), M.leather, g, [s * .455, .62, .03]);
    cuff.rotation.z = s * .06;
    // drawstrings
    rod(V(s * .2, 1.24, .29), V(s * .2, 1.02, .34), .004, M.metal, g);
    rod(V(s * .25, .9, .33), V(s * .25, .72, .3), .004, M.metal, g);
  }

  // head: skin, shades, spiked mask
  const hc = V(0, 1.66, .0);
  const face = mesh(new THREE.SphereGeometry(.118, 32, 24), M.skin, g, [0, 1.655, .075]);
  face.scale.set(.88, 1.08, .9);
  mesh(new RoundedBoxGeometry(.215, .04, .03, 3, .012), M.glass, g, [0, 1.685, .175]);
  for (const s of [-1, 1]) rod(V(s * .105, 1.685, .17), V(s * .125, 1.69, .04), .006, M.plastic, g);
  const mask = mesh(new RoundedBoxGeometry(.165, .11, .09, 4, .035), M.puffer, g, [0, 1.59, .15]);
  mask.rotation.x = .12;
  for (const s of [-1, 1]) {
    spike(g, V(s * .07, 1.6, .16), V(s, .15, .25), .13, .03);
    spike(g, V(s * .06, 1.565, .17), V(s * .8, -.5, .5), .08, .022);
    rod(V(s * .05, 1.54, .19), V(s * .05, 1.44, .25), .0035, M.metal, g);
  }
  spike(g, V(0, 1.6, .19), V(0, -.1, 1), .07, .024);

  // spiked hood
  const hood = surface((u, v, p) => {
    const th = u * Math.PI * 2, ph = v * Math.PI;
    const s = Math.sin(ph);
    const k = .2 * (1 + .03 * Math.cos(6 * th) * s + .025 * Math.sin(9 * ph));
    p.set(Math.cos(th) * s * k * 1.02, -Math.cos(ph) * k * 1.08, Math.sin(th) * s * k * 1.05);
  }, 64, 32);
  const hoodMesh = mesh(hood, M.puffer, g, [hc.x, hc.y, -.035]);
  hoodMesh.userData.hood = true;
  // padded rim around the face
  const rimT = mesh(new THREE.TorusGeometry(.135, .05, 16, 40), M.puffer, g, [0, 1.665, .085]);
  rimT.scale.set(1, 1.12, .8);
  const N = 30;
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), a = i * 2.39996;
    const d = V(Math.cos(a) * r, y, Math.sin(a) * r);
    if (d.y < -.45 || (d.z > .55 && d.y < .45)) continue;       // keep neck + face clear
    const len = .1 + .12 * Math.abs(Math.sin(i * 1.7));
    spike(g, V(hc.x + d.x * .19, hc.y + d.y * .2, -.035 + d.z * .195), d, len, .034 + len * .06);
  }

  // chest print
  const pc = document.createElement('canvas'); pc.width = 512; pc.height = 128;
  const x = pc.getContext('2d');
  x.fillStyle = '#fff'; x.font = 'bold 15px Helvetica,Arial'; x.fillText('PRODUCED BY 2086®', 6, 38);
  x.font = '13px sans-serif'; x.fillText('夢食う虫も好き好き。', 6, 58);
  x.beginPath();
  for (let i = 0; i < 3; i++) { const ox = 392 + i * 30; x.moveTo(ox, 60); x.lineTo(ox + 14, 92); x.lineTo(ox + 28, 60); x.lineTo(ox + 20, 60); x.lineTo(ox + 14, 76); x.lineTo(ox + 8, 60); }
  x.fill();
  const pt = new THREE.CanvasTexture(pc); pt.colorSpace = THREE.SRGBColorSpace; pt.anisotropy = 8;
  const print = new THREE.Mesh(
    new THREE.CylinderGeometry(.385, .385, .15, 40, 1, true, -.72, 1.44),
    new THREE.MeshBasicMaterial({ map: pt, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }));
  print.position.set(0, 1.335, -.012);
  print.scale.set(1.06, 1, .93);
  g.add(print);

  // spiked backpack hanging by the leg
  const bag = new THREE.Group();
  bag.position.set(.43, .47, .12);
  bag.rotation.set(.05, -.35, -.08);
  const body = mesh(new RoundedBoxGeometry(.3, .4, .17, 6, .075), M.leather, bag);
  body.scale.set(1, 1, 1);
  mesh(new RoundedBoxGeometry(.24, .17, .06, 4, .028), M.puffer, bag, [0, -.08, .095]);
  for (let i = 0; i < 9; i++) {
    const a = -.25 + (i / 8) * (Math.PI + .5);
    spike(bag, V(Math.cos(a) * .13, .03 + Math.sin(a) * .17, 0), V(Math.cos(a), Math.sin(a), .1), .06, .016, M.metal);
  }
  const bc = document.createElement('canvas'); bc.width = 256; bc.height = 256;
  const y = bc.getContext('2d');
  y.fillStyle = '#fff'; y.font = 'bold 54px Helvetica,Arial'; y.fillText('ØX', 20, 96); y.fillText('ʞΩ', 128, 150);
  y.lineWidth = 5; y.strokeStyle = '#fff'; y.beginPath(); y.moveTo(30, 190); y.lineTo(110, 150); y.lineTo(140, 215); y.lineTo(225, 180); y.stroke();
  const bt = new THREE.CanvasTexture(bc); bt.colorSpace = THREE.SRGBColorSpace;
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(.22, .22), new THREE.MeshBasicMaterial({ map: bt, transparent: true, depthWrite: false }));
  tag.position.set(0, .07, .088);
  bag.add(tag);
  rod(V(-.07, .19, 0), V(-.16, .42, -.06), .007, M.plastic, bag);
  rod(V(.07, .19, 0), V(-.1, .42, -.06), .007, M.plastic, bag);
  g.add(bag);
  return g;
}
const figureGroup = buildFigure();
world.add(figureGroup);

/* ----- studio kit ----- */
function tripod(parent, x, z, topY, { spread = .36, hub = .5, r = .013, rot = 0 } = {}) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rot;
  const hy = topY * hub;
  rod(V(0, hy * .55, 0), V(0, topY, 0), r, M.metal, g, r * .8);
  mesh(new THREE.CylinderGeometry(r * 2.2, r * 2.2, .06, 12), M.plastic, g, [0, hy, 0]);
  mesh(new THREE.CylinderGeometry(r * 1.8, r * 1.8, .04, 12), M.plastic, g, [0, hy * .58, 0]);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + .5;
    const foot = V(Math.cos(a) * spread, .012, Math.sin(a) * spread);
    rod(V(0, hy, 0), foot, r * .95, M.metal, g, r * .8);
    rod(V(0, hy * .58, 0), foot.clone().multiplyScalar(.52).setY(hy * .5), r * .5, M.metal, g);
    mesh(new THREE.SphereGeometry(r * 1.7, 10, 8), M.rubber, g, [foot.x, .014, foot.z]);
  }
  parent.add(g);
  return g;
}
function monitor(parent, x, y, z, w, h, tex, { ry = 0, rx = 0, depth = .04, hood = false, handle = false } = {}) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.set(rx, ry, 0, 'YXZ');
  mesh(new RoundedBoxGeometry(w + .035, h + .035, depth, 3, .012), M.plastic, g);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  scr.position.z = depth / 2 + .001;
  g.add(scr);
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshPhysicalMaterial({ color: 0x000000, transparent: true, opacity: .1, roughness: .05 }));
  gl.position.z = depth / 2 + .002;
  g.add(gl);
  mesh(new RoundedBoxGeometry(w * .45, h * .45, .05, 2, .01), M.plastic, g, [0, 0, -depth / 2 - .02]);
  if (hood) {
    const d = .16;
    mesh(new THREE.BoxGeometry(w + .05, .008, d), M.plastic, g, [0, h / 2 + .02, depth / 2 + d / 2]);
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(.008, h + .04, d), M.plastic, g, [s * (w / 2 + .022), 0, depth / 2 + d / 2]);
  }
  if (handle) rod(V(w / 2 + .02, -.02, -.06), V(w / 2 + .3, -.1, -.1), .012, M.metal, g, .016);
  parent.add(g);
  return g;
}

const kit = new THREE.Group();
world.add(kit);

// left cluster
tripod(kit, -1.02, -.62, 1.3, { spread: .42, hub: .42 });
monitor(kit, -1.02, 1.66, -.6, 1.02, .66, texA, { ry: .22 });
tripod(kit, -1.62, -.1, .98, { spread: .4, hub: .5, rot: 1 });
monitor(kit, -1.62, 1.5 - .02, -.08, .56, .98, texB, { ry: .42 });
tripod(kit, -1.05, .5, .46, { spread: .44, hub: .75, rot: 2 });
monitor(kit, -1.05, .97, .52, .5, .96, texC, { ry: .3 });

// right cluster: tall c-stand with two rigs
tripod(kit, .95, -.25, 2.02, { spread: .5, hub: .16, r: .018, rot: .4 });
monitor(kit, .95, 2.2, -.2, .56, .36, texD, { ry: -.3, rx: .1, hood: true, depth: .07, handle: true });
rod(V(.95, 1.02, -.25), V(.8, 1.02, .22), .012, M.metal, kit);
mesh(new THREE.BoxGeometry(.07, .09, .07), M.plastic, kit, [.95, 1.02, -.25]);
monitor(kit, .78, 1.2, .26, .44, .27, texE, { ry: -.28, hood: true, depth: .06, handle: true });
mesh(new THREE.CylinderGeometry(.02, .028, .1, 12), M.plastic, kit, [.8, 1.03, .24]);

// far right: small monitor on a stool-top tripod
tripod(kit, 1.72, -.35, 1.22, { spread: .4, hub: .45, rot: 1.3 });
mesh(new THREE.CylinderGeometry(.17, .17, .025, 40), M.plastic, kit, [1.72, 1.23, -.35]);
mesh(new THREE.CylinderGeometry(.02, .03, .12, 12), M.plastic, kit, [1.72, 1.3, -.35]);
monitor(kit, 1.72, 1.5, -.33, .38, .25, texF, { ry: -.45 });

// floor level
tripod(kit, 1.45, .75, .3, { spread: .3, hub: .7, rot: .2 });
monitor(kit, 1.45, .47, .75, .3, .26, texG, { ry: -.5, rx: -.12, depth: .2 });
tripod(kit, .98, 1.05, .13, { spread: .17, hub: .7, r: .008 });
monitor(kit, .98, .2, 1.05, .19, .12, texH, { ry: -.2, rx: -.3, depth: .03 });

// white plinth + dolly wheels
const plinth = mesh(new RoundedBoxGeometry(1.5, .62, .95, 6, .09), M.white, kit, [1.75, .31, -.95]);
plinth.rotation.y = -.25;
const wedge = mesh(new RoundedBoxGeometry(.9, .28, .7, 5, .08), M.white, kit, [1.25, .15, -.3]);
wedge.rotation.set(0, .5, .12);
for (const [x, z] of [[1.52, .12], [1.72, .1]]) {
  const wh = mesh(new THREE.CylinderGeometry(.115, .115, .06, 32), M.rubber, kit, [x, .115, z]);
  wh.rotation.x = Math.PI / 2;
  const hubcap = mesh(new THREE.CylinderGeometry(.04, .04, .07, 16), M.metal, kit, [x, .115, z]);
  hubcap.rotation.x = Math.PI / 2;
}
rod(V(1.52, .115, .12), V(1.72, .115, .1), .012, M.metal, kit);
rod(V(1.62, .115, .11), V(1.3, .75, -.2), .014, M.metal, kit);

// cables
function cable(points, r = .0065) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => V(...p)), false, 'catmullrom', .6);
  mesh(new THREE.TubeGeometry(curve, 160, r, 6), M.rubber, kit);
}
const F = .008;
function wander(from, to, n, amp, sd) {
  seed = sd;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, k = Math.sin(Math.PI * t);
    pts.push([THREE.MathUtils.lerp(from[0], to[0], t) + rr(-amp, amp) * k, F, THREE.MathUtils.lerp(from[1], to[1], t) + rr(-amp, amp) * k]);
  }
  return pts;
}
cable([[-1.02, 1.45, -.66], [-1.06, .7, -.7], [-1.1, .1, -.6], ...wander([-1.1, -.45], [.4, 1.7], 7, .45, 3)]);
cable([[-1.62, 1.1, -.14], [-1.7, .4, -.2], [-1.72, F, -.05], ...wander([-1.6, .2], [-2.6, 1.9], 5, .4, 8)]);
cable([[-1.05, .6, .46], [-1.1, .15, .4], ...wander([-1.0, .6], [.2, 2.3], 6, .5, 13)]);
cable([[.95, 2.1, -.28], [1.02, 1.4, -.3], [1.0, .5, -.3], [1.05, F, -.1], ...wander([1.1, .1], [-.6, 2.0], 7, .55, 21)]);
cable([[1.72, 1.42, -.4], [1.86, 1.0, -.3], [1.9, .3, -.1], [1.85, F, .1], ...wander([1.8, .3], [2.7, 2.2], 5, .35, 34)]);
cable([[.78, 1.1, .2], [.7, .5, .3], [.72, F, .45], ...wander([.75, .6], [1.6, 2.4], 6, .4, 55)]);
cable(wander([-2.9, 1.3], [2.9, 1.55], 12, .3, 89), .0055);
cable(wander([-.3, .6], [1.4, .78], 6, .25, 144), .005);

/* ---------- glossy floor: mirrored copy seen through a translucent slab ---------- */
world.updateMatrixWorld(true);
const mirror = world.clone(true);
mirror.scale.y = -1;
mirror.traverse((o) => { o.castShadow = false; o.receiveShadow = false; });
scene.add(mirror);
const mirrorFigure = mirror.children[0];

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(30, 64),
  new THREE.MeshStandardMaterial({ color: 0x9fa0a4, roughness: .3, transparent: true, opacity: .87 }));
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
floor.renderOrder = 1;
scene.add(floor);

/* ---------- framing / loop ---------- */
function frame() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  const vf = THREE.MathUtils.degToRad(camera.fov) / 2;
  const dist = Math.max(1.42 / Math.tan(vf), 1.6 / (Math.tan(vf) * camera.aspect));
  const dir = camera.position.clone().sub(controls.target);
  if (dir.lengthSq() < 1e-6) dir.set(.12, .06, 1);
  camera.position.copy(controls.target).addScaledVector(dir.normalize(), dist);
  camera.updateProjectionMatrix();
}
addEventListener('resize', frame);
frame();

const hint = document.getElementById('hint');
controls.addEventListener('start', () => { controls.autoRotate = false; hint.classList.add('off'); });
let idle;
controls.addEventListener('end', () => { clearTimeout(idle); idle = setTimeout(() => (controls.autoRotate = true), 5000); });

const wave = document.getElementById('wave');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduce) controls.autoRotate = false;
const clock = new THREE.Clock();
let last = -1;
renderer.setAnimationLoop(() => {
  const t = clock.getElapsedTime();
  if (!reduce && t - last > .09) {
    last = t;
    for (const s of screens) if (s.live) s.redraw(t);
    let d = '';
    for (let i = 0; i <= 40; i++) {
      const x = 20 + i * 1.5, e = Math.sin((i / 40) * Math.PI);
      d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + (50 + Math.sin(i * .9 + t * 4) * 26 * e * Math.sin(i * .23 + t)).toFixed(1);
    }
    wave.setAttribute('d', d);
  }
  if (!reduce) {                                                // slow breathing
    const b = 1 + Math.sin(t * 1.3) * .006;
    figureGroup.scale.set(b, 1, b);
    mirrorFigure.scale.set(b, 1, b);
  }
  controls.update();
  renderer.render(scene, camera);
});
