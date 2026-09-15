import * as THREE from 'three';

/**
 * Rubber left on the tarmac. One pre-allocated ring buffer of quads; each
 * vertex carries a birth time and the shader fades it out.
 */
export class SkidMarks {
  constructor(scene, { max = 900, life = 14, width = 0.34 } = {}) {
    this.max = max; this.life = life; this.width = width;
    this.head = 0; this.time = 0;
    this.hasPrev = false;
    this._prevL = new THREE.Vector3();
    this._prevR = new THREE.Vector3();
    this._l = new THREE.Vector3();
    this._r = new THREE.Vector3();

    const geo = new THREE.BufferGeometry();
    this.positions = new Float32Array(max * 6 * 3);
    this.births = new Float32Array(max * 6).fill(-1e3);
    this.strength = new Float32Array(max * 6);
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geo.setAttribute('aBirth', new THREE.BufferAttribute(this.births, 1));
    geo.setAttribute('aStrength', new THREE.BufferAttribute(this.strength, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -6,
      polygonOffsetUnits: -6,
      uniforms: { uTime: { value: 0 }, uLife: { value: life } },
      vertexShader: `
        attribute float aBirth;
        attribute float aStrength;
        uniform float uTime, uLife;
        varying float vA;
        void main() {
          float age = uTime - aBirth;
          vA = clamp(1.0 - age / uLife, 0.0, 1.0) * aStrength;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        varying float vA;
        void main() {
          if (vA <= 0.001) discard;
          gl_FragColor = vec4(0.02, 0.02, 0.025, vA * 0.85);
        }`,
    });
    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.name = 'skidmarks';
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 1;
    this.mesh.userData.noCollide = true;
    scene.add(this.mesh);
  }

  clear() {
    this.births.fill(-1e3);
    this.mesh.geometry.getAttribute('aBirth').needsUpdate = true;
    this.hasPrev = false;
  }

  /** @param p contact point, @param right lateral axis, @param s 0..1 darkness */
  add(p, right, s) {
    this._l.copy(p).addScaledVector(right, -this.width);
    this._r.copy(p).addScaledVector(right, this.width);
    if (this.hasPrev) {
      const i = this.head % this.max;
      const o = i * 18;
      const P = this.positions;
      const quad = [this._prevL, this._prevR, this._l, this._prevR, this._r, this._l];
      for (let k = 0; k < 6; k++) {
        P[o + k * 3] = quad[k].x;
        P[o + k * 3 + 1] = quad[k].y + 0.015;
        P[o + k * 3 + 2] = quad[k].z;
        this.births[i * 6 + k] = this.time;
        this.strength[i * 6 + k] = s;
      }
      this.head++;
      const g = this.mesh.geometry;
      g.getAttribute('position').needsUpdate = true;
      g.getAttribute('aBirth').needsUpdate = true;
      g.getAttribute('aStrength').needsUpdate = true;
    }
    this._prevL.copy(this._l);
    this._prevR.copy(this._r);
    this.hasPrev = true;
  }

  break() { this.hasPrev = false; }

  update(dt) {
    this.time += dt;
    this.material.uniforms.uTime.value = this.time;
  }
}
