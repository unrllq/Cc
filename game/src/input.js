// Клавиатура + мышь (pointer lock) + геймпад + тач. Отдаёт нормализованные оси.
import * as THREE from 'three';

export function createInput(canvas) {
  const keys = new Set();
  const state = {
    pitch: 0, yaw: 0, roll: 0, throttle: 0, lift: 0,
    boost: false, mouseDX: 0, mouseDY: 0,
    sens: 1.0, invertY: false, locked: false, touch: false
  };

  addEventListener('keydown', e => {
    if (e.code === 'Tab') e.preventDefault();
    keys.add(e.code);
  });
  addEventListener('keyup', e => keys.delete(e.code));
  addEventListener('blur', () => keys.clear());

  document.addEventListener('pointerlockchange', () => {
    state.locked = document.pointerLockElement === canvas;
  });
  addEventListener('mousemove', e => {
    if (!state.locked) return;
    state.mouseDX += e.movementX;
    state.mouseDY += e.movementY;
  });

  // --- тач
  const touchUI = document.getElementById('touch');
  const stick = document.getElementById('stickL');
  const knob = stick.querySelector('i');
  let stickId = null, sx = 0, sy = 0;
  const touchAxes = { x: 0, y: 0 };
  let touchBoost = false, touchLift = 0;

  const isTouch = matchMedia('(pointer: coarse)').matches;
  if (isTouch) {
    state.touch = true;
    touchUI.classList.remove('hidden');
    stick.addEventListener('touchstart', e => {
      const t = e.changedTouches[0];
      stickId = t.identifier;
      const r = stick.getBoundingClientRect();
      sx = r.left + r.width / 2; sy = r.top + r.height / 2;
      e.preventDefault();
    }, { passive: false });
    addEventListener('touchmove', e => {
      for (const t of e.changedTouches) {
        if (t.identifier !== stickId) continue;
        const dx = THREE.MathUtils.clamp((t.clientX - sx) / 52, -1, 1);
        const dy = THREE.MathUtils.clamp((t.clientY - sy) / 52, -1, 1);
        touchAxes.x = dx; touchAxes.y = dy;
        knob.style.transform = `translate(${dx * 34}px, ${dy * 34}px)`;
      }
    }, { passive: false });
    addEventListener('touchend', e => {
      for (const t of e.changedTouches) {
        if (t.identifier !== stickId) continue;
        stickId = null; touchAxes.x = touchAxes.y = 0;
        knob.style.transform = '';
      }
    });
    const bind = (id, on, off) => {
      const el = document.getElementById(id);
      el.addEventListener('touchstart', e => { on(); e.preventDefault(); }, { passive: false });
      el.addEventListener('touchend', off);
    };
    bind('tBoost', () => touchBoost = true, () => touchBoost = false);
    bind('tUp', () => touchLift = 1, () => touchLift = 0);
    bind('tDown', () => touchLift = -1, () => touchLift = 0);
  }

  function lock() { if (!state.touch) canvas.requestPointerLock?.(); }

  function update(dt) {
    const k = c => keys.has(c);
    // тангаж/рыскание с мыши
    const s = state.sens * 0.0016;
    const inv = state.invertY ? -1 : 1;
    state.pitch = THREE.MathUtils.clamp(-state.mouseDY * s * inv, -1, 1) / Math.max(dt, 0.008) * 0.016;
    state.yaw = THREE.MathUtils.clamp(-state.mouseDX * s, -1, 1) / Math.max(dt, 0.008) * 0.016;
    state.mouseDX = state.mouseDY = 0;

    // стрелки дублируют мышь
    if (k('ArrowUp')) state.pitch += 1;
    if (k('ArrowDown')) state.pitch -= 1;
    if (k('ArrowLeft')) state.yaw += 1;
    if (k('ArrowRight')) state.yaw -= 1;

    state.roll = (k('KeyA') ? 1 : 0) - (k('KeyD') ? 1 : 0);
    state.throttle = (k('KeyW') ? 1 : 0) - (k('KeyS') ? 1 : 0);
    state.lift = (k('Space') ? 1 : 0) - (k('ControlLeft') || k('ControlRight') ? 1 : 0);
    state.boost = k('ShiftLeft') || k('ShiftRight') || touchBoost;

    if (state.touch) {
      state.roll += -touchAxes.x;
      state.pitch += -touchAxes.y;
      state.throttle = 1;
      state.lift += touchLift;
    }

    // геймпад
    const gp = navigator.getGamepads?.()[0];
    if (gp) {
      const dz = v => Math.abs(v) < 0.14 ? 0 : v;
      state.yaw += -dz(gp.axes[0]) * 1.2;
      state.pitch += -dz(gp.axes[1]) * 1.2;
      state.roll += -dz(gp.axes[2] || 0) * 1.0;
      const rt = gp.buttons[7]?.value || 0, lt = gp.buttons[6]?.value || 0;
      state.throttle += rt - lt;
      state.boost = state.boost || !!gp.buttons[0]?.pressed;
      state.lift += (gp.buttons[3]?.pressed ? 1 : 0) - (gp.buttons[1]?.pressed ? 1 : 0);
    }

    state.pitch = THREE.MathUtils.clamp(state.pitch, -1.6, 1.6);
    state.yaw = THREE.MathUtils.clamp(state.yaw, -1.6, 1.6);
    state.roll = THREE.MathUtils.clamp(state.roll, -1, 1);
    state.throttle = THREE.MathUtils.clamp(state.throttle, -1, 1);
    state.lift = THREE.MathUtils.clamp(state.lift, -1, 1);
  }

  return { state, update, lock, keys };
}
