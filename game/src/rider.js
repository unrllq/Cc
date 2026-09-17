// Кибер-байк с девушкой-райдером. Модель собирается процедурно,
// но если в assets/ лежит bike.glb — берётся он (см. README).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const DARK = 0x14121c, METAL = 0x2a2f3d;

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, metalness: 0.85, roughness: 0.3, ...opts });
}
function neon(color, intensity = 2.2) {
  return new THREE.MeshBasicMaterial({ color, toneMapped: false });
}

function buildBike() {
  const g = new THREE.Group();
  const body = mat(DARK, { roughness: 0.42, metalness: 0.7 });
  const chrome = mat(METAL, { roughness: 0.18, metalness: 1 });
  const cyan = neon(0x4df0ff), pink = neon(0xff2d94), warm = neon(0xffd08a);

  // фюзеляж
  const hull = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 2.5, 6, 16), body);
  hull.rotation.x = Math.PI / 2;
  hull.position.y = 0.72;
  g.add(hull);

  // передний обтекатель
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.52, 1.7, 12), body);
  nose.rotation.x = -Math.PI / 2;
  nose.position.set(0, 0.74, -2.2);
  g.add(nose);

  // фара
  const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.3, 16), cyan);
  lamp.position.set(0, 0.78, -2.98);
  g.add(lamp);
  const head = new THREE.SpotLight(0x8ef0ff, 260, 240, 0.34, 0.6, 1.4);
  head.position.set(0, 0.8, -2.6);
  head.target.position.set(0, 0.2, -40);
  g.add(head, head.target);

  // колёса-гироскопы: в полёте разводятся в стороны и светятся
  const wheels = [];
  for (const [z, r] of [[-1.85, 0.66], [1.6, 0.74]]) {
    const w = new THREE.Group();
    const tyre = new THREE.Mesh(new THREE.TorusGeometry(r, 0.17, 8, 22), mat(0x0c0d12, { roughness: 0.9, metalness: 0.1 }));
    tyre.rotation.y = Math.PI / 2;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(r * 0.62, 0.05, 6, 22), z < 0 ? cyan : pink);
    rim.rotation.y = Math.PI / 2;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.34, 8), chrome);
    hub.rotation.z = Math.PI / 2;
    w.add(tyre, rim, hub);
    w.position.set(0, r, z);
    g.add(w);
    wheels.push({ node: w, rim, r });
  }

  // вилка и руль
  const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.5, 8), chrome);
  fork.position.set(0, 1.0, -1.85);
  fork.rotation.x = 0.36;
  g.add(fork);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.5, 8), chrome);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, 1.26, -1.6);
  g.add(bar);

  // винглеты
  for (const s of [-1, 1]) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.08, 0.85), body);
    fin.position.set(s * 0.82, 0.68, 0.45);
    fin.rotation.z = s * 0.28;
    g.add(fin);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.12), s > 0 ? pink : cyan);
    strip.position.set(s * 0.82, 0.74, 0.82);
    strip.rotation.z = s * 0.28;
    g.add(strip);
  }

  // маршевые двигатели
  const thrusters = [];
  for (const s of [-1, 1]) {
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 1.1, 12), chrome);
    can.rotation.x = Math.PI / 2;
    can.position.set(s * 0.42, 0.66, 1.9);
    g.add(can);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.1, 10), warm);
    flame.rotation.x = -Math.PI / 2;
    flame.position.set(s * 0.42, 0.66, 2.62);
    flame.material = new THREE.MeshBasicMaterial({ color: 0x7ee9ff, transparent: true, opacity: 0.55, toneMapped: false, depthWrite: false });
    g.add(flame);
    thrusters.push({ flame, x: s * 0.42 });
  }
  const glow = new THREE.PointLight(0x35d8ff, 90, 42, 2);
  glow.position.set(0, 0.5, 2.2);
  g.add(glow);

  // подсветка днища
  const rimA = new THREE.PointLight(0xff3d93, 30, 16, 2);
  rimA.position.set(1.1, 2.4, 1.2);
  const rimB = new THREE.PointLight(0x4df0ff, 26, 16, 2);
  rimB.position.set(-1.1, 2.2, -0.8);
  g.add(rimA, rimB);

  const under = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 4.2),
    new THREE.MeshBasicMaterial({ color: 0xff2d94, transparent: true, opacity: 0.35, toneMapped: false }));
  under.rotation.x = Math.PI / 2;
  under.position.y = 0.16;
  g.add(under);

  return { group: g, wheels, thrusters, glow, head };
}

