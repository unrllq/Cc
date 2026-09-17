// NEON MILE — сборка сцены, состояний игры и главного цикла.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { buildCity, hitBuilding } from './city.js';
import { createRider } from './rider.js';
import { createPlayer } from './player.js';
import { createCourse, fmtTime } from './gameplay.js';
import { createHUD } from './hud.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';

const canvas = document.getElementById('scene');
const ui = {
  loading: document.getElementById('loading'),
  loadBar: document.getElementById('loadBar'),
  loadMsg: document.getElementById('loadMsg'),
  menu: document.getElementById('menu'),
  hud: document.getElementById('hud'),
  pause: document.getElementById('pause'),
  results: document.getElementById('results')
};

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.4, 6000);

// свет: холодная «луна» сверху + розовый отражённый снизу
scene.add(new THREE.HemisphereLight(0x33507f, 0x0a0912, 0.85));
const moon = new THREE.DirectionalLight(0xa9c8ff, 0.75);
moon.position.set(-420, 600, -380);
scene.add(moon);
const fill = new THREE.DirectionalLight(0xff3d93, 0.35);
fill.position.set(300, -120, 420);
scene.add(fill);

// пост-обработка
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.82, 0.62, 0.62);
composer.addPass(bloom);
composer.addPass(new OutputPass());

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});

// ---------------------------------------------------------------- загрузка
const step = (pct, msg) => new Promise(r => {
  ui.loadBar.style.width = pct + '%';
  ui.loadMsg.textContent = msg;
  requestAnimationFrame(() => setTimeout(r, 16));
});

let city, rider, player, course, hud, audio, input;
let mode = 'loading';
let menuAngle = 0;

async function boot() {
  await step(12, 'генерация лондонского сити…');
  city = await buildCity(scene, renderer);

  await step(48, 'сборка кибер-байка…');
  rider = await createRider(scene);

  await step(70, 'разметка трассы…');
  course = createCourse(scene);

  await step(84, 'калибровка приборов…');
  hud = createHUD(city);
  audio = createAudio();
  input = createInput(canvas);
  player = createPlayer(scene, camera, city, rider);

  player.onCrash = () => {
    hud.damage(true);
    hud.toast('СТОЛКНОВЕНИЕ', '#ff2d94');
    audio.crash();
  };
  player.onRespawnRequest = () => {
    const cp = course.lastCheckpoint();
    player.respawn(cp.pos, cp.yaw);
    hud.damage(false);
  };
  player.onBounds = () => hud.toast('ГРАНИЦА ЗОНЫ', '#ffb63d');
  course.onRing = (combo, kmh) => {
    audio.blip(700 + combo * 60);
    hud.toast(combo > 1 ? `КОЛЬЦО +${combo}×  ${Math.round(kmh)} км/ч` : 'КОЛЬЦО ПРОЙДЕНО');
  };
  course.onFinish = (t) => finish(t);

  player.respawn();
  rider.root.visible = true;
  window.__game = { player, course, city, rider, camera, scene, renderer, start,
    hit: v => hitBuilding(city.colliders, v, 3.4), get mode() { return mode; } };

  await step(100, 'готово');
  ui.loading.classList.add('hidden');
  ui.menu.classList.remove('hidden');
  mode = 'menu';

  const loaded = [rider.hasGLB() && 'bike.glb', city.usingGLB && 'city.glb'].filter(Boolean);
  if (loaded.length) {
    document.getElementById('modeLine').innerHTML =
      `модели из assets/: <b>${loaded.join(' + ')}</b> — процедурные версии отключены`;
  }
}

// ---------------------------------------------------------------- состояния
function start() {
  ui.menu.classList.add('hidden');
  ui.results.classList.add('hidden');
  ui.pause.classList.add('hidden');
  ui.hud.classList.remove('hidden');
  course.reset();
  player.topKmh = 0;
  player.crashes = 0;
  player.respawn(new THREE.Vector3(-320, 150, -420), 0.75);
  hud.damage(false);
  audio.init(); audio.resume();
  input.lock();
  mode = 'play';
}

function pause() {
  if (mode !== 'play') return;
  mode = 'pause';
  ui.pause.classList.remove('hidden');
  document.exitPointerLock?.();
}

