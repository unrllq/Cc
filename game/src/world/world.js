import * as THREE from 'three';
import { CFG } from '../config.js';
import { buildCity } from './city.js';
import { buildSky } from './sky.js';
import { placeHero } from './hero.js';
import { CollisionWorld } from '../engine/collision.js';
import { prepareMaterials } from '../engine/assets.js';

/** Builds the whole playable world and its collision data. */
export function buildWorld({ scene, renderer, assets, quality }) {
  const sky = buildSky(scene, renderer);

  const hero = placeHero(assets.street.scene);
  scene.add(hero.group);
  prepareMaterials(hero.group, { anisotropy: 8, envMap: null });

  // hero district occupies the central block
  const heroFootprint = { x: 0, z: 0 };
  const city = buildCity({ heroFootprint, quality });
  scene.add(city.group);

  const t0 = performance.now();
  const collision = new CollisionWorld().build([hero.group, city.group], {
    floorSlope: 0.6,
    skip: (o) => o.isInstancedMesh || o.name === 'skidmarks' || !!o.userData.noCollide,
  });
  const buildMs = performance.now() - t0;

  return { sky, hero, city, collision, stats: { tris: collision.triCount, buildMs } };
}

/**
 * Where can we drive? Roads are known analytically; the hero alley is sampled
 * from the collision mesh. Used for checkpoint placement, respawns and the map.
 */
export function buildDrivableMap(collision, city) {
  const cells = [];
  const step = 2;
  const R = CFG.world.limit;
  const inRoad = (x, z) => city.roads.some((r) => Math.abs(x - r.x) <= r.hx - 1.5 && Math.abs(z - r.z) <= r.hz - 1.5);
  const g = { y: 0, normal: new THREE.Vector3() };

  // hero block interior, sampled for real
  for (let x = -44; x <= 44; x += step) {
    for (let z = -44; z <= 44; z += step) {
      const hit = collision.sampleGround(x, z, 60, 120, g);
      if (!hit || hit.y > 1.2 || hit.normal.y < 0.9) continue;
      if (!collision.isClear(x, hit.y + 1.2, z, 1.35)) continue;
      cells.push({ x, z, y: hit.y, hero: true });
    }
  }
  return { cells, inRoad, step };
}

/** Sample a random point on the road network that is clear of obstacles. */
export function randomRoadPoint(city, rand, collision) {
  const { axes, limit } = CFG.world;
  for (let attempt = 0; attempt < 200; attempt++) {
    const alongZ = rand() < 0.5;
    const a = axes[(rand() * axes.length) | 0];
    const t = (rand() * 2 - 1) * (limit - 24);
    const lane = (rand() < 0.5 ? -1 : 1) * (CFG.world.roadWidth * 0.25);
    const x = alongZ ? a + lane : t;
    const z = alongZ ? t : a + lane;
    if (Math.abs(x) < 46 && Math.abs(z) < 46) continue; // keep clear of the hero block
    if (!collision || collision.isClear(x, 1.4, z, 1.6)) return { x, z, alongZ };
  }
  return { x: 0, z: 60, alongZ: true };
}