function buildRider() {
  const g = new THREE.Group();
  const suit = mat(0x171a24, { roughness: 0.55, metalness: 0.4 });
  const skin = mat(0xcf9f86, { roughness: 0.75, metalness: 0.05 });
  const cyan = neon(0x4df0ff), pink = neon(0xff2d94);

  // корпус наклонён вперёд, как в посадке спортбайка
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.6, 4, 12), suit);
  torso.position.set(0, 1.55, -0.1);
  torso.rotation.x = 0.62;
  g.add(torso);

  // светящиеся полосы куртки
  for (const s of [-1, 1]) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.62, 0.08), s > 0 ? cyan : pink);
    stripe.position.set(s * 0.22, 1.56, -0.02);
    stripe.rotation.x = 0.62;
    g.add(stripe);
  }
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.06), pink);
  spine.position.set(0, 1.62, 0.22);
  spine.rotation.x = 0.62;
  g.add(spine);

  // голова + шлем-визор
  const headM = new THREE.Mesh(new THREE.SphereGeometry(0.235, 16, 14), suit);
  headM.position.set(0, 1.94, -0.52);
  g.add(headM);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.242, 16, 12, -0.9, 1.8, 0.7, 0.9), cyan);
  visor.position.copy(headM.position);
  visor.rotation.x = 0.2;
  visor.rotation.y = Math.PI;
  g.add(visor);

  // хвост волос — качается на скорости
  const hair = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.02, 0.95, 7), mat(0x2a1230, { roughness: 0.6 }));
  hair.geometry.translate(0, -0.48, 0);
  hair.position.set(0, 2.02, -0.34);
  hair.rotation.x = -1.15;
  g.add(hair);
  const hairTip = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.01, 0.4, 6), pink);
  hairTip.geometry.translate(0, -0.2, 0);
  hairTip.position.set(0, 0, 0);
  hair.add(hairTip);
  hairTip.position.y = -0.9;

  // руки к рулю
  for (const s of [-1, 1]) {
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.42, 3, 8), suit);
    upper.position.set(s * 0.28, 1.6, -0.52);
    upper.rotation.set(1.05, 0, -s * 0.22);
    g.add(upper);
    const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.38, 3, 8), skin);
    fore.position.set(s * 0.36, 1.38, -1.06);
    fore.rotation.set(1.25, 0, -s * 0.16);
    g.add(fore);
  }

  // ноги на подножках
  for (const s of [-1, 1]) {
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.44, 3, 8), suit);
    thigh.position.set(s * 0.26, 1.24, 0.3);
    thigh.rotation.set(-1.15, 0, 0);
    g.add(thigh);
    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.44, 3, 8), suit);
    shin.position.set(s * 0.3, 0.82, 0.62);
    shin.rotation.set(0.5, 0, 0);
    g.add(shin);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.4), mat(0x0d0f16));
    boot.position.set(s * 0.32, 0.6, 0.78);
    g.add(boot);
    const bootGlow = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.03, 0.34), cyan);
    bootGlow.position.set(s * 0.32, 0.53, 0.78);
    g.add(bootGlow);
  }

  return { group: g, hair };
}

