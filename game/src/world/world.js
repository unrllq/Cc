import * as THREE from 'three';
import { CFG } from '../config.js';
import { buildSky } from './sky.js';
import { placeHero } from './hero.js';
import { asphaltTexture } from './textures.js';
import { CollisionWorld } from '../engine/collision.js';

/**
 * The world is the supplied street model. Everything we add around it is
 * only what a game needs: a flat apron to ride out onto and a boundary so
 * you cannot leave the scene.
 */
export function buildWorld({ scene, renderer, assets, quality }) {
  const sky = buildSky(scene, renderer);
  const hero = placeHero(assets.street.scene, { anisotropy: quality === 'low' ? 2 : 8 });
  scene.add(hero.group);

  const group = new THREE.Group();
  group.name = 'surroundings';

  // ---- apron -----------------------------------------------------------
  const A = CFG.world.apron;
  const tex = asphaltTexture(17, '#6a6b6d', 96, '92,92,94');
  tex.repeat.set(A / 3, A / 3);
  const apron = new THREE.Mesh(
    new THREE.PlaneGeometry(A * 2, A * 2),
    new THREE.MeshStandardMaterial({ map: tex, color: 0xe8e6e0, roughness: 0.97, metalness: 0.0 }),
  );
  apron.rotation.x = -Math.PI / 2;
  apron.position.y = -0.02;
  apron.receiveShadow = true;
  group.add(apron);

  // ---- boundary --------------------------------------------------------
  const L = CFG.world.limit;
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xb3bcc6, roughness: 0.95, metalness: 0.0, side: THREE.DoubleSide, fog: true,
  });
  const wall = new THREE.Group();
  for (const [x, z, w, rot] of [[0, -L, L * 2, 0], [0, L, L * 2, 0], [-L, 0, L * 2, Math.PI / 2], [L, 0, L * 2, Math.PI / 2]]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 2.4), wallMat);
    m.position.set(x, 1.2, z);
    m.rotation.y = rot;
    m.receiveShadow = true;
    wall.add(m);
  }
  group.add(wall);
  scene.add(group);

  const t0 = performance.now();
  const collision = new CollisionWorld().build([hero.group, group], {
    floorSlope: 0.6,
    skip: (o) => o.isInstancedMesh || o.name === 'skidmarks' || !!o.userData.noCollide,
  });
  const buildMs = performance.now() - t0;

  const map = new DrivableMap(collision, hero.bounds).build();

  return { sky, hero, apron, collision, map, stats: { tris: collision.triCount, buildMs } };
}

/**
 * Occupancy grid of everywhere the bike can actually stand. Drives the
 * minimap, respawns and checkpoint placement, so the track adapts to
 * whatever the model's geometry allows instead of being hard-coded.
 */
export class DrivableMap {
  constructor(collision, bounds, { step = 2, pad = 34, radius = 0.95 } = {}) {
    this.collision = collision;
    this.step = step;
    this.radius = radius;
    this.minX = Math.floor(bounds.min.x) - pad;
    this.maxX = Math.ceil(bounds.max.x) + pad;
    this.minZ = Math.floor(bounds.min.z) - pad;
    this.maxZ = Math.ceil(bounds.max.z) + pad;
    this.w = Math.ceil((this.maxX - this.minX) / step) + 1;
    this.h = Math.ceil((this.maxZ - this.minZ) / step) + 1;
    this.cells = new Uint8Array(this.w * this.h);      // 0 blocked, 1 drivable
    this.height = new Float32Array(this.w * this.h);
    this.inside = new Uint8Array(this.w * this.h);     // inside the model's footprint
    this.bounds = bounds;
  }

  idx(ix, iz) { return iz * this.w + ix; }
  toWorldX(ix) { return this.minX + ix * this.step; }
  toWorldZ(iz) { return this.minZ + iz * this.step; }
  toCellX(x) { return Math.round((x - this.minX) / this.step); }
  toCellZ(z) { return Math.round((z - this.minZ) / this.step); }

