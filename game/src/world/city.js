import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CFG } from '../config.js';
import { rng, facadePair, signTexture, asphaltTexture, wetnessTexture, glowTexture } from './textures.js';

const { roadWidth: RW, axes: AXES, limit: LIMIT } = CFG.world;
const HW = RW / 2;

/** Axis-aligned rect helper (x,z centre + half extents). */
const rect = (x, z, hx, hz) => ({ x, z, hx, hz });
const inRect = (r, x, z, pad = 0) => Math.abs(x - r.x) <= r.hx + pad && Math.abs(z - r.z) <= r.hz + pad;

/**
 * Procedural Neo-Tokyo grid around the hand-made hero district.
 * Returns the built group plus the data the rest of the game needs:
 * road rects (for the minimap + drivable test) and collidable meshes.
 */
export function buildCity({ heroFootprint, quality }) {
  const group = new THREE.Group();
  group.name = 'city';
  const r = rng(20240719);
  const roads = [];
  const collide = [];

  // ---------------------------------------------------------------- roads
  for (const a of AXES) {
    roads.push(rect(a, 0, HW, LIMIT));          // along Z
    roads.push(rect(0, a, LIMIT, HW));          // along X
  }

  const asphalt = asphaltTexture();
  asphalt.repeat.set(LIMIT / 12, LIMIT / 12);
  const wet = wetnessTexture();
  wet.repeat.set(LIMIT / 9, LIMIT / 9);
  const roadMat = new THREE.MeshStandardMaterial({
    map: asphalt, roughnessMap: wet, roughness: 0.62, metalness: 0.18, color: 0xc4ccd9,
  });

  // one big slab for the whole lot: simpler than stitching strips and the
  // blocks sit on top of it anyway
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(LIMIT * 2, LIMIT * 2, 1, 1), roadMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  group.add(ground);
  collide.push(ground);

  // ------------------------------------------------------- block surfaces
  // Pavement inside each block so roads read as roads.
  const blocks = [];
  const edges = [-LIMIT, ...AXES, LIMIT];
  for (let i = 0; i < edges.length - 1; i++) {
    for (let j = 0; j < edges.length - 1; j++) {
      const x0 = edges[i] + (i === 0 ? 0 : HW), x1 = edges[i + 1] - (i === edges.length - 2 ? 0 : HW);
      const z0 = edges[j] + (j === 0 ? 0 : HW), z1 = edges[j + 1] - (j === edges.length - 2 ? 0 : HW);
      if (x1 - x0 < 8 || z1 - z0 < 8) continue;
      blocks.push(rect((x0 + x1) / 2, (z0 + z1) / 2, (x1 - x0) / 2, (z1 - z0) / 2));
    }
  }

  const kerbGeos = [];
  const pavementGeos = [];
  for (const b of blocks) {
    const hero = heroFootprint && Math.abs(b.x - heroFootprint.x) < 1 && Math.abs(b.z - heroFootprint.z) < 1;
    // kerb ring
    const kh = 0.16;
    const ring = [
      [b.x, b.z - b.hz, b.hx, 0.35], [b.x, b.z + b.hz, b.hx, 0.35],
      [b.x - b.hx, b.z, 0.35, b.hz], [b.x + b.hx, b.z, 0.35, b.hz],
    ];
    for (const [x, z, hx, hz] of ring) {
      const g = new THREE.BoxGeometry(hx * 2, kh, hz * 2);
      g.translate(x, kh / 2, z);
      kerbGeos.push(g);
    }
    if (!hero) {
      const g = new THREE.PlaneGeometry(b.hx * 2 - 0.6, b.hz * 2 - 0.6);
      g.rotateX(-Math.PI / 2);
      g.translate(b.x, 0.14, b.z);
      const uv = g.getAttribute('uv');
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * b.hx * 0.25, uv.getY(i) * b.hz * 0.25);
      pavementGeos.push(g);
    }
  }
  const kerbMat = new THREE.MeshStandardMaterial({ color: 0x2b2f38, roughness: 0.8, metalness: 0.1 });
  const kerbs = new THREE.Mesh(mergeGeometries(kerbGeos), kerbMat);
  kerbs.receiveShadow = true;
  group.add(kerbs);
  collide.push(kerbs);

  const pavementTex = asphaltTexture(31);
  pavementTex.repeat.set(1, 1);
  const pavement = new THREE.Mesh(mergeGeometries(pavementGeos), new THREE.MeshStandardMaterial({
    map: pavementTex, color: 0x8b91a0, roughness: 0.85, metalness: 0.05,
  }));
  pavement.receiveShadow = true;
  group.add(pavement);
  collide.push(pavement);

  // --------------------------------------------------------- road marking
  const lineGeos = [];
  const pushQuad = (x, z, hx, hz, y = 0.005) => {
    const g = new THREE.PlaneGeometry(hx * 2, hz * 2);
    g.rotateX(-Math.PI / 2);
    g.translate(x, y, z);
    lineGeos.push(g);
  };
  for (const a of AXES) {
    // dashed centre line, skipping intersections
    for (let t = -LIMIT; t < LIMIT; t += 9) {
      const skip = AXES.some((b) => Math.abs(t - b) < HW + 3);
      if (!skip) { pushQuad(a, t, 0.16, 2.2); pushQuad(t, a, 2.2, 0.16); }
    }
    // kerb-side solid lines
    for (const s of [-1, 1]) {
      const off = HW - 0.7;
      pushQuad(a + s * off, 0, 0.12, LIMIT);
      pushQuad(0, a + s * off, LIMIT, 0.12);
    }
  }
  // zebra crossings at every intersection
  for (const ax of AXES) {
    for (const az of AXES) {
      for (let k = -3; k <= 3; k++) {
        pushQuad(ax + k * 1.9, az - HW + 1.6, 0.6, 1.4, 0.006);
        pushQuad(ax + k * 1.9, az + HW - 1.6, 0.6, 1.4, 0.006);
        pushQuad(ax - HW + 1.6, az + k * 1.9, 1.4, 0.6, 0.006);
        pushQuad(ax + HW - 1.6, az + k * 1.9, 1.4, 0.6, 0.006);
      }
    }
  }
  const lines = new THREE.Mesh(mergeGeometries(lineGeos), new THREE.MeshStandardMaterial({
    color: 0x9aa3b2, roughness: 0.75, metalness: 0.0, emissive: 0x05070a,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  }));
  group.add(lines);

  // ------------------------------------------------------------ buildings
  const styles = [];
  for (let i = 0; i < 4; i++) {
    const tints = ['#242b3d', '#2b2533', '#1e2531', '#28303f'];
    const pair = facadePair(101 + i * 37, tints[i]);
    styles.push({ ...pair, geos: [] });
  }
  const signSpecs = [];
  const acGeos = [];
  const roofGeos = [];

  for (const b of blocks) {
    if (heroFootprint && Math.abs(b.x - heroFootprint.x) < 1 && Math.abs(b.z - heroFootprint.z) < 1) continue;
    const distC = Math.hypot(b.x, b.z);
    const lots = splitBlock(b, r, distC);
    for (const lot of lots) {
      const near = 1 - Math.min(1, distC / 300);
      const h = Math.round(9 + r() * 22 + near * (14 + r() * 46));
      const style = styles[(r() * styles.length) | 0];
      const w = lot.hx * 2, d = lot.hz * 2;
      const geo = new THREE.BoxGeometry(w, h, d);
      geo.translate(lot.x, h / 2, lot.z);
      // scale UVs so windows stay the same size on every tower
      const uv = geo.getAttribute('uv');
      const per = 12; // metres covered by one 8x8 window tile
      // box uv sets: +x,-x,+y,-y,+z,-z (4 verts each)
      const faceScale = [
        [d / per, h / per], [d / per, h / per],
        [w / per, d / per], [w / per, d / per],
        [w / per, h / per], [w / per, h / per],
      ];
      for (let f = 0; f < 6; f++) {
        for (let k = 0; k < 4; k++) {
          const i = f * 4 + k;
          uv.setXY(i, uv.getX(i) * faceScale[f][0], uv.getY(i) * faceScale[f][1]);
        }
      }
      style.geos.push(geo);

      // roof cap + rooftop clutter
      const rg = new THREE.BoxGeometry(w + 0.5, 0.6, d + 0.5);
      rg.translate(lot.x, h + 0.2, lot.z);
      roofGeos.push(rg);
      const units = 1 + ((r() * 3) | 0);
      for (let u = 0; u < units; u++) {
        const uw = 1.2 + r() * 2.4, uh = 0.9 + r() * 2.2, ud = 1.2 + r() * 2.4;
        const g = new THREE.BoxGeometry(uw, uh, ud);
        g.translate(lot.x + (r() - 0.5) * (w - uw - 1), h + 0.5 + uh / 2, lot.z + (r() - 0.5) * (d - ud - 1));
        acGeos.push(g);
      }
      // neon signs on the two street-facing walls
      // a lot faces the street when its own edge sits on the block edge
      const faces = [];
      if (Math.abs((lot.z - lot.hz) - (b.z - b.hz)) < 3.2) faces.push([0, -1]);
      if (Math.abs((lot.z + lot.hz) - (b.z + b.hz)) < 3.2) faces.push([0, 1]);
      if (Math.abs((lot.x - lot.hx) - (b.x - b.hx)) < 3.2) faces.push([-1, 0]);
      if (Math.abs((lot.x + lot.hx) - (b.x + b.hx)) < 3.2) faces.push([1, 0]);
      for (const f of faces) {
        const count = 1 + ((r() * 3) | 0);
        for (let s = 0; s < count; s++) {
          if (r() < 0.32) continue;
          signSpecs.push({
            lot, h, face: f, y: 3 + r() * Math.max(2, h - 8),
            vertical: r() < 0.6, seed: (r() * 1e6) | 0, colorIdx: (r() * 6) | 0,
          });
        }
      }
    }
  }

  const buildingMeshes = [];
  for (const s of styles) {
    if (!s.geos.length) continue;
    const mat = new THREE.MeshStandardMaterial({
      map: s.map, emissiveMap: s.emissive, emissive: 0xffffff, emissiveIntensity: 1.9,
      roughness: 0.78, metalness: 0.12, color: 0xb9c2d4,
    });
    const mesh = new THREE.Mesh(mergeGeometries(s.geos), mat);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    group.add(mesh);
    collide.push(mesh);
    buildingMeshes.push(mesh);
  }
  const concrete = new THREE.MeshStandardMaterial({ color: 0x23262e, roughness: 0.9, metalness: 0.1 });
  if (roofGeos.length) { const m = new THREE.Mesh(mergeGeometries(roofGeos), concrete); group.add(m); collide.push(m); }
  if (acGeos.length) { const m = new THREE.Mesh(mergeGeometries(acGeos), concrete); group.add(m); }

  // ---------------------------------------------------------------- signs
  const NEON = ['#ff2d6f', '#19f0ff', '#ffe23d', '#8b5cff', '#39ff88', '#ff7a18'];
  const signTex = NEON.map((c, i) => ({
    color: c,
    v: signTexture(700 + i * 13, c, true),
    h: signTexture(900 + i * 17, c, false),
  }));
  const signMats = signTex.map((t) => ({
    v: new THREE.MeshBasicMaterial({ map: t.v, transparent: true, side: THREE.DoubleSide, toneMapped: false, color: new THREE.Color(t.color).multiplyScalar(1.7) }),
    h: new THREE.MeshBasicMaterial({ map: t.h, transparent: true, side: THREE.DoubleSide, toneMapped: false, color: new THREE.Color(t.color).multiplyScalar(1.7) }),
  }));
  const signGroup = new THREE.Group();
  const signBuckets = NEON.map(() => ({ v: [], h: [] }));
  // spread signs over the whole city instead of the first blocks generated
  for (let i = signSpecs.length - 1; i > 0; i--) {
    const j = (r() * (i + 1)) | 0;
    [signSpecs[i], signSpecs[j]] = [signSpecs[j], signSpecs[i]];
  }
  const maxSigns = quality === 'low' ? 260 : 900;
  const mat4 = new THREE.Matrix4();
  const eul = new THREE.Euler();
  const quat = new THREE.Quaternion();
  const scl = new THREE.Vector3();
  const pos3 = new THREE.Vector3();
  for (let i = 0; i < Math.min(signSpecs.length, maxSigns); i++) {
    const s = signSpecs[i];
    const vertical = s.vertical;
    const g = new THREE.PlaneGeometry(vertical ? 1.1 : 4.4, vertical ? 4.4 : 1.1);
    const off = 0.4;
    let ry = 0;
    if (s.face[0] !== 0) ry = s.face[0] > 0 ? Math.PI / 2 : -Math.PI / 2;
    else if (s.face[1] < 0) ry = Math.PI;
    const sc = 0.75 + ((s.seed % 100) / 100) * 1.35;
    pos3.set(s.lot.x + s.face[0] * (s.lot.hx + off), s.y, s.lot.z + s.face[1] * (s.lot.hz + off));
    quat.setFromEuler(eul.set(0, ry, 0));
    scl.setScalar(sc);
    g.applyMatrix4(mat4.compose(pos3, quat, scl));
    signBuckets[s.colorIdx][vertical ? 'v' : 'h'].push(g);
  }
  signBuckets.forEach((b, i) => {
    for (const key of ['v', 'h']) {
      if (!b[key].length) continue;
      const mesh = new THREE.Mesh(mergeGeometries(b[key]), signMats[i][key]);
      mesh.frustumCulled = false;
      mesh.userData.noCollide = true;
      signGroup.add(mesh);
    }
  });
  group.add(signGroup);

  // ---------------------------------------------------------- street lamps
  const lampPoles = [];
  const poleGeos = [];
  const headGeos = [];
  for (const a of AXES) {
    for (let t = -LIMIT + 20; t < LIMIT; t += 34) {
      if (AXES.some((b) => Math.abs(t - b) < HW + 6)) continue;
      lampPoles.push([a - HW + 1.1, t, 1], [a + HW - 1.1, t, -1]);
      lampPoles.push([t, a - HW + 1.1, 2], [t, a + HW - 1.1, -2]);
    }
  }
  // ring the hero district as well: it sits in the middle of an open block
  for (let t = -34; t <= 34; t += 17) {
    lampPoles.push([t, 38.5, -2], [t, -38.5, 2], [38.5, t, -1], [-38.5, t, 1]);
  }

  for (const [x, z, dir] of lampPoles) {
    const g = new THREE.CylinderGeometry(0.12, 0.16, 7, 6);
    g.translate(x, 3.5, z);
    poleGeos.push(g);
    const sx = Math.abs(dir) === 1 ? Math.sign(dir) * 1.5 : 0;
    const sz = Math.abs(dir) === 2 ? Math.sign(dir) * 1.5 : 0;
    const arm = new THREE.BoxGeometry(Math.abs(sx) ? 3 : 0.16, 0.16, Math.abs(sz) ? 3 : 0.16);
    arm.translate(x + sx / 2, 6.9, z + sz / 2);
    poleGeos.push(arm);
    const head = new THREE.BoxGeometry(1.0, 0.22, 0.6);
    head.translate(x + sx, 6.7, z + sz);
    headGeos.push(head);
  }
  const poles = new THREE.Mesh(mergeGeometries(poleGeos), new THREE.MeshStandardMaterial({ color: 0x1b1e24, roughness: 0.7, metalness: 0.6 }));
  group.add(poles);
  collide.push(poles);
  const heads = new THREE.Mesh(mergeGeometries(headGeos), new THREE.MeshBasicMaterial({ color: 0xffe6b8, toneMapped: false }));
  group.add(heads);

  // light pools on the tarmac
  const pool = glowTexture('rgba(255,214,150,0.55)', 'rgba(255,150,70,0)', 0.55);
  const poolMat = new THREE.MeshBasicMaterial({ map: pool, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const poolGeo = new THREE.PlaneGeometry(8.5, 8.5);
  const pools = new THREE.InstancedMesh(poolGeo, poolMat, lampPoles.length);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  lampPoles.forEach(([x, z, dir], i) => {
    const sx = Math.abs(dir) === 1 ? Math.sign(dir) * 1.5 : 0;
    const sz = Math.abs(dir) === 2 ? Math.sign(dir) * 1.5 : 0;
    m4.compose(new THREE.Vector3(x + sx, 0.03, z + sz), q, new THREE.Vector3(1, 1, 1));
    pools.setMatrixAt(i, m4);
  });
  pools.instanceMatrix.needsUpdate = true;
  pools.renderOrder = 2;
  group.add(pools);

  // -------------------------------------------------------- world boundary
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x0c0e13, roughness: 0.9, metalness: 0.2 });
  const wallGeos = [];
  for (const [x, z, hx, hz] of [
    [0, -LIMIT, LIMIT, 1], [0, LIMIT, LIMIT, 1], [-LIMIT, 0, 1, LIMIT], [LIMIT, 0, 1, LIMIT],
  ]) {
    const g = new THREE.BoxGeometry(hx * 2, 14, hz * 2);
    g.translate(x, 7, z);
    wallGeos.push(g);
  }
  const walls = new THREE.Mesh(mergeGeometries(wallGeos), wallMat);
  group.add(walls);
  collide.push(walls);

  // ------------------------------------------------------- distant skyline
  const far = [];
  for (let i = 0; i < 150; i++) {
    const ang = r() * Math.PI * 2;
    const rad = LIMIT + 60 + r() * 420;
    const h = 40 + r() * 190;
    const w = 14 + r() * 40;
    const g = new THREE.BoxGeometry(w, h, w);
    g.translate(Math.cos(ang) * rad, h / 2 - 6, Math.sin(ang) * rad);
    far.push(g);
  }
  const skyline = new THREE.Mesh(mergeGeometries(far), new THREE.MeshBasicMaterial({ color: 0x0b1020, fog: true }));
  skyline.frustumCulled = false;
  skyline.userData.noCollide = true;
  group.add(skyline);

  return { group, roads, blocks, collide, signGroup, lampPoles };
}

