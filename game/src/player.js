// Полётная модель байка + «пружинная» камера за спиной в духе AAA.
import * as THREE from 'three';
import { hitBuilding } from './city.js';

const CRUISE = 62;        // м/с при полной тяге
const BOOST = 128;        // м/с на форсаже
const PITCH_RATE = 1.35;
const YAW_RATE = 0.85;
const ROLL_RATE = 2.5;

export function createPlayer(scene, camera, city, rider) {
  const p = {
    pos: new THREE.Vector3(-320, 150, -420),
    vel: new THREE.Vector3(),
    quat: new THREE.Quaternion(),
    throttle: 0.55,
    boostFuel: 1,
    overheat: false,
    speed: 0,
    speedKmh: 0,
    topKmh: 0,
    crashes: 0,
    crashed: false,
    crashTimer: 0,
    camMode: 0,
    spawn: { pos: new THREE.Vector3(-320, 150, -420), yaw: 0.9 },
    shake: 0,
    boostAmount: 0
  };
  p.quat.setFromEuler(new THREE.Euler(0, 0.9, 0, 'YXZ'));

  // --- камера
  const camPos = new THREE.Vector3().copy(p.pos);
  const camLook = new THREE.Vector3();
  const camUp = new THREE.Vector3(0, 1, 0);
  let fov = 62;

  const OFFSETS = [
    new THREE.Vector3(0, 2.4, 8.8),    // chase
    new THREE.Vector3(0, 1.7, 5.1),    // close
    new THREE.Vector3(0, 1.15, -0.85)  // cockpit
  ];

  // временные векторы (без аллокаций в кадре)
  const fwd = new THREE.Vector3(), up = new THREE.Vector3(), right = new THREE.Vector3();
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), dq = new THREE.Quaternion();
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');
  const targetVel = new THREE.Vector3();

  let turnVisual = 0, pitchVisual = 0;

  function axes() {
    fwd.set(0, 0, -1).applyQuaternion(p.quat);
    up.set(0, 1, 0).applyQuaternion(p.quat);
    right.set(1, 0, 0).applyQuaternion(p.quat);
  }

  function respawn(at, yaw) {
    p.pos.copy(at || p.spawn.pos);
    p.vel.set(0, 0, 0);
    euler.set(0, yaw ?? p.spawn.yaw, 0);
    p.quat.setFromEuler(euler);
    p.throttle = 0.55;
    p.crashed = false;
    p.crashTimer = 0;
    p.boostFuel = Math.max(p.boostFuel, 0.5);
    rider.root.position.copy(p.pos);
    rider.root.quaternion.copy(p.quat);
    rider.resetTrails();
    camPos.copy(p.pos).addScaledVector(fwd.set(0, 0, -1).applyQuaternion(p.quat), -11).add(tmp.set(0, 3, 0));
  }

  function crash(reason) {
    if (p.crashed) return;
    p.crashed = true;
    p.crashTimer = 1.25;
    p.crashes++;
    p.shake = 1;
    p.onCrash?.(reason);
  }

  function update(dt, input, time) {
    axes();

    if (p.crashed) {
      // штопор и замедление до респавна
      p.crashTimer -= dt;
      p.vel.multiplyScalar(Math.exp(-2.2 * dt));
      p.vel.y -= 26 * dt;
      p.pos.addScaledVector(p.vel, dt);
      dq.setFromEuler(euler.set(dt * 1.4, dt * 2.6, dt * 3.4));
      p.quat.multiply(dq);
      if (p.pos.y < 3) p.pos.y = 3;
      if (p.crashTimer <= 0) p.onRespawnRequest?.();
      applyToModel(dt, time, 0);
      updateCamera(dt);
      return;
    }

    // --- тяга
    p.throttle = THREE.MathUtils.clamp(p.throttle + input.throttle * dt * 0.85, 0.12, 1);

    // --- форсаж и перегрев
    const wantBoost = input.boost && !p.overheat && p.boostFuel > 0.02;
    p.boostAmount = THREE.MathUtils.lerp(p.boostAmount, wantBoost ? 1 : 0, 1 - Math.exp(-7 * dt));
    if (wantBoost) {
      p.boostFuel = Math.max(0, p.boostFuel - dt * 0.34);
      if (p.boostFuel <= 0) p.overheat = true;
    } else {
      p.boostFuel = Math.min(1, p.boostFuel + dt * 0.21);
      if (p.boostFuel > 0.35) p.overheat = false;
    }

    // --- угловые скорости (в локальных осях)
    const speedFactor = THREE.MathUtils.clamp(p.speed / CRUISE, 0.25, 1.6);
    let yawIn = input.yaw * YAW_RATE;
    const pitchIn = input.pitch * PITCH_RATE;
    let rollIn = input.roll * ROLL_RATE;

    // координированный вираж: крен сам доворачивает нос
    const bank = Math.atan2(right.y, up.y);
    yawIn += -bank * 1.15 * speedFactor;

    // автовыравнивание крена, когда ручку отпустили
    if (Math.abs(input.roll) < 0.05) rollIn += -bank * 1.6;

    dq.setFromEuler(euler.set(pitchIn * dt, yawIn * dt, rollIn * dt));
    p.quat.multiply(dq).normalize();
    axes();

    // --- скорость
    const target = (CRUISE * p.throttle) + (BOOST - CRUISE) * p.boostAmount;
    targetVel.copy(fwd).multiplyScalar(target);
    // вертикальные «подруливания»
    targetVel.y += input.lift * 26;
    // немного гравитации на малой тяге — байк проседает
    targetVel.y -= (1 - p.throttle) * 14;

    const k = 1 - Math.exp(-(2.6 + p.boostAmount * 2) * dt);
    p.vel.lerp(targetVel, k);
    p.pos.addScaledVector(p.vel, dt);

    p.speed = p.vel.length();
    p.speedKmh = p.speed * 3.6;
    if (p.speedKmh > p.topKmh) p.topKmh = p.speedKmh;

    // --- границы мира: мягко разворачиваем обратно
    const LIM = 1250;
    if (Math.abs(p.pos.x) > LIM || Math.abs(p.pos.z) > LIM + 300) {
      p.pos.x = THREE.MathUtils.clamp(p.pos.x, -LIM, LIM);
      p.pos.z = THREE.MathUtils.clamp(p.pos.z, -LIM - 300, LIM + 300);
      p.vel.multiplyScalar(0.4);
      p.onBounds?.();
    }
    p.pos.y = Math.min(p.pos.y, 620);

    // --- столкновения
    if (p.pos.y < 2.4) { p.pos.y = 2.4; crash('ground'); }
    else {
      const hit = hitBuilding(city.colliders, p.pos, 3.4);
      if (hit) crash(hit.name || 'building');
      else {
        // предиктивный луч на 0.12 с вперёд — чтобы не «протыкать» стены на форсаже
        tmp.copy(p.pos).addScaledVector(p.vel, 0.12);
        if (hitBuilding(city.colliders, tmp, 2.2)) p.onNearMiss?.();
      }
    }

    applyToModel(dt, time, input.roll);
    updateCamera(dt);
  }

  function applyToModel(dt, time, rollInput) {
    rider.root.position.copy(p.pos);
    rider.root.quaternion.copy(p.quat);
    turnVisual = THREE.MathUtils.lerp(turnVisual, rollInput, 1 - Math.exp(-6 * dt));
    pitchVisual = THREE.MathUtils.lerp(pitchVisual, p.vel.y * 0.02, 1 - Math.exp(-4 * dt));
    rider.update(dt, {
      speed01: THREE.MathUtils.clamp(p.speed / BOOST, 0, 1),
      boost: p.boostAmount,
      turn: turnVisual,
      pitchLean: pitchVisual,
      flight: 1,
      time
    });
  }

  function updateCamera(dt) {
    const mode = p.camMode % OFFSETS.length;
    const off = OFFSETS[mode];

    // желаемая позиция камеры в системе байка
    tmp.copy(off).applyQuaternion(p.quat).add(p.pos);

    // камера не должна уезжать внутрь здания
    if (mode !== 2) {
      for (let i = 0; i < 4; i++) {
        if (!hitBuilding(city.colliders, tmp, 1.6) && tmp.y > 3) break;
        tmp.lerp(p.pos, 0.3);
        tmp.y = Math.max(tmp.y, 3.2);
      }
    }

    const lag = mode === 2 ? 1 : (1 - Math.exp(-(7 + p.speed * 0.05) * dt));
    camPos.lerp(tmp, lag);

    // точка взгляда — впереди по курсу, с учётом вектора скорости
    camLook.copy(p.pos)
      .addScaledVector(fwd, 22)
      .addScaledVector(p.vel, 0.06);
    camLook.y += mode === 2 ? 0 : 1.2;

    // «верх» камеры частично наследует крен байка — читаемо, но не укачивает
    tmp2.set(0, 1, 0).lerp(up, mode === 2 ? 0.95 : 0.4).normalize();
    camUp.lerp(tmp2, 1 - Math.exp(-6 * dt)).normalize();

    // тряска
    p.shake = Math.max(p.shake * Math.exp(-3 * dt), p.boostAmount * 0.22 + THREE.MathUtils.clamp(p.speed / BOOST - 0.55, 0, 1) * 0.2);
    const sh = p.shake;
    camera.position.copy(camPos);
    if (sh > 0.001) {
      camera.position.x += (Math.random() - 0.5) * sh * 1.4;
      camera.position.y += (Math.random() - 0.5) * sh * 1.4;
      camera.position.z += (Math.random() - 0.5) * sh * 1.4;
    }
    camera.up.copy(camUp);
    camera.lookAt(camLook);

    const targetFov = (mode === 2 ? 74 : 62) + (p.speed / BOOST) * 22 + p.boostAmount * 10;
    fov = THREE.MathUtils.lerp(fov, targetFov, 1 - Math.exp(-4 * dt));
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }

  p.update = update;
  p.respawn = respawn;
  p.crash = crash;
  p.axes = axes;
  p.forward = fwd;
  return p;
}