// Неоновый след за двигателями
class NeonTrail {
  constructor(scene, color, length = 60) {
    this.n = length;
    this.pts = new Float32Array(length * 2 * 3);
    this.head = new THREE.Vector3();
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pts, 3));
    const idx = [];
    for (let i = 0; i < length - 1; i++) {
      const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
      idx.push(a, b, c, b, d, c);
    }
    this.geo.setIndex(idx);
    const alpha = new Float32Array(length * 2);
    for (let i = 0; i < length; i++) { alpha[i * 2] = alpha[i * 2 + 1] = 1 - i / length; }
    this.geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
    this.mesh = new THREE.Mesh(this.geo, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: { uColor: { value: new THREE.Color(color) }, uPower: { value: 1 } },
      vertexShader: `attribute float aAlpha; varying float vA; varying float vDepth;
        void main(){
          vA = aAlpha;
          vec4 mv = modelViewMatrix * vec4(position,1.0);
          vDepth = -mv.z;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `varying float vA; varying float vDepth; uniform vec3 uColor; uniform float uPower;
        void main(){
          float near = smoothstep(3.0, 16.0, vDepth);   // не залепляем камеру
          gl_FragColor = vec4(uColor, pow(vA,1.6) * 0.75 * uPower * near);
        }`
    }));
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
    this.ready = false;
  }
  reset(p, side) {
    for (let i = 0; i < this.n; i++) {
      this.pts[i * 6 + 0] = p.x - side.x * 0.1; this.pts[i * 6 + 1] = p.y; this.pts[i * 6 + 2] = p.z - side.z * 0.1;
      this.pts[i * 6 + 3] = p.x + side.x * 0.1; this.pts[i * 6 + 4] = p.y; this.pts[i * 6 + 5] = p.z + side.z * 0.1;
    }
    this.geo.attributes.position.needsUpdate = true;
  }
  push(p, side, width, power) {
    this.pts.copyWithin(6, 0, (this.n - 1) * 6);
    this.pts[0] = p.x - side.x * width; this.pts[1] = p.y - side.y * width; this.pts[2] = p.z - side.z * width;
    this.pts[3] = p.x + side.x * width; this.pts[4] = p.y + side.y * width; this.pts[5] = p.z + side.z * width;
    this.geo.attributes.position.needsUpdate = true;
    this.mesh.material.uniforms.uPower.value = power;
  }
}

export async function createRider(scene) {
  const root = new THREE.Group();
  const model = new THREE.Group();     // сюда кладём либо GLB, либо процедурку
  root.add(model);
  scene.add(root);

  const bike = buildBike();
  const girl = buildRider();
  const proc = new THREE.Group();
  proc.add(bike.group, girl.group);
  proc.position.y = -0.7;              // центр масс примерно в середине байка
  model.add(proc);

  // Слот под скачанную модель Sketchfab
  let glb = null;
  try {
    const res = await fetch('assets/bike.glb', { method: 'HEAD' });
    if (res.ok) {
      const gltf = await new GLTFLoader().loadAsync('assets/bike.glb');
      glb = gltf.scene;
      const box = new THREE.Box3().setFromObject(glb);
      const size = new THREE.Vector3(); box.getSize(size);
      const s = 4.2 / Math.max(size.x, size.y, size.z);
      glb.scale.setScalar(s);
      box.setFromObject(glb);
      const c = new THREE.Vector3(); box.getCenter(c);
      glb.position.sub(c);
      model.add(glb);
      proc.visible = false;            // реальная модель вытесняет процедурную
    }
  } catch (e) { /* модели нет — работаем на процедурной */ }

  const trailL = new NeonTrail(scene, 0x35d8ff);
  const trailR = new NeonTrail(scene, 0xff2d94);

  const side = new THREE.Vector3(), emitL = new THREE.Vector3(), emitR = new THREE.Vector3();
  const back = new THREE.Vector3();
  let spin = 0;

  function update(dt, state) {
    const spd = state.speed01;
    spin += dt * (4 + spd * 34);

    if (!glb) {
      for (const w of bike.wheels) w.node.rotation.x = spin;
      // колёса разводятся в стороны как турбины при наборе высоты
      bike.wheels[0].node.rotation.z = -state.flight * 0.5;
      bike.wheels[1].node.rotation.z = state.flight * 0.5;
      const f = 0.5 + spd * 0.7 + state.boost * 1.15;
      for (const t of bike.thrusters) {
        t.flame.scale.set(0.75 + state.boost * 0.3, f, 0.75 + state.boost * 0.3);
        t.flame.material.opacity = 0.3 + spd * 0.25 + state.boost * 0.2;
        t.flame.material.color.setHSL(state.boost > 0.3 ? 0.93 : 0.52, 1, 0.65);
      }
      bike.glow.intensity = 45 + spd * 90 + state.boost * 180;
      girl.hair.rotation.x = -1.15 - spd * 0.5 + Math.sin(state.time * 9) * 0.08 * (0.3 + spd);
      girl.hair.rotation.z = Math.sin(state.time * 6.2) * 0.12 * (0.3 + spd) - state.turn * 0.4;
    }

    // визуальный крен/тангаж корпуса поверх физического
    model.rotation.z = THREE.MathUtils.lerp(model.rotation.z, -state.turn * 0.25, 1 - Math.exp(-8 * dt));
    model.rotation.x = THREE.MathUtils.lerp(model.rotation.x, state.pitchLean * 0.12, 1 - Math.exp(-6 * dt));

    // следы
    side.set(1, 0, 0).applyQuaternion(root.quaternion);
    back.set(0, 0, 1).applyQuaternion(root.quaternion).multiplyScalar(2.6);
    emitL.copy(root.position).add(back).addScaledVector(side, -0.45);
    emitR.copy(root.position).add(back).addScaledVector(side, 0.45);
    const power = 0.25 + spd * 0.7 + state.boost * 0.8;
    const w = 0.1 + spd * 0.16 + state.boost * 0.22;
    if (!trailL.ready) { trailL.reset(emitL, side); trailR.reset(emitR, side); trailL.ready = trailR.ready = true; }
    trailL.push(emitL, side, w, power);
    trailR.push(emitR, side, w, power);
  }

  function resetTrails() {
    side.set(1, 0, 0).applyQuaternion(root.quaternion);
    trailL.reset(root.position, side);
    trailR.reset(root.position, side);
  }

  return { root, update, resetTrails, hasGLB: () => !!glb };
}
