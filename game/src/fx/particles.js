import * as THREE from 'three';
import { smokeTexture, glowTexture } from '../world/textures.js';

const _v = new THREE.Vector3();

/** GPU-light billboard pool: tyre smoke, nitro flames and impact sparks. */
export class Particles {
  constructor(scene, { smoke = 420, sparks = 260, scale = 1 } = {}) {
    this.smoke = new Pool(scene, Math.round(smoke * scale), {
      map: smokeTexture(), blending: THREE.NormalBlending, size: 2.6, color: 0xb9c3d6, opacity: 0.5,
    });
    this.sparks = new Pool(scene, Math.round(sparks * scale), {
      map: glowTexture('rgba(255,236,180,1)', 'rgba(255,120,20,0)'), blending: THREE.AdditiveBlending,
      size: 0.4, color: 0xffd08a, opacity: 1,
    });
  }

  tyreSmoke(pos, vel, intensity) {
    const n = intensity > 0.6 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      this.smoke.spawn(
        _v.set(pos.x + (Math.random() - 0.5) * 0.4, pos.y + 0.12, pos.z + (Math.random() - 0.5) * 0.4),
        {
          vx: -vel.x * 0.12 + (Math.random() - 0.5) * 1.6,
          vy: 0.7 + Math.random() * 1.5,
          vz: -vel.z * 0.12 + (Math.random() - 0.5) * 1.6,
          life: 1.1 + Math.random() * 0.9,
          size: 1.0 + Math.random() * 1.3,
          grow: 2.0,
          alpha: 0.2 + intensity * 0.3,
        },
      );
    }
  }

  boostFlame(pos, dir) {
    this.sparks.spawn(
      _v.copy(pos),
      {
        vx: dir.x * (5 + Math.random() * 7) + (Math.random() - 0.5) * 1.6,
        vy: 0.6 + Math.random() * 1.2,
        vz: dir.z * (5 + Math.random() * 7) + (Math.random() - 0.5) * 1.6,
        life: 0.22 + Math.random() * 0.2, size: 0.5 + Math.random() * 0.7, grow: -0.6, alpha: 1,
      },
    );
  }

  sparks3(pos, normal, power) {
    const n = Math.round(6 + power * 26);
    for (let i = 0; i < n; i++) {
      this.sparks.spawn(pos, {
        vx: normal.x * 3 + (Math.random() - 0.5) * 12,
        vy: 1 + Math.random() * 6,
        vz: normal.z * 3 + (Math.random() - 0.5) * 12,
        life: 0.3 + Math.random() * 0.5, size: 0.18 + Math.random() * 0.3, grow: -0.2, alpha: 1, gravity: 16,
      });
    }
  }

  update(dt) { this.smoke.update(dt, 0.4); this.sparks.update(dt, 14); }
  clear() { this.smoke.clear(); this.sparks.clear(); }
}

class Pool {
  constructor(scene, count, { map, blending, size, color, opacity }) {
    this.count = count;
    this.pos = new Float32Array(count * 3);
    this.vel = new Float32Array(count * 3);
    this.data = new Float32Array(count * 5); // life, maxLife, size, grow, alpha
    this.cursor = 0;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.aSize = new THREE.BufferAttribute(new Float32Array(count), 1);
    this.aAlpha = new THREE.BufferAttribute(new Float32Array(count), 1);
    geo.setAttribute('aSize', this.aSize);
    geo.setAttribute('aAlpha', this.aAlpha);
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);

    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending,
      uniforms: { uMap: { value: map }, uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity } },
      vertexShader: `
        attribute float aSize; attribute float aAlpha;
        varying float vAlpha;
        void main() {
          vAlpha = aAlpha;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * 320.0 / max(1.0, -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform sampler2D uMap; uniform vec3 uColor; uniform float uOpacity;
        varying float vAlpha;
        void main() {
          if (vAlpha <= 0.002) discard;
          vec4 t = texture2D(uMap, gl_PointCoord);
          gl_FragColor = vec4(uColor * t.rgb, t.a * vAlpha * uOpacity);
        }`,
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    this.points.userData.noCollide = true;
    this.points.renderOrder = 4;
    scene.add(this.points);
  }

  spawn(p, o) {
    const i = this.cursor = (this.cursor + 1) % this.count;
    this.pos[i * 3] = p.x; this.pos[i * 3 + 1] = p.y; this.pos[i * 3 + 2] = p.z;
    this.vel[i * 3] = o.vx; this.vel[i * 3 + 1] = o.vy; this.vel[i * 3 + 2] = o.vz;
    const d = this.data;
    d[i * 5] = o.life; d[i * 5 + 1] = o.life; d[i * 5 + 2] = o.size; d[i * 5 + 3] = o.grow || 0; d[i * 5 + 4] = o.alpha;
    this._gravity = o.gravity;
  }

  clear() { this.data.fill(0); }

  update(dt, gravity) {
    const { pos, vel, data, count } = this;
    for (let i = 0; i < count; i++) {
      const l = data[i * 5];
      if (l <= 0) { this.aAlpha.array[i] = 0; continue; }
      const nl = l - dt;
      data[i * 5] = nl;
      if (nl <= 0) { this.aAlpha.array[i] = 0; continue; }
      vel[i * 3 + 1] -= gravity * dt;
      pos[i * 3] += vel[i * 3] * dt;
      pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
      pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
      if (pos[i * 3 + 1] < 0.05) { pos[i * 3 + 1] = 0.05; vel[i * 3 + 1] *= -0.25; }
      const t = 1 - nl / data[i * 5 + 1];
      this.aSize.array[i] = Math.max(0.01, data[i * 5 + 2] + data[i * 5 + 3] * t);
      this.aAlpha.array[i] = data[i * 5 + 4] * (1 - t) * (t < 0.15 ? t / 0.15 : 1);
    }
    this.points.geometry.getAttribute('position').needsUpdate = true;
    this.aSize.needsUpdate = true;
    this.aAlpha.needsUpdate = true;
  }
}
