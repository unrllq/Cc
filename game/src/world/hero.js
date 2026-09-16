import * as THREE from 'three';
import { CFG } from '../config.js';

/**
 * The location is the supplied street model, used exactly as authored:
 * materials and textures are left untouched, we only enable shadows and
 * sharpen texture filtering (a sampler setting, not a change to the art).
 */
export function placeHero(gltfScene, { anisotropy = 8 } = {}) {
  const group = new THREE.Group();
  group.name = 'street';
  const [dx, dy, dz] = CFG.world.heroOffset;
  gltfScene.position.set(dx, dy, dz);
  group.add(gltfScene);

  const seen = new Set();
  gltfScene.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if (!m || seen.has(m)) continue;
      seen.add(m);
      for (const key of ['map', 'emissiveMap', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap']) {
        const t = m[key];
        if (t && t.isTexture) { t.anisotropy = anisotropy; t.needsUpdate = true; }
      }
      // photo-scanned facades are single sided in the source; drawing both
      // faces stops the alley from showing holes as you ride past
      if (m.side === THREE.FrontSide && m.transparent !== true) m.side = THREE.DoubleSide;
    }
  });

  group.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(group);
  return { group, bounds };
}
