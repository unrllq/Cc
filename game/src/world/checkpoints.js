import * as THREE from 'three';
import { CFG } from '../config.js';

const _v = new THREE.Vector3();

/** Orange-and-white race gate, sized to the gap it stands in. */
function stripeTexture() {
  const c = document.createElement('canvas');
  c.width = 32; c.height = 128;
  const g = c.getContext('2d');
  for (let i = 0; i < 8; i++) {
    g.fillStyle = i % 2 ? '#ffffff' : '#ff6a1a';
    g.fillRect(0, i * 16, 32, 16);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export class Checkpoints {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.userData.noCollide = true;
    scene.add(this.group);
    this.list = [];
    this.index = 0;
    this.t = 0;

    const stripes = stripeTexture();
    this.pillarGeo = new THREE.CylinderGeometry(0.17, 0.2, 4.6, 10);
    this.matPole = new THREE.MeshStandardMaterial({ map: stripes, roughness: 0.6, metalness: 0.05 });
    this.matNext = new THREE.MeshStandardMaterial({
      color: 0x18e0ff, emissive: 0x0d6d80, emissiveIntensity: 1.6, roughness: 0.4, metalness: 0.1,
    });
    this.matDone = new THREE.MeshStandardMaterial({ color: 0x8b939e, roughness: 0.8 });
    this.matNextPole = new THREE.MeshStandardMaterial({ color: 0xb7bec8, roughness: 0.7, transparent: true, opacity: 0.55 });
    this.curtainMat = new THREE.MeshBasicMaterial({
      color: 0x36e2ff, transparent: true, opacity: 0.16, side: THREE.DoubleSide,
      depthWrite: false, toneMapped: false,
    });
    this.bannerMat = new THREE.MeshBasicMaterial({ color: 0x18e0ff, toneMapped: false });
  }

  build(points) {
    this.clear();
    points.forEach((p, i) => {
      const g = new THREE.Group();
      g.position.set(p.x, p.y ?? 0, p.z);
      g.rotation.y = p.rot || 0;
      const hw = p.halfWidth ?? 5.2;
      const height = Math.min(4.6, Math.max(2.8, hw * 1.15));

      for (const s of [-1, 1]) {
        const pil = new THREE.Mesh(this.pillarGeo, this.matPole);
        pil.scale.y = height / 4.6;
        pil.position.set(s * hw, (height / 2), 0);
        pil.castShadow = true;
        g.add(pil);
      }
      const banner = new THREE.Mesh(new THREE.BoxGeometry(hw * 2, 0.5, 0.18), this.bannerMat);
      banner.position.y = height - 0.1;
      g.add(banner);

      const curtain = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2, height), this.curtainMat.clone());
      curtain.position.y = height / 2;
      g.add(curtain);

      g.userData = {
        curtain, banner, pillars: [g.children[0], g.children[1]], index: i,
        pos: new THREE.Vector3(p.x, p.y ?? 0, p.z), radius: p.radius ?? CFG.game.checkpointRadius,
      };
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
    // only the gate you are going for and the one after it, otherwise the
    // street turns into a forest of poles
    this.list.forEach((g, i) => {
      const active = i === this.index;
      const next = i === this.index + 1;
      g.visible = active || next;
      g.userData.banner.material = active ? this.bannerMat : this.matDone;
      g.userData.curtain.visible = active;
      for (const p of g.userData.pillars) p.material = active ? this.matPole : this.matNextPole;
    });
  }

  get target() { return this.list[this.index] || null; }

  test(bike) {
    const t = this.target;
    if (!t) return false;
    const d = _v.copy(bike.pos).sub(t.userData.pos);
    d.y = 0;
    const r = t.userData.radius;
    if (d.lengthSq() <= r * r) {
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
      t.userData.curtain.material.opacity = 0.12 + Math.sin(this.t * 3.4) * 0.06;
      t.scale.setScalar(1 + Math.sin(this.t * 3.4) * 0.012);
    }
  }
}

/**
 * The lap is authored against the street's real layout - the west straight,
 * the north strip, the east pocket and the dead-end alley - then every gate
 * is snapped onto drivable ground and sized to the gap it sits in.
 */
const ROUTE = [
  [-6, 24], [-13, 14], [-14, 1], [-15, -10],     // into the alley and back out
  [-8, 17], [4, 14], [13, 4],                    // east pocket
  [32, -12], [24, -44],                          // out onto the apron, north east
  [-18, -30], [-46, -22],                        // north strip, top of the west straight
  [-46, 14], [-48, 33],                          // west straight, out to the south apron
];

export function makeRoute(map, collision) {
  const pts = ROUTE.map(([x, z]) => map.snap(x, z, 8));
  return pts.map((p, i) => {
    const next = pts[(i + 1) % pts.length];
    const prev = pts[(i - 1 + pts.length) % pts.length];
    // face the gate across the direction of travel
    const dx = next.x - prev.x, dz = next.z - prev.z;
    const rot = Math.atan2(dx, dz);
    const clear = freeWidth(map, p.x, p.z, rot);
    const halfWidth = Math.min(5.2, Math.max(1.7, clear - 0.5));
    return { ...p, rot, halfWidth, radius: Math.max(4.2, Math.min(CFG.game.checkpointRadius, halfWidth + 2.2)) };
  });
}

/** How much room is there either side of a gate, along its own axis? */
function freeWidth(map, x, z, rot) {
  const ax = Math.cos(rot), az = -Math.sin(rot);
  let best = 6;
  for (const s of [-1, 1]) {
    let d = 0;
    for (; d < 6; d += 0.5) {
      if (!map.isDrivable(x + ax * (d + 0.5) * s, z + az * (d + 0.5) * s)) break;
    }
    best = Math.min(best, d);
  }
  return best;
}
