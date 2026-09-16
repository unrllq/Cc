import * as THREE from 'three';
import { CFG } from '../config.js';
import { settings } from '../settings.js';

const B = CFG.bike;
const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();
const UP = new THREE.Vector3(0, 1, 0);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const damp = (cur, target, lambda, dt) => THREE.MathUtils.lerp(cur, target, 1 - Math.exp(-lambda * dt));

/** Express a world-space axis in a node's local frame (models come rotated). */
function localAxis(node, worldAxis, out = new THREE.Vector3()) {
  node.updateWorldMatrix(true, false);
  _m.copy(node.parent ? node.parent.matrixWorld : node.matrixWorld).invert();
  return out.copy(worldAxis).transformDirection(_m).normalize();
}

/**
 * Arcade motorcycle: real slip-angle handling (the bike keeps its world-space
 * velocity while the chassis yaws, which is what makes a drift feel like one),
 * with a wheelie/stoppie rig and nitro on top.
 */
export class Bike {
  constructor({ gltf, collision, fx, audio }) {
    this.collision = collision;
    this.fx = fx;
    this.audio = audio;

    // ---- rig -------------------------------------------------------------
    this.root = new THREE.Group();          // yaw
    this.pitchGroup = new THREE.Group();    // wheelie / stoppie / slope
    this.leanGroup = new THREE.Group();     // roll into corners
    this.root.add(this.pitchGroup);
    this.pitchGroup.add(this.leanGroup);
    this.model = gltf.scene;
    this.leanGroup.add(this.model);

    this.mixer = new THREE.AnimationMixer(this.model);
    const clip = gltf.animations[0];
    this.wheelNodes = { front: null, rear: null };
    this.model.traverse((o) => {
      if (o.name === 'wheel_wheel_0') this.wheelNodes.front = o;
      if (o.name === 'wheel_wheel_0001') this.wheelNodes.rear = o;
      if (/^CC_Base_Spine02/.test(o.name)) this.spine = o;
      if (/^CC_Base_Head_/.test(o.name)) this.head = o;
      if (o.isMesh || o.isSkinnedMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; }
    });
    // brake discs live outside the wheel nodes: re-parent so they spin along
    const discs = [];
    this.model.traverse((o) => { if (/^Circle\d*_Brake_0$/.test(o.name)) discs.push(o); });
    for (const d of discs) {
      const z = d.getWorldPosition(_v).applyMatrix4(_m.copy(this.model.matrixWorld).invert()).z;
      const target = z < 0 ? this.wheelNodes.front : this.wheelNodes.rear;
      if (target) target.attach(d);
    }

    if (clip) {
      // the clip drives the rider; wheels and camera are ours to control
      const tracks = clip.tracks.filter((t) => !/^(wheel_wheel_0|wheel_wheel_0001|Camera)/.test(t.name));
      this.clip = new THREE.AnimationClip('ride', clip.duration, tracks);
      this.action = this.mixer.clipAction(this.clip);
      this.action.play();
    }
    this.spinAxis = this.wheelNodes.front ? localAxis(this.wheelNodes.front, new THREE.Vector3(1, 0, 0)) : new THREE.Vector3(1, 0, 0);
    this.steerAxis = this.wheelNodes.front ? localAxis(this.wheelNodes.front, UP) : UP.clone();
    this.spineAxis = this.spine ? localAxis(this.spine, new THREE.Vector3(0, 0, 1)) : new THREE.Vector3(0, 0, 1);

    // headlight + tail light
    this.headlight = new THREE.SpotLight(0xfff4e2, 28, 45, 0.6, 0.85, 1.6);
    this.headlight.position.set(0, 1.05, -0.9);
    this.headlightTarget = new THREE.Object3D();
    this.headlightTarget.position.set(0, -0.4, -24);
    this.leanGroup.add(this.headlight, this.headlightTarget);
    this.headlight.target = this.headlightTarget;
    this.headlight.castShadow = false;

    this.rearGlow = new THREE.PointLight(0xff2a2a, 0, 9, 2);
    this.rearGlow.position.set(0, 0.9, 1.35);
    this.leanGroup.add(this.rearGlow);

    // a soft bounce so the rider keeps some shape in building shadow
    this.keyLight = new THREE.PointLight(0xdfe9ff, 6, 12, 2.0);
    this.keyLight.position.set(1.2, 3.4, 1.8);
    this.root.add(this.keyLight);

    // ---- state -----------------------------------------------------------
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.forward = new THREE.Vector3(0, 0, -1);
    this.right = new THREE.Vector3(1, 0, 0);
    this.yaw = 0; this.yawRate = 0;
    this.steer = 0;
    this.lean = 0; this.pitch = 0; this.bob = 0;
    this.onGround = true; this.groundY = 0; this.airTime = 0;
    this.groundNormal = new THREE.Vector3(0, 1, 0);
    this.speed = 0; this.forwardSpeed = 0; this.lateralSpeed = 0;
    this.slip = 0; this.drifting = false; this.driftTime = 0; this.driftDir = 0;
    this.nitro = 60; this.boosting = false;
    this.wheelSpin = 0; this.rpm = 0.12; this.gear = 1;
    this.impact = 0; this.lastImpactSpeed = 0;
    this.distance = 0; this.airborneScore = 0;
    this._groundHit = { y: 0, normal: new THREE.Vector3(0, 1, 0) };
    this._corr = new THREE.Vector3();
  }