function resume() {
  if (mode !== 'pause') return;
  ui.pause.classList.add('hidden');
  input.lock();
  mode = 'play';
}

function finish(t) {
  mode = 'results';
  ui.hud.classList.add('hidden');
  ui.results.classList.remove('hidden');
  document.exitPointerLock?.();
  document.getElementById('resTime').textContent = fmtTime(t);
  document.getElementById('resBest').textContent = course.state.best ? fmtTime(course.state.best) : '—';
  document.getElementById('resTop').textContent = Math.round(player.topKmh) + ' км/ч';
  document.getElementById('resCrash').textContent = player.crashes;
  audio.blip(1200, 0.35, 'sine');
}

// ---------------------------------------------------------------- ввод UI
document.getElementById('playBtn').addEventListener('click', start);
document.getElementById('againBtn').addEventListener('click', start);
document.getElementById('restartBtn').addEventListener('click', start);
document.getElementById('resumeBtn').addEventListener('click', resume);

canvas.addEventListener('click', () => { if (mode === 'play') input.lock(); });

addEventListener('keydown', e => {
  if (e.code === 'Escape') { mode === 'play' ? pause() : resume(); }
  if (mode !== 'play') return;
  if (e.code === 'KeyC') player.camMode = (player.camMode + 1) % 3;
  if (e.code === 'KeyR') {
    const cp = course.lastCheckpoint();
    player.respawn(cp.pos, cp.yaw);
    hud.damage(false);
  }
});

document.addEventListener('pointerlockchange', () => {
  // мышь потеряна не по нашей воле — считаем это паузой
  if (mode === 'play' && !document.pointerLockElement && !input.state.touch) pause();
});

document.getElementById('optBloom').addEventListener('change', e => {
  bloom.enabled = e.target.checked;
});
document.getElementById('optInvert').addEventListener('change', e => {
  input.state.invertY = e.target.checked;
});
document.getElementById('optSound').addEventListener('change', e => {
  audio.setEnabled(e.target.checked);
});
document.getElementById('optSens').addEventListener('input', e => {
  input.state.sens = e.target.value / 100;
});
document.getElementById('optQuality').addEventListener('change', e => {
  const q = e.target.value;
  const dpr = q === 'low' ? 0.75 : q === 'mid' ? 1.1 : Math.min(devicePixelRatio, 1.75);
  renderer.setPixelRatio(dpr);
  composer.setPixelRatio?.(dpr);
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  bloom.strength = q === 'low' ? 0.5 : 0.82;
  bloom.enabled = q !== 'low' && document.getElementById('optBloom').checked;
});

// ---------------------------------------------------------------- цикл
const clock = new THREE.Clock();
let time = 0;

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  time += dt;

  if (mode === 'loading') { composer.render(); return; }

  city.update(dt, time);

  if (mode === 'play') {
    input.update(dt);
    player.update(dt, input.state, time);
    course.update(dt, time, player);
    hud.update(player, course, camera, time);
    audio.update(THREE.MathUtils.clamp(player.speed / 128, 0, 1), player.boostAmount);
  } else if (mode === 'menu' || mode === 'results') {
    // кинематографичный облёт Сити на фоне меню
    menuAngle += dt * 0.055;
    const r = 640;
    camera.position.set(Math.cos(menuAngle) * r, 210 + Math.sin(menuAngle * 0.7) * 70, Math.sin(menuAngle) * r - 60);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 90, 0);
    if (Math.abs(camera.fov - 55) > 0.05) { camera.fov = 55; camera.updateProjectionMatrix(); }
    // байк нарезает круги вдалеке, чтобы меню не было статичным
    const a = menuAngle * 3.1;
    rider.root.position.set(Math.cos(a) * 260, 170 + Math.sin(a * 1.7) * 40, Math.sin(a) * 260);
    rider.root.lookAt(Math.cos(a + 0.2) * 260, 170, Math.sin(a + 0.2) * 260);
    rider.update(dt, { speed01: 0.55, boost: 0.2, turn: 0.3, pitchLean: 0, flight: 1, time });
  }

  composer.render();
}

boot().then(frame).catch(err => {
  ui.loadMsg.textContent = 'ошибка загрузки: ' + err.message;
  console.error(err);
});
