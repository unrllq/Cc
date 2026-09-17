// Режим RING RUN: трасса из неоновых колец над Сити + счёт и комбо.
import * as THREE from 'three';
import { riverZ } from './city.js';

const COURSE = [
  [-200, 118, -210],
  [-140, 96, -20],                 // рядом с «Огурцом»
  [30, 150, 60],                   // щель между башнями
  [176, 96, 150],                  // над «Уоки-Токи»
  [340, 64, 330],
  [520, 42, riverZ(520)],          // сквозь Tower Bridge
  [300, 268, 700],                 // у шпиля The Shard
  [70, 110, 520],
  [-260, 72, 400],                 // низкий проход над кварталами
  [-560, 150, 180],                // облёт купола St Paul's
  [-300, 210, 40],
  [-60, 300, 62]                   // финиш над 22 Bishopsgate
];

const R = 15;

export function createCourse(scene) {
  const group = new THREE.Group();
  scene.add(group);

  const rings = COURSE.map((c, i) => {
    const pos = new THREE.Vector3(c[0], c[1], c[2]);
    const next = COURSE[i + 1] ? new THREE.Vector3(...COURSE[i + 1]) : null;
    const prev = COURSE[i - 1] ? new THREE.Vector3(...COURSE[i - 1]) : null;
    const normal = new THREE.Vector3();
    if (next && prev) normal.copy(next).sub(prev).normalize();
    else if (next) normal.copy(next).sub(pos).normalize();
    else normal.copy(pos).sub(prev).normalize();

    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(R, 0.75, 8, 48),
      new THREE.MeshBasicMaterial({ color: 0x2a5c7a, toneMapped: false })
    );
    mesh.position.copy(pos);
    mesh.lookAt(pos.clone().add(normal));

    const halo = new THREE.Mesh(
      new THREE.RingGeometry(R - 1.2, R + 1.2, 48),
      new THREE.MeshBasicMaterial({
        color: 0xff2d94, transparent: true, opacity: 0.0,
        side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false
      })
    );
    halo.position.copy(pos);
    halo.quaternion.copy(mesh.quaternion);

    // световой столб над активным кольцом видно издалека
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.4, 500, 8, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xff2d94, transparent: true, opacity: 0, side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending, depthWrite: false
      })
    );
    beam.position.set(pos.x, pos.y + 180, pos.z);

    const light = new THREE.PointLight(0xff2d94, 0, 140, 2);
    light.position.copy(pos);

    group.add(mesh, halo, beam, light);
    return { pos, normal, mesh, halo, beam, light, done: false, i };
  });

  const state = {
    index: 0, passed: 0, total: rings.length,
    time: 0, running: false, finished: false,
    combo: 0, comboTimer: 0, best: Number(localStorage.getItem('neonmile.best') || 0)
  };

  const toPlayer = new THREE.Vector3();

  function reset() {
    state.index = 0; state.passed = 0; state.time = 0;
    state.running = true; state.finished = false;
    state.combo = 0; state.comboTimer = 0;
    for (const r of rings) {
      r.done = false;
      r.mesh.material.color.set(0x2a5c7a);
    }
  }

  function update(dt, time, player) {
    if (state.running && !state.finished) state.time += dt;
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) state.combo = 0;
    }

    for (const r of rings) {
      const active = r.i === state.index && !r.done;
      const pulse = 0.5 + 0.5 * Math.sin(time * 3.4 + r.i);
      r.mesh.rotation.z += dt * (active ? 0.55 : 0.12);
      if (active) {
        r.mesh.material.color.setHex(0xff2d94);
        r.halo.material.opacity = 0.35 + pulse * 0.4;
        r.beam.material.opacity = 0.06 + pulse * 0.05;
        r.light.intensity = 120 + pulse * 160;
        const s = 1 + pulse * 0.035;
        r.mesh.scale.setScalar(s);
      } else {
        r.halo.material.opacity = r.done ? 0 : 0.08;
        r.beam.material.opacity = 0;
        r.light.intensity = 0;
        r.mesh.scale.setScalar(1);
        if (r.done) r.mesh.material.color.setHex(0x12313f);
      }
    }

    const cur = rings[state.index];
    if (!cur || state.finished) return;

    toPlayer.copy(player.pos).sub(cur.pos);
    const along = toPlayer.dot(cur.normal);
    const radial = Math.sqrt(Math.max(0, toPlayer.lengthSq() - along * along));

    if (radial < R * 0.96 && Math.abs(along) < Math.max(5, player.speed * dt * 1.6)) {
      cur.done = true;
      state.passed++;
      state.index++;
      state.combo++;
      state.comboTimer = 6;
      api.onRing?.(state.combo, player.speedKmh);
      if (state.index >= rings.length) {
        state.finished = true;
        state.running = false;
        if (!state.best || state.time < state.best) {
          state.best = state.time;
          localStorage.setItem('neonmile.best', String(state.time));
        }
        api.onFinish?.(state.time);
      }
    }
  }

  const api = {
    rings, state, update, reset,
    get target() { return rings[state.index]?.pos || null; },
    // точка возрождения после аварии — у последнего пройденного кольца
    lastCheckpoint() {
      const i = Math.max(0, state.index - 1);
      const r = rings[state.index] ? rings[i] : rings[rings.length - 1];
      const pos = r.pos.clone().addScaledVector(r.normal, -30);
      pos.y = Math.max(pos.y, 60);
      const yaw = Math.atan2(-r.normal.x, -r.normal.z);
      return { pos, yaw };
    }
  };
  return api;
}

export function fmtTime(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  const d = Math.floor((t * 10) % 10);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${d}`;
}