/** Recursively split a city block into building lots with a street setback. */
function splitBlock(b, r, distC) {
  const setback = 1.6;
  const out = [];
  const lots = [rect(b.x, b.z, b.hx - setback, b.hz - setback)];
  const targetMax = distC < 120 ? 26 : 34;
  let guard = 0;
  while (lots.length && guard++ < 400) {
    const l = lots.pop();
    if (l.hx < 5 || l.hz < 5) continue;
    const big = Math.max(l.hx, l.hz) * 2 > targetMax;
    if (big || (r() < 0.55 && Math.max(l.hx, l.hz) > 9)) {
      const alongX = l.hx > l.hz;
      const cut = 0.35 + r() * 0.3;
      const gap = 0.9 + r() * 1.4;
      if (alongX) {
        const w = l.hx * 2, a = w * cut, bw = w - a - gap;
        if (a < 7 || bw < 7) { out.push(l); continue; }
        lots.push(rect(l.x - l.hx + a / 2, l.z, a / 2, l.hz));
        lots.push(rect(l.x + l.hx - bw / 2, l.z, bw / 2, l.hz));
      } else {
        const d = l.hz * 2, a = d * cut, bd = d - a - gap;
        if (a < 7 || bd < 7) { out.push(l); continue; }
        lots.push(rect(l.x, l.z - l.hz + a / 2, l.hx, a / 2));
        lots.push(rect(l.x, l.z + l.hz - bd / 2, l.hx, bd / 2));
      }
    } else out.push(l);
  }
  return out;
}
