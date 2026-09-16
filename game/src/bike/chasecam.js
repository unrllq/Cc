import * as THREE from 'three';
import { CFG } from '../config.js';
import { settings } from '../settings.js';

const C = CFG.camera;
const _v = new THREE.Vector3();
const _look = new THREE.Vector3();
const _desired = new THREE.Vector3();
const _from = new THREE.Vector3();
const damp = (a, b, l, dt) => THREE.MathUtils.lerp(a, b, 1 - Math.exp(-l * dt));
const dampV = (v, t, l, dt) => v.lerp(t, 1 - Math.exp(-l * dt));

export const CAM_MODES = ['chase', 'close', 'hood', 'cinematic'];

export class ChaseCamera {
  constructor(camera, collision) {
    this.camera = camera;
    this.collision = collision;
    this.mode = 0;
    this.yaw = 0;
    this.pos = new THREE.Vector3(0, 5, 10);
    this.look = new THREE.Vector3();
    this.shake = 0;
    this.freeYaw = 0;
    this.cineT = 0;
  }

  cycle() { this.mode = (this.mode + 1) % CAM_MODES.length; return CAM_MODES[this.mode]; }

  snap(bike) {
    this.yaw = bike.yaw;
    this.pos.copy(bike.root.position).addScaledVector(bike.forward, -C.distance).setY(bike.root.position.y + C.height);
    this.look.copy(bike.root.position);
    this.camera.position.copy(this.pos);
    this.camera.lookAt(this.look);
  }

  update(dt, bike, input) {
    const mode = CAM_MODES[this.mode];
    const speed01 = bike.speed01;
    const base = bike.root.position;

    // where the camera wants to sit behind the bike
    let targetYaw = bike.yaw;
    if (bike.drifting) {
      // look down the direction of travel, not the chassis: reads like a drift
      const velYaw = Math.atan2(-bike.vel.x, -bike.vel.z);
      targetYaw = bike.yaw + shortAngle(bike.yaw, velYaw) * C.driftLook;
    }
    if (input.lookBack) targetYaw += Math.PI;
    targetYaw += this.freeYaw;
    this.freeYaw = damp(this.freeYaw, input.freeYaw || 0, 8, dt);

    const stiff = C.yawStiffness * (0.65 + speed01 * 0.9);
    this.yaw += shortAngle(this.yaw, targetYaw) * (1 - Math.exp(-stiff * dt));

    let dist = C.distance, height = C.height, lookAhead = C.lookAhead;
    if (mode === 'close') { dist = 4.9; height = 2.2; lookAhead = 7; }
    if (mode === 'hood') { dist = 0.6; height = 1.85; lookAhead = 14; }
    if (mode === 'cinematic') {
      this.cineT += dt;
      dist = 9 + Math.sin(this.cineT * 0.21) * 3.4;
      height = 2.2 + Math.sin(this.cineT * 0.17) * 1.5;
      this.yaw = bike.yaw + Math.sin(this.cineT * 0.13) * 1.15;
    }
    dist = (dist + speed01 * 2.1) * settings.camDistance * (1 + (input.zoom || 0));
    height += speed01 * 0.35 + bike.pitch * -1.1 + (input.zoom || 0) * 0.9;

    const dir = _v.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    _desired.copy(base).addScaledVector(dir, -dist);
    _desired.y = base.y + height;

    const lag = mode === 'hood' ? 26 : C.stiffness * (0.75 + speed01 * 0.8);
    dampV(this.pos, _desired, lag, dt);

    // keep the camera out of the scenery
    _from.copy(base).setY(base.y + 1.35);
    const hit = this.collision && this.collision.segmentHit(_from, this.pos);
    if (hit) {
      this.pos.copy(hit.point).addScaledVector(_v.subVectors(_from, hit.point).normalize(), 0.45);
    }
    if (this.pos.y < base.y + 0.6) this.pos.y = base.y + 0.6;

    // look target leads the bike
    _look.copy(base);
    _look.y += 1.25;
    _look.addScaledVector(bike.forward, lookAhead * (0.35 + speed01 * 0.65));
    if (bike.drifting) _look.addScaledVector(bike.right, bike.lateralSpeed * 0.16);
    dampV(this.look, _look, 9.5, dt);

    // shake from speed, impacts and landings
    this.shake = Math.max(this.shake * Math.exp(-4.5 * dt), bike.impact * 1.4);
    const amp = (C.shake * (speed01 * speed01) + this.shake * 0.55) * settings.shake;
    const t = performance.now() * 0.001;
    this.camera.position.copy(this.pos);
    if (amp > 1e-4) {
      this.camera.position.x += Math.sin(t * 37.1) * amp;
      this.camera.position.y += Math.sin(t * 29.7 + 1.7) * amp * 0.8;
      this.camera.position.z += Math.sin(t * 41.3 + 0.4) * amp;
    }
    this.camera.lookAt(this.look);
    // roll the camera slightly with the bike for weight
    this.camera.rotateZ(bike.lean * 0.18 + (bike.drifting ? bike.slip * 0.05 : 0));

    const targetFov = THREE.MathUtils.lerp(C.fov, C.fovBoost, Math.pow(speed01, 1.35) * (bike.boosting ? 1 : 0.78) * settings.fovShift);
    this.camera.fov = damp(this.camera.fov, mode === 'hood' ? targetFov + 6 : targetFov, 4.5, dt);
    this.camera.updateProjectionMatrix();
  }
}

function shortAngle(from, to) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}
