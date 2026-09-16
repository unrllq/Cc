import { settings } from './settings.js';

const CLAMP = (v, a, b) => (v < a ? a : v > b ? b : v);

/**
 * Keyboard, mouse, gamepad and touch folded into one control state.
 * Steering is analogue everywhere: the keyboard ramps toward full lock at a
 * speed the player can tune, pads and touch drags feed it straight through.
 */
export class Input {
  constructor(el = window) {
    this.keys = new Set();
    this.actions = [];
    this.freeYaw = 0;          // camera orbit offset from mouse / right stick
    this.zoom = 0;             // camera distance trim from the wheel
    this.padIndex = null;
    this.usingPad = false;
    this.touch = { active: false, steer: 0, throttle: 0, brake: 0, boost: false, handbrake: false };
    this.state = {
      throttle: 0, brake: 0, steer: 0, steerRaw: 0,
      handbrake: false, boost: false, lookBack: false, freeYaw: 0, zoom: 0,
    };
    this._keySteer = 0;
    this._mouseHeld = false;

    const ACTIONS = {
      KeyC: 'camera', KeyR: 'reset', KeyP: 'pause', Escape: 'pause', KeyM: 'mute',
      Enter: 'confirm', F2: 'quality', F3: 'fps',
    };
    const PREVENT = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'F2', 'F3'];

    this._onDown = (e) => {
      if (e.repeat) return;
      this.keys.add(e.code);
      if (PREVENT.includes(e.code)) e.preventDefault();
      if (ACTIONS[e.code]) this.actions.push(ACTIONS[e.code]);
      this.usingPad = false;
    };
    this._onUp = (e) => this.keys.delete(e.code);
    this._onBlur = () => { this.keys.clear(); this._mouseHeld = false; };
    el.addEventListener('keydown', this._onDown);
    el.addEventListener('keyup', this._onUp);
    el.addEventListener('blur', this._onBlur);

    // ---- mouse look: hold right button (or middle) and drag ----
    const canvas = document.getElementById('gl') || el;
    this._onContext = (e) => e.preventDefault();
    this._onMouseDown = (e) => { if (e.button === 2 || e.button === 1) { this._mouseHeld = true; e.preventDefault(); } };
    this._onMouseUp = (e) => { if (e.button === 2 || e.button === 1) this._mouseHeld = false; };
    this._onMouseMove = (e) => {
      if (!this._mouseHeld || !settings.mouseLook) return;
      const dir = settings.invertMouse ? -1 : 1;
      this.freeYaw = CLAMP(this.freeYaw - e.movementX * 0.0042 * settings.mouseSensitivity * dir, -Math.PI, Math.PI);
    };
    this._onWheel = (e) => {
      this.zoom = CLAMP(this.zoom + Math.sign(e.deltaY) * 0.12, -0.55, 1.4);
      e.preventDefault();
    };
    canvas.addEventListener('contextmenu', this._onContext);
    window.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mouseup', this._onMouseUp);
    window.addEventListener('mousemove', this._onMouseMove);
    canvas.addEventListener('wheel', this._onWheel, { passive: false });

