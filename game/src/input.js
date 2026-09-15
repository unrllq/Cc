/** Keyboard + gamepad + touch, normalised into one control state. */
export class Input {
  constructor(el = window) {
    this.keys = new Set();
    this.actions = [];
    this.touch = { steer: 0, throttle: 0, brake: 0, boost: false, handbrake: false, active: false };
    this.freeYaw = 0;
    this.state = {
      throttle: 0, brake: 0, steer: 0, handbrake: false, boost: false, lookBack: false, freeYaw: 0,
    };
    this._steerSmooth = 0;

    const down = (e) => {
      if (e.repeat) return;
      const k = e.code;
      this.keys.add(k);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(k)) e.preventDefault();
      const map = {
        KeyC: 'camera', KeyR: 'reset', KeyP: 'pause', Escape: 'pause', KeyM: 'mute',
        Enter: 'confirm', KeyH: 'help', F2: 'quality', KeyN: 'photo',
      };
      if (map[k]) this.actions.push(map[k]);
    };
    const up = (e) => this.keys.delete(e.code);
    el.addEventListener('keydown', down);
    el.addEventListener('keyup', up);
    el.addEventListener('blur', () => this.keys.clear());
    this._dispose = () => { el.removeEventListener('keydown', down); el.removeEventListener('keyup', up); };
  }

  has(...codes) { return codes.some((c) => this.keys.has(c)); }

  /** Pull and clear queued one-shot actions. */
  drain() { const a = this.actions; this.actions = []; return a; }

  update(dt) {
    const s = this.state;
    let steer = 0, throttle = 0, brake = 0, boost = false, handbrake = false, lookBack = false;

    if (this.has('KeyA', 'ArrowLeft')) steer -= 1;
    if (this.has('KeyD', 'ArrowRight')) steer += 1;
    if (this.has('KeyW', 'ArrowUp')) throttle = 1;
    if (this.has('KeyS', 'ArrowDown')) brake = 1;
    if (this.has('ShiftLeft', 'ShiftRight')) boost = true;
    if (this.has('Space')) handbrake = true;
    if (this.has('KeyB')) lookBack = true;

    // gamepad (standard mapping: RT throttle, LT brake, A handbrake, B nitro)
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) {
      if (!p || !p.connected) continue;
      const dz = (v) => (Math.abs(v) < 0.16 ? 0 : v);
      const btn = (i) => (p.buttons[i] ? (p.buttons[i].value || (p.buttons[i].pressed ? 1 : 0)) : 0);
      steer += dz(p.axes[0] || 0);
      throttle = Math.max(throttle, btn(7));
      brake = Math.max(brake, btn(6));
      handbrake = handbrake || btn(0) > 0.5;
      boost = boost || btn(1) > 0.5 || btn(2) > 0.5;
      lookBack = lookBack || btn(5) > 0.5;
      if (btn(3) > 0.5 && !this._padCam) this.actions.push('camera');
      this._padCam = btn(3) > 0.5;
      if (btn(9) > 0.5 && !this._padPause) this.actions.push('pause');
      this._padPause = btn(9) > 0.5;
      break;
    }

    if (this.touch.active) {
      steer += this.touch.steer;
      throttle = Math.max(throttle, this.touch.throttle);
      brake = Math.max(brake, this.touch.brake);
      boost = boost || this.touch.boost;
      handbrake = handbrake || this.touch.handbrake;
    }

    s.steer = Math.max(-1, Math.min(1, steer));
    s.throttle = throttle;
    s.brake = brake;
    s.boost = boost;
    s.handbrake = handbrake;
    s.lookBack = lookBack;
    s.freeYaw = this.freeYaw;
    return s;
  }
}
