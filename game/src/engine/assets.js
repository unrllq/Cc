import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/** Decode a base64 payload from the single-file build into an ArrayBuffer. */
function base64ToBuffer(b64) {
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

/** Loads the GLB assets, reporting aggregate progress 0..1. */
export async function loadAssets(onProgress = () => {}) {
  // hosted build: models arrive as base64 payload scripts (binary assets are
  // not servable), so pull them in one at a time and report coarse progress
  if (window.__ASSET_SCRIPTS && !window.__ASSETS) {
    const urls = window.__ASSET_SCRIPTS;
    window.__ASSETS = {};
    for (let i = 0; i < urls.length; i++) {
      await new Promise((res, rej) => {
        const el = document.createElement('script');
        el.src = urls[i];
        el.onload = res;
        el.onerror = () => rej(new Error('не загрузилась модель: ' + urls[i]));
        document.head.appendChild(el);
      });
      onProgress((i + 1) / (urls.length + 0.6));
    }
  }

  // the standalone build ships the models inlined, so there is nothing to fetch
  if (window.__ASSETS && window.__ASSETS.street) {
    const loader = new GLTFLoader();
    const parse = (b64) => new Promise((res, rej) => loader.parse(base64ToBuffer(b64), '', res, rej));
    onProgress(0.25);
    const street = await parse(window.__ASSETS.street);
    onProgress(0.7);
    const rider = await parse(window.__ASSETS.rider);
    onProgress(1);
    return { street, rider };
  }
  const manager = new THREE.LoadingManager();
  const loader = new GLTFLoader(manager);
  const totals = new Map();
  const loadedBytes = new Map();
  // rough byte weights so the bar moves smoothly before Content-Length arrives
  const weights = { 'assets/street.glb': 5772724, 'assets/rider.glb': 5598624 };

  const track = (url) => (evt) => {
    totals.set(url, evt.total || weights[url] || 6e6);
    loadedBytes.set(url, evt.loaded);
    let l = 0, t = 0;
    for (const k of Object.keys(weights)) {
      t += totals.get(k) || weights[k];
      l += loadedBytes.get(k) || 0;
    }
    onProgress(Math.min(0.99, l / t));
  };

  const [street, rider] = await Promise.all([
    loader.loadAsync('assets/street.glb', track('assets/street.glb')),
    loader.loadAsync('assets/rider.glb', track('assets/rider.glb')),
  ]);
  onProgress(1);
  return { street, rider };
}

/** Sharpen up imported materials for a night scene. */
export function prepareMaterials(root, { anisotropy = 4, envMap = null, envIntensity = 1 } = {}) {
  const seen = new Set();
  root.traverse((o) => {
    if (o.isMesh || o.isSkinnedMesh) {
      o.castShadow = false;
      o.receiveShadow = true;
      o.frustumCulled = true;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (!m || seen.has(m)) continue;
        seen.add(m);
        for (const key of ['map', 'emissiveMap', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap']) {
          const t = m[key];
          if (t && t.isTexture) {
            t.anisotropy = anisotropy;
            t.needsUpdate = true;
          }
        }
        if (envMap && m.isMeshStandardMaterial) {
          m.envMap = envMap;
          m.envMapIntensity = envIntensity;
        }
        m.needsUpdate = true;
      }
    }
  });
}
