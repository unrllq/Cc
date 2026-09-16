const $ = (id) => document.getElementById(id);

/** Screen stack: loading -> title -> (playing) -> pause / results. */
export class Menus {
  constructor(handlers) {
    this.h = handlers;
    this.overlay = $('overlay');
    this.screens = {
      loading: $('loading'), title: $('title'), pause: $('pause'),
      results: $('results'), controls: $('controls'),
    };
    this.returnTo = 'title';
    this.current = 'loading';

    const bind = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', fn); };
    bind('btnTime', () => this.h.start('timeattack'));
    bind('btnFree', () => this.h.start('freeride'));
    bind('btnResume', () => this.h.resume());
    bind('btnRestart', () => this.h.restart());
    bind('btnQuit', () => this.h.quit());
    bind('btnAgain', () => this.h.restart());
    bind('btnMenu', () => this.h.quit());
    bind('btnQuality', () => this.h.cycleQuality());
    bind('btnQuality2', () => this.h.cycleQuality());
    bind('btnSound', () => this.h.toggleSound());
    bind('btnSound2', () => this.h.toggleSound());
    bind('btnFps', () => this.h.toggleFps());
    bind('btnControls', () => this.openControls('title'));
    bind('btnControls2', () => this.openControls('pause'));
    bind('btnBack', () => this.show(this.returnTo));
    bind('btnResetOpts', () => this.h.resetSettings());

    // ---- controls screen wiring ----
    this.sliders = [
      ['optSens', 'outSens', 'steerSensitivity', (v) => `${Math.round(v * 100)}%`],
      ['optSpeed', 'outSpeed', 'steerSpeed', (v) => `${v.toFixed(2)}x`],
      ['optMouseSens', 'outMouseSens', 'mouseSensitivity', (v) => `${v.toFixed(2)}x`],
      ['optCam', 'outCam', 'camDistance', (v) => `${v.toFixed(2)}x`],
      ['optShake', 'outShake', 'shake', (v) => (v === 0 ? 'выкл' : `${v.toFixed(2)}x`)],
    ];
    for (const [id, outId, key, fmt] of this.sliders) {
      const el = $(id);
      if (!el) continue;
      el.addEventListener('input', () => {
        const v = parseFloat(el.value);
        $(outId).textContent = fmt(v);
        this.h.setSetting(key, v);
      });
    }
    this.switches = [
      ['optAssist', 'assist'], ['optCounter', 'autoCounterSteer'],
      ['optMouse', 'mouseLook'], ['optInvert', 'invertMouse'], ['optRumble', 'rumble'],
    ];
    for (const [id, key] of this.switches) {
      const el = $(id);
      if (!el) continue;
      el.addEventListener('click', () => {
        const next = el.getAttribute('aria-pressed') !== 'true';
        this._setSwitch(el, next);
        this.h.setSetting(key, next);
      });
    }
    this.syncSettings(this.h.settings);
  }

  _setSwitch(el, on) {
    el.setAttribute('aria-pressed', on ? 'true' : 'false');
    el.textContent = on ? 'ВКЛ' : 'ВЫКЛ';
  }

  openControls(from) {
    this.returnTo = from;
    this.syncSettings(this.h.settings);
    this.show('controls');
  }

  /** Push the stored settings back into every widget. */
  syncSettings(s) {
    if (!s) return;
    for (const [id, outId, key, fmt] of this.sliders || []) {
      const el = $(id);
      if (!el) continue;
      el.value = s[key];
      $(outId).textContent = fmt(s[key]);
    }
    for (const [id, key] of this.switches || []) {
      const el = $(id);
      if (el) this._setSwitch(el, !!s[key]);
    }
  }

  show(name) {
    this.current = name;
    for (const [k, el] of Object.entries(this.screens)) el.classList.toggle('active', k === name);
    this.overlay.classList.toggle('hidden', name === null || name === 'none');
  }

  hide() { this.show('none'); }

  progress(p) {
    $('loadFill').style.width = (p * 100).toFixed(0) + '%';
    $('loadText').innerHTML = p < 1
      ? `<span class="spin"></span>ЗАГРУЗКА МОДЕЛЕЙ… ${(p * 100) | 0}%`
      : `<span class="spin"></span>СБОРКА ГОРОДА…`;
  }

  setQualityLabel(q) {
    const names = { high: 'Высокая', medium: 'Средняя', low: 'Низкая' };
    const el = $('btnQuality');
    if (el) el.innerHTML = `Графика: ${names[q]}<small>Переключить качество</small>`;
    const el2 = $('btnQuality2');
    if (el2) el2.innerHTML = `Графика: ${names[q]}`;
  }

  setSoundLabel(on) {
    const el = $('btnSound');
    if (el) el.innerHTML = `Звук: ${on ? 'Вкл' : 'Выкл'}<small>Процедурный движок</small>`;
    const el2 = $('btnSound2');
    if (el2) el2.innerHTML = `Звук: ${on ? 'Вкл' : 'Выкл'}`;
  }

  setFpsLabel(on) {
    const el = $('btnFps');
    if (el) el.textContent = `FPS: ${on ? 'вкл' : 'выкл'}`;
  }

  setBest(records) {
    const t = records.timeattack, f = records.freeride;
    const parts = [];
    if (t) parts.push(`Рекорд заезда: ${t.score.toLocaleString('ru-RU')} очков`);
    if (f) parts.push(`Свободная езда: ${f.score.toLocaleString('ru-RU')}`);
    $('bestLine').textContent = parts.join('   ·   ');
  }

  results(res, mode) {
    $('resTitle').textContent = res.won ? 'ТРАССА ПРОЙДЕНА' : (mode === 'timeattack' ? 'ВРЕМЯ ВЫШЛО' : 'ЗАЕЗД ОКОНЧЕН');
    $('resSub').textContent = res.isBest ? '★ новый рекорд' : '';
    $('resScore').textContent = res.score.toLocaleString('ru-RU');
    $('resTime').textContent = res.time.toFixed(1);
    $('resSpeed').textContent = Math.round(res.topSpeed);
    $('resBest').textContent = Math.max(res.best, res.score).toLocaleString('ru-RU');
    this.show('results');
  }
}

/** On-screen controls for phones/tablets. */
export function setupTouch(input) {
  const coarse = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  if (!coarse) return false;
  document.getElementById('touch').classList.add('on');
  input.touch.active = true;
  const press = (id, on, off) => {
    const el = document.getElementById(id);
    const start = (e) => { e.preventDefault(); el.classList.add('down'); on(); };
    const end = (e) => { e.preventDefault(); el.classList.remove('down'); off(); };
    el.addEventListener('pointerdown', start);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('pointerleave', end);
  };
  const t = input.touch;
  press('tGas', () => (t.throttle = 1), () => (t.throttle = 0));
  press('tBrake', () => (t.brake = 1), () => (t.brake = 0));
  press('tBoost', () => (t.boost = true), () => (t.boost = false));
  press('tDrift', () => (t.handbrake = true), () => (t.handbrake = false));
  press('tLeft', () => (t.steer = -1), () => (t.steer = 0));
  press('tRight', () => (t.steer = 1), () => (t.steer = 0));
  return true;
}
