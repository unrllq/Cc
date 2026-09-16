import * as THREE from 'three';
import { CFG } from './config.js';
import { Renderer } from './engine/renderer.js';
import { loadAssets } from './engine/assets.js';
import { buildWorld } from './world/world.js';
import { Bike } from './bike/bike.js';
import { ChaseCamera, CAM_MODES } from './bike/chasecam.js';
import { Input } from './input.js';
import { GameAudio } from './audio/audio.js';
import { SkidMarks } from './fx/skidmarks.js';
import { Particles } from './fx/particles.js';
import { HUD } from './ui/hud.js';
import { Menus, setupTouch } from './ui/menus.js';
import { settings, setSetting, resetSettings } from './settings.js';
import { Game } from './game.js';

const QUALITIES = ['high', 'medium', 'low'];
const _v = new THREE.Vector3();
const _rear = new THREE.Vector3();

class App {
  constructor() {
    this.canvas = document.getElementById('gl');
    this.quality = detectQuality();
    this.renderer = new Renderer(this.canvas, this.quality);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(CFG.camera.fov, innerWidth / innerHeight, 0.25, 2000);
    this.renderer.attach(this.scene, this.camera);
    this.clock = new THREE.Clock();
    this.input = new Input();
    this.audio = new GameAudio();
    this.soundOn = true;
    this.showFps = false;
    this.state = 'loading';
    this.fxState = { speed01: 0, boost01: 0, damage01: 0, vignette: 1 };
    this.frames = 0; this.fpsTime = 0; this.fps = 60; this.slowFrames = 0;

    this.menus = new Menus({
      start: (mode) => this.startRun(mode),
      resume: () => this.setPaused(false),
      restart: () => this.startRun(this.game.mode),
      quit: () => this.toMenu(),
      cycleQuality: () => this.cycleQuality(),
      toggleSound: () => this.toggleSound(),
      toggleFps: () => this.toggleFps(),
      setSetting: (k, v) => setSetting(k, v),
      resetSettings: () => { resetSettings(); this.menus.syncSettings(settings); },
      settings,
    });
    this.menus.setQualityLabel(this.quality);
    this.menus.setSoundLabel(true);
    setupTouch(this.input);

    addEventListener('resize', () => this.renderer.resize());
    addEventListener('blur', () => { if (this.state === 'playing') this.setPaused(true); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'playing') this.setPaused(true);
    });
  }

  async boot() {
    const assets = await loadAssets((p) => this.menus.progress(p));
    this.menus.progress(1);
    await frame();

    const world = buildWorld({
      scene: this.scene, renderer: this.renderer.renderer, assets, quality: this.quality,
    });
    this.world = world;

    this.fx = {
      skid: new SkidMarks(this.scene, { max: this.quality === 'low' ? 420 : 1100 }),
      particles: new Particles(this.scene, { scale: this.renderer.q.particles }),
      sparks: (p, n, power) => this.fx.particles.sparks3(p, n, power),
    };

    this.bike = new Bike({ gltf: assets.rider, collision: world.collision, fx: this.fx, audio: this.audio });
    this.scene.add(this.bike.object);
    this.chase = new ChaseCamera(this.camera, world.collision);

    this.hud = new HUD(world);
    this.game = new Game({
      scene: this.scene, bike: this.bike, collision: world.collision, map: world.map,
      audio: this.audio, hud: this.hud, fx: this.fx, camera: this.camera,
    });

    this.bike.reset(CFG.world.spawn[0], CFG.world.spawn[1], CFG.world.spawn[2]);
    this.chase.snap(this.bike);
    this.menus.setBest(this.game.records);
    this.menus.show('title');
    this.state = 'menu';
    this.renderer.render(0.016, this.fxState);
    this.loop();
  }

  startRun(mode) {
    this.audio.start();
    this.audio.resume();
    this.game.start(mode);
    this.state = 'playing';
    this.menus.hide();
    this.hud.show(true);
    document.getElementById('objective').classList.toggle('hide', mode !== 'timeattack');
    document.getElementById('cpNav').classList.toggle('hide', mode !== 'timeattack');
    this.chase.snap(this.bike);
  }

  toMenu() {
    this.state = 'menu';
    this.hud.show(false);
    this.menus.setBest(this.game.records);
    this.menus.show('title');
  }

  setPaused(p) {
    if (p && this.state === 'playing') { this.state = 'paused'; this.menus.show('pause'); this.menus.setFpsLabel(this.showFps); }
    else if (!p && this.state === 'paused') { this.state = 'playing'; this.menus.hide(); }
  }

  cycleQuality() {
    const i = (QUALITIES.indexOf(this.quality) + 1) % QUALITIES.length;
    this.quality = QUALITIES[i];
    this.renderer.setQuality(this.quality);
    this.menus.setQualityLabel(this.quality);
    this.slowFrames = 0;
  }

  toggleSound() {
    this.soundOn = !this.soundOn;
    this.audio.setMuted(!this.soundOn);
    this.menus.setSoundLabel(this.soundOn);
  }

  toggleFps() {
    this.showFps = !this.showFps;
    document.getElementById('fps').classList.toggle('hidden', !this.showFps);
    this.menus.setFpsLabel(this.showFps);
  }

  loop = () => {
    requestAnimationFrame(this.loop);
    const raw = this.clock.getDelta();
    const dt = Math.min(0.05, raw);

    // fps meter + auto quality drop
    this.frames++;
    this.fpsTime += raw;
    if (this.fpsTime >= 0.5) {
      this.fps = this.frames / this.fpsTime;
      this.frames = 0; this.fpsTime = 0;
      if (this.showFps) document.getElementById('fps').textContent = `${Math.round(this.fps)} FPS · ${this.quality}`;
      if (this.state === 'playing') {
        if (this.fps < 26 && this.quality !== 'low') {
          if (++this.slowFrames >= 4) { this.cycleQuality(); this.slowFrames = 0; }
        } else this.slowFrames = Math.max(0, this.slowFrames - 1);
      }
    }

    const acts = this.input.drain();
    for (const a of acts) {
      if (a === 'pause') {
        if (this.state === 'playing') this.setPaused(true);
        else if (this.state === 'paused') this.setPaused(false);
      }
      if (a === 'camera' && this.bike) this.hud.message(labelFor(this.chase.cycle()), 700);
      if (a === 'reset' && this.state === 'playing') { this.game.respawn(); this.hud.message('РЕСПАУН', 700); }
      if (a === 'mute') this.toggleSound();
      if (a === 'quality') this.cycleQuality();
      if (a === 'confirm' && this.state === 'menu') this.startRun('timeattack');
    }

    const input = this.input.update(dt);

    if (this.state === 'playing' || this.state === 'menu') {
      const playing = this.state === 'playing';
      const ctrl = playing ? input : IDLE;
      this.bike.update(dt, ctrl);
      this.bike.setBrakeLight(ctrl.brake > 0.1 || ctrl.handbrake);
      if (playing && this.bike.impact > 0.25 && !this._rumbled) {
        this.input.rumble(Math.min(1, this.bike.impact), 180);
        this._rumbled = true;
      } else if (this.bike.impact < 0.05) this._rumbled = false;
      if (this.bike.needsRespawn) { this.bike.needsRespawn = false; this.game.respawn(); }
      this.chase.update(dt, this.bike, ctrl);
      if (this.world.sky.follow) this.world.sky.follow(this.bike.pos);
      this.emitFx(dt, ctrl);
      if (playing) {
        this.game.update(dt);
        this.hud.update(dt, { bike: this.bike, game: this.game, camera: this.camera });
        if (this.game.state === 'finished') {
          this.state = 'finished';
          this.hud.show(false);
          this.menus.results(this.game.result, this.game.mode);
        }
      }
      this.game.cp.update(dt, this.camera);
    }

    this.audio.update(dt, this.bike || DUMMY, this.state !== 'playing');

    // post fx state
    const b = this.bike;
    this.fxState.speed01 = b ? b.speed01 : 0;
    this.fxState.boost01 = b && b.boosting ? Math.min(1, (this.fxState.boost01 + dt * 4)) : Math.max(0, this.fxState.boost01 - dt * 3);
    this.fxState.damage01 = b ? b.impact : 0;
    this.fxState.vignette = this.state === 'playing' ? 1 : 1.15;

    this.fx?.skid.update(dt);
    this.fx?.particles.update(dt);
    this.renderer.render(dt, this.fxState);
  };

  /** Skid marks, tyre smoke and nitro flame come from the bike's rear contact. */
  emitFx(dt, input) {
    const bike = this.bike;
    const rearOffset = CFG.bike.wheelBase * 0.5;
    _rear.copy(bike.pos).addScaledVector(bike.forward, -rearOffset);
    _rear.y = bike.groundY;

    const slip = Math.abs(bike.slip);
    const burnout = input.throttle > 0.9 && bike.speed < 7 && bike.onGround;
    const sliding = bike.onGround && bike.speed > 5 && (slip > 0.12 || input.handbrake || burnout);
    if (sliding) {
      const strength = Math.min(1, slip * 3.2 + (input.handbrake ? 0.45 : 0) + (burnout ? 0.7 : 0));
      this.fx.skid.add(_rear, bike.right, strength);
      if (Math.random() < 0.85) this.fx.particles.tyreSmoke(_rear, bike.vel, strength);
    } else {
      this.fx.skid.break();
    }
    if (bike.boosting && bike.speed > 2) {
      _v.copy(bike.pos).addScaledVector(bike.forward, -rearOffset * 0.9);
      _v.y = bike.pos.y + 0.55;
      this.fx.particles.boostFlame(_v, _v2set(bike.forward));
    }
  }
}

const IDLE = { throttle: 0, brake: 0, steer: 0, handbrake: false, boost: false, lookBack: false, freeYaw: 0 };
const DUMMY = { rpm: 0.12, speed: 0, speed01: 0, slip: 0, boosting: false };
const _tmpDir = new THREE.Vector3();
function _v2set(forward) { return _tmpDir.set(-forward.x, 0, -forward.z); }
function frame() { return new Promise((r) => requestAnimationFrame(() => r())); }
function labelFor(mode) {
  return { chase: 'КАМЕРА: ПОГОНЯ', close: 'КАМЕРА: БЛИЖЕ', hood: 'КАМЕРА: ОТ ПЕРВОГО', cinematic: 'КАМЕРА: КИНО' }[mode] || mode;
}

function detectQuality() {
  const mem = navigator.deviceMemory || 4;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const small = Math.min(innerWidth, innerHeight) < 700;
  if (coarse || small || mem <= 2) return 'medium';
  return 'high';
}

const app = new App();
app.boot().catch((err) => {
  console.error(err);
  document.getElementById('loadText').innerHTML =
    `<span style="color:#ff5a3c">ОШИБКА ЗАГРУЗКИ</span><br><small>${String(err && err.message || err)}</small>`;
});
window.__app = app;