  get object() { return this.root; }

  reset(x, z, yaw = 0) {
    this.pos.set(x, 0, z);
    const hit = this.collision.sampleGround(x, z, 12, 200, this._groundHit);
    this.pos.y = hit ? hit.y : 0;
    this.vel.set(0, 0, 0);
    this.yaw = yaw; this.yawRate = 0; this.steer = 0;
    this.lean = 0; this.pitch = 0;
    this.speed = this.forwardSpeed = this.lateralSpeed = 0;
    this.drifting = false; this.driftTime = 0;
    this.impact = 0; this.onGround = true; this.airTime = 0;
    this._sync();
  }

  update(dt, input) {
    const throttle = input.throttle;
    const brake = input.brake;
    const wantBoost = input.boost && this.nitro > 1;

    // orientation basis
    this.forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    this.right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    // ---- ground probe ----------------------------------------------------
    // probe from just above the wheels: never snap up onto a roof overhead
    const probe = this.collision.sampleGround(this.pos.x, this.pos.z, this.pos.y + 0.7, 260, this._groundHit);
    this.groundY = probe ? probe.y : this.pos.y - 40;
    if (probe) this.groundNormal.copy(probe.normal);
    const clearance = this.pos.y - this.groundY;
    this.onGround = clearance <= 0.08 && this.vel.y <= 0.6;

    // ---- steering input --------------------------------------------------
    const steerTarget = input.steer;
    this.steer = damp(this.steer, steerTarget, B.steerRate * (Math.abs(steerTarget) > 0.01 ? 1 : 1.8), dt);

    let vF = this.vel.dot(this.forward);
    let vR = this.vel.dot(this.right);
    this.speed = Math.hypot(vF, vR);

    // ---- nitro -----------------------------------------------------------
    this.boosting = wantBoost && (throttle > 0.05 || this.speed > 12);
    if (this.boosting) this.nitro = Math.max(0, this.nitro - B.nitro.drain * dt);
    else this.nitro = Math.min(B.nitro.max, this.nitro + B.nitro.idleGain * dt);

    const topSpeed = this.boosting ? B.boostTopSpeed : B.topSpeed;

    if (this.onGround) {
      // ---- longitudinal --------------------------------------------------
      const sp01 = clamp(Math.abs(vF) / B.topSpeed, 0, 1);
      const curve = curveAt(B.powerCurve, sp01);
      let accel = 0;
      if (throttle > 0) {
        accel += throttle * B.enginePower * curve;
        if (this.boosting) accel += B.boostPower;
        // sideways, the tyres scrub hard; give the rider the drive to hold it
        if (this.drifting) accel += throttle * B.driftThrust;
      }
      if (brake > 0) {
        if (vF > 0.4) {
          accel -= brake * B.brakeForce;
          this._reverseHold = 0;
        } else {
          // hold the brake a moment at a standstill before it becomes reverse,
          // so a hard stop does not shunt you backwards
          this._reverseHold = (this._reverseHold || 0) + dt;
          if (this._reverseHold > 0.35) accel -= brake * B.enginePower * 0.5;
          else if (vF > 0) accel -= brake * B.brakeForce;
        }
      } else this._reverseHold = 0;
      // engine braking + rolling resistance + aero drag
      if (throttle < 0.02 && brake < 0.02) accel -= Math.sign(vF) * B.engineBrake;
      accel -= Math.sign(vF) * B.rollResist;
      accel -= vF * Math.abs(vF) * 0.0015;
      vF += accel * dt;

      if (vF > topSpeed) vF = damp(vF, topSpeed, 3.2, dt);
      if (vF < -B.reverseSpeed) vF = -B.reverseSpeed;
      if (Math.abs(vF) < 0.12 && throttle < 0.02 && brake < 0.02) vF = 0;

      // ---- yaw / slip ----------------------------------------------------
      const absF = Math.abs(vF);
      // cornering is grip-limited: omega_max = lateral accel / speed, so fast
      // corners are wide and you have to brake for the tight ones
      const yawCap = Math.min(B.maxYawLow, B.lateralAccel / Math.max(absF, 3.2));
      const rolling = absF < 1.2 ? absF / 1.2 : 1;
      // +yaw swings the nose to the left, so steering right is negative yaw
      let yawTarget = -this.steer * yawCap * rolling * Math.sign(vF || 1);
      const handbrake = input.handbrake && absF > 4;
      if (handbrake) yawTarget *= 1.32;
      if (this.drifting) yawTarget *= B.driftYawBoost;
      // auto counter-steer settles a slide at a holdable angle instead of a spin
      if (settings.autoCounterSteer && this.drifting) {
        const over = (Math.abs(this.slip) - B.driftTargetSlip) / 0.35;
        if (over > 0) yawTarget += Math.sign(this.slip) * Math.min(1, over) * yawCap * 1.05;
      }
      this.yawRate = damp(this.yawRate, yawTarget, 8.5, dt);
      this.yaw += this.yawRate * dt;

      // grip: how fast lateral velocity bleeds off. Holding throttle and
      // steering into the slide keeps a drift alive; lifting off recovers it.
      let grip = B.grip;
      if (handbrake) grip = B.handbrakeGrip;
      else if (this.drifting) {
        const onPower = throttle > 0.45 ? 1 : 0;
        const steerHold = Math.min(1, Math.abs(this.steer));
        grip = Math.max(0.95, B.driftGrip - onPower * 1.25 - steerHold * 0.55 + (1 - steerHold) * 1.9);
      }
      if (throttle > 0.75 && absF > 8 && Math.abs(this.steer) > 0.35) grip *= 0.6;
      // ramp between grip states: snapping straight back to full grip felt
      // like hitting a wall when a slide ran out of speed
      this._grip = damp(this._grip ?? grip, grip, 11, dt);
      vR *= Math.exp(-this._grip * dt);

      // recompute basis after the yaw change, keep world velocity honest
      this.forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
      this.right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
      // Yawing the chassis does not change the world-space velocity, it only
      // re-expresses it in the new body frame: forward bleeds into lateral.
      // That rotation is what a drift is, and because it is an exact rotation
      // it can never invent speed - only the grip term below removes it.
      const dTheta = this.yawRate * dt;
      const cs = Math.cos(dTheta), sn = Math.sin(dTheta);
      const nvF = vF * cs - vR * sn;
      const nvR = vR * cs + vF * sn;
      vF = nvF;
      vR = nvR;

      // stability aid: catches a slide the rider did not ask for
      if (settings.assist && !handbrake) {
        const over = Math.abs(this.slip) - B.assistSlip;
        if (over > 0) {
          const k = Math.min(1, over / 0.45);
          vR *= Math.exp(-B.assistGrip * k * dt);
          this.yawRate *= Math.exp(-B.assistYaw * k * dt);
        }
      }

      this.vel.copy(this.forward).multiplyScalar(vF).addScaledVector(this.right, vR);
      this.vel.y = Math.min(0, this.vel.y);

      this.slip = Math.atan2(vR, Math.max(1, absF));
      const wasDrifting = this.drifting;
      const slipAbs = Math.abs(this.slip);
      const enter = slipAbs > B.slipAngleDrift || (handbrake && absF > 9);
      const stay = slipAbs > B.slipAngleExit || handbrake;
      this.drifting = absF > (wasDrifting ? 4.5 : 7) && (wasDrifting ? stay : enter);
      if (this.drifting) {
        this.driftTime += dt;
        this.driftDir = Math.sign(this.slip) || this.driftDir;
        this.nitro = Math.min(B.nitro.max, this.nitro + B.nitro.driftGain * dt * Math.min(1, Math.abs(this.slip) * 3));
      } else if (wasDrifting) {
        this.driftTime = 0;
      }
      this.airTime = 0;
    } else {
      // ---- airborne --------------------------------------------------------
      this.airTime += dt;
      this.vel.y -= B.gravity * dt;
      this.yawRate = damp(this.yawRate, -this.steer * B.maxYawLow * 0.55, 2.2, dt);
      this.yaw += this.yawRate * dt * B.airControl;
      this.drifting = false;
      this.nitro = Math.min(B.nitro.max, this.nitro + B.nitro.airGain * dt);
      if (this.boosting) this.vel.addScaledVector(this.forward, B.boostPower * 0.5 * dt);
    }

    // ---- integrate -------------------------------------------------------
    this.pos.addScaledVector(this.vel, dt);
    this.distance += this.speed * dt;

    // ground contact
    const after = this.collision.sampleGround(this.pos.x, this.pos.z, this.pos.y + 0.7, 260, this._groundHit);
    const gy = after ? after.y : this.groundY;
    if (this.pos.y <= gy) {
      if (!this.onGround && this.vel.y < -6) {
        this.landing = clamp(-this.vel.y / 22, 0, 1);
        if (this.audio) this.audio.land(this.landing);
        this.pitch += this.landing * 0.12;
      }
      this.pos.y = gy;
      if (this.vel.y < 0) this.vel.y = 0;
      this.groundY = gy;
    } else if (this.pos.y - gy > 0.08) {
      this.onGround = false;
    }
    if (this.pos.y < -30) this.needsRespawn = true;

    // ---- wall collision --------------------------------------------------
    // the body sphere sits above kerb height so low trim is driven over,
    // not bounced off; real walls still stop us dead
    _v.set(this.pos.x, this.pos.y + 1.15, this.pos.z);
    const corr = this.collision.resolveSphere(_v, 0.85, 3, this._corr);
    this.impact = Math.max(0, this.impact - dt * 2.2);
    if (corr.lengthSq() > 1e-6) {
      this.pos.x = _v.x; this.pos.z = _v.z;
      const n = _v2.copy(corr).normalize();
      const into = this.vel.dot(n);
      if (into < 0) {
        const hit = clamp(-into / 26, 0, 1);
        this.vel.addScaledVector(n, -into * 1.28);      // bounce off
        this.vel.multiplyScalar(1 - 0.42 * hit);         // and lose energy
        if (hit > 0.08) {
          this.impact = Math.max(this.impact, hit);
          this.lastImpactSpeed = -into;
          if (this.audio) this.audio.crash(hit);
          if (this.fx) this.fx.sparks(_v, n, hit);
        }
      }
      this.driftTime = 0;
    }

    // world bounds guard
    const L = CFG.world.limit - 2.5;
    if (this.pos.x < -L || this.pos.x > L) { this.pos.x = clamp(this.pos.x, -L, L); this.vel.x *= -0.2; }
    if (this.pos.z < -L || this.pos.z > L) { this.pos.z = clamp(this.pos.z, -L, L); this.vel.z *= -0.2; }

    // ---- pose ------------------------------------------------------------
    const spd = this.speed;
    this.forwardSpeed = vF;
    this.lateralSpeed = vR;
    // lean into the corner (tan θ = v·ω / g), plus counter-lean while sliding
    // lean into the corner: +yaw is a left turn and a left lean is +roll
    let leanTarget = Math.atan2(this.yawRate * Math.max(spd, 1), B.leanGravity);
    leanTarget = clamp(leanTarget, -B.leanMax, B.leanMax);
    if (this.drifting) {
      leanTarget = clamp(leanTarget + clamp(this.slip, -0.6, 0.6) * 0.3, -B.leanMaxDrift, B.leanMaxDrift);
    }
    if (!this.onGround) leanTarget *= 0.35;
    this.lean = damp(this.lean, leanTarget, B.leanRate, dt);

    let pitchTarget = 0;
    const accelNow = (vF - (this._prevVF ?? vF)) / Math.max(dt, 1e-4);
    this._prevVF = vF;
    if (this.onGround) {
      if (throttle > 0.65 && vF > 0.5 && vF < B.wheelieSpeed) {
        pitchTarget -= clamp((B.wheelieSpeed - vF) / B.wheelieSpeed, 0, 1) * (this.boosting ? 0.5 : 0.36) * throttle;
      }
      if (brake > 0.4 && vF > 6) pitchTarget += 0.14 * brake;
      pitchTarget += clamp(-accelNow * 0.004, -0.08, 0.08);
      // follow the ground slope
      pitchTarget += Math.asin(clamp(this.groundNormal.dot(this.forward), -1, 1)) * 0.8;
    } else {
      pitchTarget = clamp(-Math.atan2(this.vel.y, Math.max(4, spd)) * 0.55, -0.4, 0.4);
    }
    this.pitch = damp(this.pitch, pitchTarget, B.pitchRate, dt);

    // suspension bob
    const bumps = Math.sin(this.distance * 1.7) * 0.012 + Math.sin(this.distance * 5.3) * 0.005;
    this.bob = damp(this.bob, bumps * Math.min(1, spd / 18) + (this.landing ? -this.landing * 0.22 : 0), 9, dt);
    if (this.landing) this.landing = Math.max(0, this.landing - dt * 3);

    // ---- drivetrain / wheels --------------------------------------------
    const gears = B.gears;
    let g = 1;
    for (let i = 1; i < gears.length; i++) if (Math.abs(vF) >= gears[i]) g = i + 1;
    this.gear = Math.min(g, gears.length - 1);
    const lo = gears[this.gear - 1], hi = gears[this.gear] || B.boostTopSpeed;
    const inGear = clamp((Math.abs(vF) - lo) / Math.max(1, hi - lo), 0, 1);
    const idle = 0.13 + throttle * 0.12;
    this.rpm = damp(this.rpm ?? idle, Math.abs(vF) < 0.4 ? idle : 0.22 + inGear * 0.78, 9, dt);

    const wheelSlip = (this.drifting ? Math.abs(this.slip) * 8 : 0) + (throttle > 0.9 && Math.abs(vF) < 6 ? 12 : 0);
    this.wheelSpin -= ((vF / B.wheelRadius) + wheelSlip * Math.sign(vF || 1)) * dt;

    this._sync();
    this.mixer.update(dt * (0.55 + Math.min(1.4, Math.abs(vF) / 26)));
    this._poseModel(dt);
    return this;
  }