    window.addEventListener('gamepadconnected', (e) => { this.padIndex = e.gamepad.index; });
    window.addEventListener('gamepaddisconnected', () => { this.padIndex = null; this.usingPad = false; });
  }

  has(...codes) { return codes.some((c) => this.keys.has(c)); }
  drain() { const a = this.actions; this.actions = []; return a; }

  /** Short buzz on the pad when we hit something. */
  rumble(strength = 0.5, ms = 160) {
    if (!settings.rumble) return;
    const pad = this._pad();
    const act = pad && (pad.vibrationActuator || (pad.hapticActuators && pad.hapticActuators[0]));
    if (!act) return;
    try {
      if (act.playEffect) act.playEffect('dual-rumble', { duration: ms, strongMagnitude: strength, weakMagnitude: strength * 0.6 });
      else if (act.pulse) act.pulse(strength, ms);
    } catch { /* not supported */ }
  }

  _pad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    if (this.padIndex != null && pads[this.padIndex]) return pads[this.padIndex];
    for (const p of pads) if (p && p.connected) return p;
    return null;
  }

  update(dt) {
    const s = this.state;
    let throttle = 0, brake = 0, boost = false, handbrake = false, lookBack = false;
    let steerTarget = 0;
    let analogue = false;

    // ---- keyboard ----
    let kb = 0;
    if (this.has('KeyA', 'ArrowLeft')) kb -= 1;
    if (this.has('KeyD', 'ArrowRight')) kb += 1;
    if (this.has('KeyW', 'ArrowUp')) throttle = 1;
    if (this.has('KeyS', 'ArrowDown')) brake = 1;
    if (this.has('ShiftLeft', 'ShiftRight')) boost = true;
    if (this.has('Space')) handbrake = true;
    if (this.has('KeyB')) lookBack = true;

    // the keyboard "stick" ramps in and snaps back, both tunable
    const rate = 4.6 * settings.steerSpeed;
    const back = 9.0 * settings.steerSpeed;
    if (kb !== 0) this._keySteer += kb * rate * dt;
    else this._keySteer -= Math.sign(this._keySteer) * Math.min(Math.abs(this._keySteer), back * dt);
    this._keySteer = CLAMP(this._keySteer, -1, 1);
    steerTarget = this._keySteer;

    // glance keys ride on top of the mouse orbit
    let glance = 0;
    if (this.has('KeyQ')) glance -= 1;
    if (this.has('KeyE')) glance += 1;

    // ---- gamepad ----
    const pad = this._pad();
    if (pad) {
      const dz = (v) => (Math.abs(v) < 0.14 ? 0 : (v - Math.sign(v) * 0.14) / 0.86);
      const btn = (i) => (pad.buttons[i] ? (pad.buttons[i].value || (pad.buttons[i].pressed ? 1 : 0)) : 0);
      const ax = dz(pad.axes[0] || 0);
      const rt = btn(7), lt = btn(6);
      if (Math.abs(ax) > 0.02 || rt > 0.02 || lt > 0.02) this.usingPad = true;
      if (this.usingPad) {
        steerTarget = CLAMP(steerTarget + ax, -1, 1);
        analogue = Math.abs(ax) > 0.02;
        throttle = Math.max(throttle, rt);
        brake = Math.max(brake, lt);
      }
      handbrake = handbrake || btn(0) > 0.5;
      boost = boost || btn(1) > 0.5 || btn(2) > 0.5;
      lookBack = lookBack || btn(5) > 0.5;
      const rx = dz(pad.axes[2] || 0);
      if (Math.abs(rx) > 0.02) this.freeYaw = CLAMP(this.freeYaw - rx * 2.4 * dt * settings.mouseSensitivity, -Math.PI, Math.PI);
      if (btn(3) > 0.5 && !this._padCam) this.actions.push('camera');
      this._padCam = btn(3) > 0.5;
      if (btn(9) > 0.5 && !this._padPause) this.actions.push('pause');
      this._padPause = btn(9) > 0.5;
      if (btn(4) > 0.5 && !this._padReset) this.actions.push('reset');
      this._padReset = btn(4) > 0.5;
    }

    // ---- touch ----
    if (this.touch.active) {
      steerTarget = CLAMP(steerTarget + this.touch.steer, -1, 1);
      analogue = analogue || Math.abs(this.touch.steer) > 0.02;
      throttle = Math.max(throttle, this.touch.throttle);
      brake = Math.max(brake, this.touch.brake);
      boost = boost || this.touch.boost;
      handbrake = handbrake || this.touch.handbrake;
    }

    // mouse orbit springs back when you let go
    if (!this._mouseHeld && glance === 0) this.freeYaw *= Math.exp(-6 * dt);
    if (glance !== 0) this.freeYaw = glance * 1.25;

    s.steerRaw = steerTarget;
    s.steer = CLAMP(steerTarget * settings.steerSensitivity, -1, 1);
    s.analogue = analogue;
    s.throttle = throttle;
    s.brake = brake;
    s.boost = boost;
    s.handbrake = handbrake;
    s.lookBack = lookBack;
    s.freeYaw = this.freeYaw;
    s.zoom = this.zoom;
    return s;
  }
}
