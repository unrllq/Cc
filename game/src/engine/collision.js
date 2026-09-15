import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';

const _m3 = new THREE.Matrix3();
const _v0 = new THREE.Vector3();
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _e1 = new THREE.Vector3();
const _e2 = new THREE.Vector3();
const _n = new THREE.Vector3();
const _tmp = new THREE.Vector3();
const _sphere = new THREE.Sphere();
const _ray = new THREE.Ray();
const _box = new THREE.Box3();

/**
 * Static collision for the world. All triangles of the collidable scene are
 * baked into world space once, then split into two BVHs by face normal:
 *  - "floor"  (normal.y >= FLOOR_SLOPE): drivable surfaces, queried by down-rays
 *  - "wall"   (everything else): queried by sphere sweeps and segment rays
 * Splitting keeps sphere queries from fighting the ground and makes the
 * ground raycast much cheaper.
 */
export class CollisionWorld {
  constructor() {
    this.floorBVH = null;
    this.wallBVH = null;
    this.bounds = new THREE.Box3();
    this.triCount = 0;
  }

  /** @param {THREE.Object3D[]} roots  scene graphs to bake */
  build(roots, { floorSlope = 0.65, skip = () => false } = {}) {
    const floor = [];
    const wall = [];
    const pos = new THREE.Vector3();

    for (const root of roots) {
      root.updateMatrixWorld(true);
      root.traverse((o) => {
        if (!o.isMesh || skip(o)) return;
        const geom = o.geometry;
        const attr = geom.getAttribute('position');
        if (!attr) return;
        const idx = geom.getIndex();
        const mat = o.matrixWorld;
        const count = idx ? idx.count : attr.count;
        const inst = o.isInstancedMesh ? o.count : 1;

        for (let ii = 0; ii < inst; ii++) {
          const m = _m3; // scratch reuse below via matrix4 path
          const world = new THREE.Matrix4().copy(mat);
          if (o.isInstancedMesh) {
            const im = new THREE.Matrix4();
            o.getMatrixAt(ii, im);
            world.multiply(im);
          }
          for (let i = 0; i < count; i += 3) {
            const a = idx ? idx.getX(i) : i;
            const b = idx ? idx.getX(i + 1) : i + 1;
            const c = idx ? idx.getX(i + 2) : i + 2;
            _v0.fromBufferAttribute(attr, a).applyMatrix4(world);
            _v1.fromBufferAttribute(attr, b).applyMatrix4(world);
            _v2.fromBufferAttribute(attr, c).applyMatrix4(world);
            _e1.subVectors(_v1, _v0);
            _e2.subVectors(_v2, _v0);
            _n.crossVectors(_e1, _e2);
            const len = _n.length();
            if (len < 1e-9) continue;
            _n.divideScalar(len);
            const target = Math.abs(_n.y) >= floorSlope ? floor : wall;
            target.push(_v0.x, _v0.y, _v0.z, _v1.x, _v1.y, _v1.z, _v2.x, _v2.y, _v2.z);
            this.bounds.expandByPoint(pos.copy(_v0));
            this.bounds.expandByPoint(pos.copy(_v1));
            this.bounds.expandByPoint(pos.copy(_v2));
            this.triCount++;
          }
        }
      });
    }

    this.floorBVH = floor.length ? bvhFrom(floor) : null;
    this.wallBVH = wall.length ? bvhFrom(wall) : null;
    return this;
  }

  /**
   * Height of the drivable surface under/above a point.
   * @returns {{y:number, normal:THREE.Vector3}|null}
   */
  sampleGround(x, z, fromY = 60, maxDist = 400, out = { y: 0, normal: new THREE.Vector3() }) {
    if (!this.floorBVH) return null;
    _ray.origin.set(x, fromY, z);
    _ray.direction.set(0, -1, 0);
    const hit = this.floorBVH.raycastFirst(_ray, THREE.DoubleSide, 0, maxDist);
    if (!hit) return null;
    out.y = hit.point.y;
    out.normal.copy(hit.face.normal);
    if (out.normal.y < 0) out.normal.negate();
    return out;
  }

  /** Closest wall contact for a sphere, or null. Mutates nothing. */
  sphereContact(center, radius, out = { normal: new THREE.Vector3(), depth: 0, point: new THREE.Vector3() }) {
    if (!this.wallBVH) return null;
    _sphere.center.copy(center);
    _sphere.radius = radius;
    let best = -Infinity;
    let found = false;
    const bn = out.normal;
    this.wallBVH.shapecast({
      intersectsBounds: (box) => box.intersectsSphere(_sphere),
      intersectsTriangle: (tri) => {
        tri.closestPointToPoint(center, _tmp);
        const d = _tmp.distanceTo(center);
        const depth = radius - d;
        if (depth > 0 && depth > best) {
          best = depth;
          found = true;
          out.point.copy(_tmp);
          if (d > 1e-5) bn.subVectors(center, _tmp).divideScalar(d);
          else tri.getNormal(bn);
          out.depth = depth;
        }
        return false;
      },
    });
    return found ? out : null;
  }

  /**
   * Push a sphere out of walls. `horizontal` keeps the correction in the XZ
   * plane so a vehicle can never be squeezed up a wall and onto a roof.
   */
  resolveSphere(center, radius, iterations = 3, out = new THREE.Vector3(), horizontal = true) {
    out.set(0, 0, 0);
    for (let i = 0; i < iterations; i++) {
      const c = this.sphereContact(center, radius);
      if (!c) break;
      if (horizontal) {
        c.normal.y = 0;
        const len = c.normal.length();
        if (len < 1e-4) break;              // pure ceiling/floor contact
        c.normal.divideScalar(len);
        c.depth /= Math.max(0.35, len);
      }
      _tmp.copy(c.normal).multiplyScalar(c.depth + 1e-3);
      center.add(_tmp);
      out.add(_tmp);
      if (c.depth < 5e-3) break;
    }
    return out;
  }

  /** First wall hit along a segment (used by the camera to avoid clipping). */
  segmentHit(from, to, out = { point: new THREE.Vector3(), normal: new THREE.Vector3(), distance: 0 }) {
    if (!this.wallBVH) return null;
    _ray.origin.copy(from);
    _tmp.subVectors(to, from);
    const len = _tmp.length();
    if (len < 1e-6) return null;
    _ray.direction.copy(_tmp).divideScalar(len);
    const hit = this.wallBVH.raycastFirst(_ray, THREE.DoubleSide, 0, len);
    if (!hit) return null;
    out.point.copy(hit.point);
    out.normal.copy(hit.face.normal);
    out.distance = hit.distance;
    return out;
  }

  /** True when a sphere at this spot fits without touching a wall. */
  isClear(x, y, z, radius) {
    _tmp.set(x, y, z);
    return !this.sphereContact(_tmp, radius);
  }
}

function bvhFrom(list) {
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(list), 3));
  return new MeshBVH(geom, { maxLeafTris: 12, strategy: 0 });
}

export { _box };