  _sync() {
    this.root.position.set(this.pos.x, this.pos.y + B.rideHeight + this.bob, this.pos.z);
    this.root.rotation.y = this.yaw;
    this.pitchGroup.rotation.x = this.pitch;
    this.leanGroup.rotation.z = this.lean;
  }

  /** Wheel spin + steer + a little rider body english, applied after the mixer. */
  _poseModel(dt) {
    const { front, rear } = this.wheelNodes;
    if (front) {
      _q.setFromAxisAngle(this.steerAxis, -this.steer * 0.26 * clamp(1 - this.speed / 34, 0.28, 1));
      front.quaternion.copy(_q).multiply(_q.clone().setFromAxisAngle(this.spinAxis, this.wheelSpin));
    }
    if (rear) rear.quaternion.setFromAxisAngle(this.spinAxis, this.wheelSpin);
    if (this.spine) {
      // rider braces against the slide
      _q.setFromAxisAngle(this.spineAxis, clamp(this.lean * 0.3 - this.slip * 0.22, -0.35, 0.35));
      this.spine.quaternion.multiply(_q);
    }
    this.rearGlow.intensity = damp(this.rearGlow.intensity, this._brakeGlow ? 9 : 1.2, 12, dt);
  }

  setBrakeLight(on) { this._brakeGlow = on; }

  /** 0..1 how fast we are going, for HUD and post effects. */
  get speed01() { return clamp(this.speed / B.boostTopSpeed, 0, 1); }
  get speedKmh() { return this.speed * 3.6; }
}

function curveAt(curve, t) {
  const n = curve.length - 1;
  const x = clamp(t, 0, 1) * n;
  const i = Math.min(n - 1, Math.floor(x));
  return THREE.MathUtils.lerp(curve[i], curve[i + 1], x - i);
}
