import * as THREE from 'three';
import { CFG } from '../config.js';

/**
 * Places the hand-made Japanese street ("hero district") into the world and
 * dresses it for night: emissive shop fronts, lanterns and a few lamps.
 */
export function placeHero(gltfScene) {
  const g = new THREE.Group();
  g.name = 'heroDistrict';
  const [dx, dy, dz] = CFG.world.heroOffset;
  gltfScene.position.set(dx, dy, dz);
  g.add(gltfScene);

  const lit = [];
  gltfScene.traverse((o) => {
    if (!o.isMesh) return;
    o.receiveShadow = true;
    o.castShadow = true;
    const m = o.material;
    if (!m) return;
    const name = (m.name || '').toLowerCase();
    // photo-textured shop fronts: let them glow a little so the alley reads at night
    if (m.map && /дом|c83|da26|56ef|ма|махо/.test(name)) {
      m.emissiveMap = m.map;
      m.emissive = new THREE.Color(0xffffff);
      m.emissiveIntensity = 0.42;
      m.roughness = Math.min(1, (m.roughness ?? 1) * 0.9);
      lit.push(m);
    }
    if (/tiles|material\.003|бетон/.test(name)) {
      m.roughness = 0.55;
      m.metalness = 0.35; // damp tarmac
    }
    m.needsUpdate = true;
  });

  // paper lanterns along the alley to sell the vibe
  const lanternGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.22, 8);
  const lanternMat = new THREE.MeshBasicMaterial({ color: 0xd9502c, toneMapped: false });
  const lanterns = new THREE.InstancedMesh(lanternGeo, lanternMat, 26);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3(1, 1, 1);
  const mouth = CFG.world.heroAlleyMouth;
  let n = 0;
  for (let i = 0; i < 13; i++) {
    const z = mouth[1] - 2 - i * 2.6;
    for (const side of [-2.4, 2.4]) {
      if (n >= 26) break;
      m4.compose(new THREE.Vector3(mouth[0] + side, 2.85 + (i % 3) * 0.18, z), q, s);
      lanterns.setMatrixAt(n++, m4);
    }
  }
  lanterns.count = n;
  lanterns.instanceMatrix.needsUpdate = true;
  g.add(lanterns);

  return { group: g, litMaterials: lit, lanterns };
}
