import * as THREE from 'three';
import { CFG } from '../config.js';

/**
 * The location is the supplied street model, used as authored. Textures and
 * materials are never removed or restyled here - the only changes are:
 *   - shadow flags and anisotropic filtering (sampler settings, not art),
 *   - single-sided facades drawn double-sided so the alley has no holes,
 *   - restoring a texture onto materials that lost theirs in FBX conversion.
 * It is scaled so one storey of its own photographed facades measures a
 * real 2.7 m instead of 1.65 m.
 */
export function placeHero(gltfScene, { anisotropy = 8 } = {}) {
  const group = new THREE.Group();
  group.name = 'street';
  const S = CFG.world.heroScale;
  gltfScene.scale.setScalar(S);
  gltfScene.position.set(0, CFG.world.heroDrop, 0);
  group.add(gltfScene);

  // ---- collect every material once ----
  const mats = [];
  const seen = new Set();
  gltfScene.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    for (const m of (Array.isArray(o.material) ? o.material : [o.material])) {
      if (m && !seen.has(m)) { seen.add(m); mats.push(m); }
    }
  });

  // Blender/FBX duplicates a material as "name.001" when a mesh is split. The
  // converter failed to find the image for some of those copies, leaving them
  // flat yellow. Their twin still carries the right photo, so hand it over.
  const base = (n) => (n || '').replace(/\.\d+$/, '');
  // "Material.001/.002/..." is Blender's generic numbering, not a duplicate of
  // one asset, so those names say nothing about which photo belongs where.
  const generic = /^(material|default|standard|lambert\d*|phong\d*)?$/i;
  const textured = new Map();
  for (const m of mats) {
    const b = base(m.name);
    if (m.map && !generic.test(b) && !textured.has(b)) textured.set(b, m);
  }
  const restored = [];
  for (const m of mats) {
    if (m.map) continue;
    const b = base(m.name);
    if (generic.test(b)) continue;
    const twin = textured.get(b);
    if (!twin) continue;
    m.map = twin.map;
    if (twin.normalMap) m.normalMap = twin.normalMap;
    if (twin.roughnessMap) m.roughnessMap = twin.roughnessMap;
    m.color.set(0xffffff);   // the placeholder tint would stain the photo
    m.needsUpdate = true;
    restored.push(m.name);
  }

  for (const m of mats) {
    // The paving is a tiling PBR material whose density was authored for the
    // model's original size; scaling the street up would stretch the slabs to
    // 2.4 m, so the repeat is compensated to keep the artist's texel density.
    if (/^tiles/i.test(m.name || '')) {
      for (const key of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap']) {
        const t = m[key];
        if (t && t.isTexture) {
          t.wrapS = t.wrapT = THREE.RepeatWrapping;
          t.repeat.setScalar(CFG.world.heroScale);
          t.needsUpdate = true;
        }
      }
    }
    for (const key of ['map', 'emissiveMap', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap']) {
      const t = m[key];
      if (t && t.isTexture) { t.anisotropy = anisotropy; t.needsUpdate = true; }
    }
    if (m.side === THREE.FrontSide && m.transparent !== true) m.side = THREE.DoubleSide;
  }

  group.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(group);
  return { group, bounds, restored };
}