  build() {
    const g = { y: 0, normal: new THREE.Vector3() };
    const b = this.bounds;
    for (let iz = 0; iz < this.h; iz++) {
      for (let ix = 0; ix < this.w; ix++) {
        const x = this.toWorldX(ix), z = this.toWorldZ(iz);
        const i = this.idx(ix, iz);
        this.inside[i] = x >= b.min.x && x <= b.max.x && z >= b.min.z && z <= b.max.z ? 1 : 0;
        const hit = this.collision.sampleGround(x, z, 1.4, 60, g);
        if (!hit || hit.normal.y < 0.85) continue;
        if (!this.collision.isClear(x, hit.y + 1.0, z, this.radius)) continue;
        this.cells[i] = 1;
        this.height[i] = hit.y;
      }
    }
    return this;
  }

  /** Keep only what is reachable from a seed, so no gate lands in a courtyard. */
  reachableFrom(x, z) {
    const start = this.idx(this.toCellX(x), this.toCellZ(z));
    const out = new Uint8Array(this.cells.length);
    if (!this.cells[start]) {
      const near = this.nearestDrivable(x, z);
      if (!near) return out;
      return this.reachableFrom(near.x, near.z);
    }
    const queue = [start];
    out[start] = 1;
    while (queue.length) {
      const i = queue.pop();
      const ix = i % this.w, iz = (i / this.w) | 0;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const jx = ix + dx, jz = iz + dz;
        if (jx < 0 || jz < 0 || jx >= this.w || jz >= this.h) continue;
        const j = this.idx(jx, jz);
        if (out[j] || !this.cells[j]) continue;
        if (Math.abs(this.height[j] - this.height[i]) > 0.6) continue;   // no hopping onto roofs
        out[j] = 1;
        queue.push(j);
      }
    }
    this.reachable = out;
    return out;
  }

  nearestDrivable(x, z, maxRings = 40) {
    const cx = this.toCellX(x), cz = this.toCellZ(z);
    for (let r = 0; r <= maxRings; r++) {
      for (let dz = -r; dz <= r; dz++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
          const ix = cx + dx, iz = cz + dz;
          if (ix < 0 || iz < 0 || ix >= this.w || iz >= this.h) continue;
          const i = this.idx(ix, iz);
          if (this.cells[i]) return { x: this.toWorldX(ix), z: this.toWorldZ(iz), y: this.height[i] };
        }
      }
    }
    return null;
  }

  isDrivable(x, z) {
    const ix = this.toCellX(x), iz = this.toCellZ(z);
    if (ix < 0 || iz < 0 || ix >= this.w || iz >= this.h) return false;
    const i = this.idx(ix, iz);
    return !!(this.reachable ? this.reachable[i] : this.cells[i]);
  }

  /** Snap a designed point onto real ground, keeping the intended spot close. */
  snap(x, z, maxSlide = 6) {
    if (this.isDrivable(x, z)) {
      const i = this.idx(this.toCellX(x), this.toCellZ(z));
      return { x, z, y: this.height[i] };
    }
    const step = this.step;
    for (let r = step; r <= maxSlide; r += step) {
      for (let a = 0; a < 16; a++) {
        const ang = (a / 16) * Math.PI * 2;
        const nx = x + Math.cos(ang) * r, nz = z + Math.sin(ang) * r;
        if (this.isDrivable(nx, nz)) {
          const i = this.idx(this.toCellX(nx), this.toCellZ(nz));
          return { x: nx, z: nz, y: this.height[i] };
        }
      }
    }
    const near = this.nearestDrivable(x, z);
    return near || { x, z, y: 0 };
  }

  /** Top-down image of the drivable surface, used as the minimap background. */
  toCanvas(scale = 3) {
    const c = document.createElement('canvas');
    c.width = this.w * scale;
    c.height = this.h * scale;
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(28,34,44,0.55)';
    g.fillRect(0, 0, c.width, c.height);
    for (let iz = 0; iz < this.h; iz++) {
      for (let ix = 0; ix < this.w; ix++) {
        const i = this.idx(ix, iz);
        const on = this.reachable ? this.reachable[i] : this.cells[i];
        if (!on) continue;
        g.fillStyle = this.inside[i] ? '#cfd8e4' : '#9aa6b4';
        g.fillRect(ix * scale, iz * scale, scale, scale);
      }
    }
    return c;
  }
}
