import * as THREE from 'three';
import { CFG } from '../config.js';
import { glowTexture, rng } from './textures.js';

const _v = new THREE.Vector3();

/** A neon torii-ish gate you ride through. */
export class Checkpoints {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.userData.noCollide = true;
    scene.add(this.group);
    this.list = [];
    this.index = 0;
    this.t = 0;

    const tube = new THREE.CylinderGeometry(0.16, 0.16, 7.4, 8);
    this.pillarGeo = tube;
    this.beamGeo = new THREE.BoxGeometry(11.2, 0.34, 0.34);
    this.matA = new THREE.MeshBasicMaterial({ color: 0x19f0ff, toneMapped: false });
    this.matB = new THREE.MeshBasicMaterial({ color: 0xff2d6f, toneMapped: false });
    this.matDone = new THREE.MeshBasicMaterial({ color: 0x1d3a33, toneMapped: false });
    this.curtainMat = new THREE.MeshBasicMaterial({
      map: glowTexture('rgba(120,255,255,0.75)', 'rgba(40,120,255,0)'),
      transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending,
      depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
    });
    this.curtainGeo = new THREE.PlaneGeometry(10.6, 7);
  }

  build(points) {
    this.clear();
    points.forEach((p, i) => {
      const g = new THREE.Group();
      g.position.set(p.x, p.y ?? 0, p.z);
      g.rotation.y = p.rot || 0;
      const mat = i === 0 ? this.matA : this.matB;
      for (const s of [-1, 1]) {
        const pil = new THREE.Mesh(this.pillarGeo, mat);
        pil.position.set(s * 5.4, 3.7, 0);
        g.add(pil);
      }
      const beam = new THREE.Mesh(this.beamGeo, mat);
      beam.position.y = 7.3;
      g.add(beam);
      const curtain = new THREE.Mesh(this.curtainGeo, this.curtainMat.clone());
      curtain.position.y = 3.6;
      g.add(curtain);
      g.userData = { curtain, mat, pillars: g.children.slice(0, 2), beam, index: i, done: false, pos: new THREE.Vector3(p.x, p.y ?? 0, p.z) };
      this.group.add(g);
      this.list.push(g);
    });
    this.index = 0;
    this.refresh();
  }

  clear() {
    for (const g of this.list) this.group.remove(g);
    this.list = [];
    this.index = 0;
  }

  refresh() {
    this.list.forEach((g, i) => {
      const active = i === this.index;
      const done = i < this.index;
      g.visible = !done;
      const m = active ? this.matA : this.matB;
      g.userData.pillars.forEach((p) => (p.material = done ? this.matDone : m));
      g.userData.beam.material = done ? this.matDone : m;
      g.userData.curtain.visible = active;
      g.userData.curtain.material.opacity = active ? 0.34 : 0;
    });
  }

  get target() { return this.list[this.index] || null; }

  /** @returns true when the bike passed through the active gate */
  test(bike, radius = CFG.game.checkpointRadius) {
    const t = this.target;
    if (!t) return false;
    const d = _v.copy(bike.pos).sub(t.userData.pos);
    d.y = 0;
    if (d.lengthSq() <= radius * radius) {
      this.index++;
      this.refresh();
      return true;
    }
    return false;
  }

  update(dt, camera) {
    this.t += dt;
    const t = this.target;
    if (t) {
      const pulse = 0.28 + Math.sin(this.t * 4.2) * 0.12;
      t.userData.curtain.material.opacity = pulse;
      t.userData.curtain.lookAt(camera.position.x, t.userData.curtain.getWorldPosition(_v).y, camera.position.z);
    }
  }
}

/** Lay out a route: a loop around the grid plus a detour into the alley. */
export function makeRoute(collision, seed = 99) {
  const r = rng(seed);
  const { axes } = CFG.world;
  const ring = [];
  const outer = [axes[1], axes[4]];      // -120 / 120
  const mid = [axes[2], axes[3]];        // -45 / 45
  const corners = [
    [mid[1], mid[1]], [outer[1], mid[1]], [outer[1], outer[1]], [mid[1], outer[1]],
    [mid[0], outer[1]], [outer[0], outer[1]], [outer[0], mid[1]], [outer[0], mid[0]],
    [outer[0], outer[0]], [mid[0], outer[0]], [mid[0], mid[0]], [mid[1], mid[0]],
  ];
  for (const [x, z] of corners) {
    const jx = (r() - 0.5) * 22, jz = (r() - 0.5) * 22;
    const alongZ = Math.abs(x) > Math.abs(z);
    ring.push({
      x: alongZ ? x : x + jx,
      z: alongZ ? z + jz : z,
      rot: alongZ ? 0 : Math.PI / 2,
    });
  }
  // the hero alley: ride through the Japanese street
  ring.splice(1, 0, { x: CFG.world.heroAlleyMouth[0], z: CFG.world.heroAlleyMouth[1] - 3, rot: 0, alley: true });
  ring.splice(2, 0, { x: CFG.world.heroAlleyMouth[0] - 1.5, z: CFG.world.heroAlleyMouth[1] - 20, rot: 0, alley: true });

  // settle each gate onto the ground
  for (const p of ring) {
    const hit = collision.sampleGround(p.x, p.z, 40, 120);
    p.y = hit ? hit.y : 0;
  }
  return ring;
}
