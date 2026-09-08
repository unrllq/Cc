import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

/* ============================================================
   BOT SMASHER — click/tap the screen to drop-kick the block bot
   ============================================================ */

const MIXAMO_SCALE = 0.01; // Mixamo FBX exports are in centimeters

const canvas = document.getElementById('scene');
const loadingEl = document.getElementById('loading');
const loadingFill = document.getElementById('loadingFill');
const loadingLabel = document.getElementById('loadingLabel');
const hud = document.getElementById('hud');
const enemyHpFill = document.getElementById('enemyHpFill');
const scoreValueEl = document.getElementById('scoreValue');
const comboBadge = document.getElementById('comboBadge');
const comboValueEl = document.getElementById('comboValue');
const koBadge = document.getElementById('koBadge');
const hintText = document.getElementById('hintText');

/* ---------------- renderer / scene / camera ---------------- */

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0c14);
scene.fog = new THREE.Fog(0x0a0c14, 6, 16);

const VFOV_DEG = 42;
const FRAME_HALF_WIDTH = 2.6; // world units that must stay visible on either side of center
const camera = new THREE.PerspectiveCamera(VFOV_DEG, window.innerWidth / window.innerHeight, 0.1, 100);
const cameraBasePos = new THREE.Vector3(0.2, 1.55, 4.1);
const cameraLookAt = new THREE.Vector3(0, 1.0, 0);
camera.position.copy(cameraBasePos);
camera.lookAt(cameraLookAt);

function onResize() {
  const aspect = window.innerWidth / window.innerHeight;
  camera.aspect = aspect;

  // on narrow/portrait screens the horizontal FOV shrinks a lot faster than the
  // vertical one, so dolly the camera back to keep both fighters in frame
  const vTan = Math.tan(THREE.MathUtils.degToRad(VFOV_DEG) / 2);
  const neededZ = FRAME_HALF_WIDTH / (vTan * Math.max(aspect, 0.001));
  cameraBasePos.z = THREE.MathUtils.clamp(neededZ, 4.1, 8.5);

  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize);
onResize();

/* ---------------- arena ---------------- */

const ambient = new THREE.AmbientLight(0x8899bb, 0.55);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
keyLight.position.set(2.5, 5, 3.5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 1;
keyLight.shadow.camera.far = 15;
keyLight.shadow.camera.left = -4;
keyLight.shadow.camera.right = 4;
keyLight.shadow.camera.top = 4;
keyLight.shadow.camera.bottom = -4;
keyLight.shadow.bias = -0.0015;
scene.add(keyLight);

const rimRed = new THREE.PointLight(0xff2e4d, 6, 8, 2);
rimRed.position.set(1.6, 1.6, -1.5);
scene.add(rimRed);

const rimBlue = new THREE.PointLight(0x3d8bff, 5, 8, 2);
rimBlue.position.set(-1.8, 1.4, -1.2);
scene.add(rimBlue);

// floor
const floorGeo = new THREE.CircleGeometry(6, 64);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x14161f, roughness: 0.85, metalness: 0.1 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// glowing ring on the floor to frame the fight
const ringGeo = new THREE.RingGeometry(1.55, 1.62, 64);
const ringMat = new THREE.MeshBasicMaterial({ color: 0xff2e4d, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
const ring = new THREE.Mesh(ringGeo, ringMat);
ring.rotation.x = -Math.PI / 2;
ring.position.y = 0.01;
scene.add(ring);

const ring2Geo = new THREE.RingGeometry(2.35, 2.4, 64);
const ring2 = new THREE.Mesh(ring2Geo, new THREE.MeshBasicMaterial({ color: 0x3d8bff, transparent: true, opacity: 0.28, side: THREE.DoubleSide }));
ring2.rotation.x = -Math.PI / 2;
ring2.position.y = 0.008;
scene.add(ring2);

// backdrop wall with vertical neon strips
const backWall = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 8),
  new THREE.MeshStandardMaterial({ color: 0x0c0d14, roughness: 1 })
);
backWall.position.set(0, 4, -4);
scene.add(backWall);

function makeStrip(x, color) {
  const strip = new THREE.Mesh(
    new THREE.PlaneGeometry(0.06, 8),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 })
  );
  strip.position.set(x, 4, -3.98);
  scene.add(strip);
}
for (let i = -9; i <= 9; i += 1.5) {
  makeStrip(i, i % 3 === 0 ? 0xff2e4d : 0x22263a);
}

// simple drifting particles for atmosphere
const particleCount = 120;
const particleGeo = new THREE.BufferGeometry();
const particlePos = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
  particlePos[i * 3] = (Math.random() - 0.5) * 10;
  particlePos[i * 3 + 1] = Math.random() * 4;
  particlePos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 1;
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
const particles = new THREE.Points(particleGeo, new THREE.PointsMaterial({ color: 0x556, size: 0.02, transparent: true, opacity: 0.5 }));
scene.add(particles);

/* ---------------- loading manager ---------------- */

const manager = new THREE.LoadingManager();
manager.onProgress = (_url, loaded, total) => {
  const pct = Math.round((loaded / total) * 100);
  loadingFill.style.width = pct + '%';
  loadingLabel.textContent = `Загрузка арены… ${pct}%`;
};
manager.onError = (url) => {
  loadingLabel.textContent = `Ошибка загрузки: ${url}`;
};

const loader = new FBXLoader(manager);

function tintMaterials(root, color) {
  root.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((m) => {
        if (m && m.color) {
          m.color = m.color.clone().lerp(new THREE.Color(color), 0.55);
        }
        if (m) {
          m.roughness = 0.55;
          m.metalness = 0.25;
        }
      });
    }
  });
}

let playerMixer, botMixer;
let playerAction, botAction;
let playerModel, botModel;

let loadedCount = 0;
function checkAllLoaded() {
  loadedCount++;
  if (loadedCount === 2) {
    loadingEl.classList.add('hidden');
    hud.classList.remove('hidden');
    startIdle();
  }
}

// PLAYER — Drop Kick rig, held at frame 0 as a ready stance until clicked
loader.load('assets/drop-kick.fbx', (fbx) => {
  playerModel = fbx;
  fbx.scale.setScalar(MIXAMO_SCALE);
  fbx.position.set(-1.05, 0, 0.15);
  fbx.rotation.y = Math.PI / 2 + 0.15;
  tintMaterials(fbx, 0x3d8bff);
  scene.add(fbx);

  playerMixer = new THREE.AnimationMixer(fbx);
  const clip = fbx.animations[0];
  playerAction = playerMixer.clipAction(clip);
  playerAction.clampWhenFinished = true;
  playerAction.loop = THREE.LoopOnce;
  // freeze on the very first frame as an idle "ready" pose
  playerAction.timeScale = 1.35; // snappier attack, less waiting between clicks
  playerAction.play();
  playerAction.paused = true;
  playerMixer.update(0);

  checkAllLoaded();
});

// BOT — Center Block rig, loops its blocking stance forever
loader.load('assets/center-block.fbx', (fbx) => {
  botModel = fbx;
  fbx.scale.setScalar(MIXAMO_SCALE);
  fbx.position.set(1.05, 0, 0);
  fbx.rotation.y = -Math.PI / 2 - 0.15;
  tintMaterials(fbx, 0xff2e4d);
  scene.add(fbx);

  botMixer = new THREE.AnimationMixer(fbx);
  const clip = fbx.animations[0];
  botAction = botMixer.clipAction(clip);
  botAction.loop = THREE.LoopRepeat;
  botAction.play();

  checkAllLoaded();
});

function startIdle() {
  // gentle bob so the "ready" pose doesn't feel frozen
  idleBob = true;
}
let idleBob = false;

/* ---------------- game state ---------------- */

const state = {
  enemyHp: 100,
  maxHp: 100,
  score: 0,
  combo: 0,
  attacking: false,
  ko: false,
  lastHitTime: 0,
};

const clock = new THREE.Clock();
let comboResetTimer = null;

function updateHpBar() {
  const pct = Math.max(0, (state.enemyHp / state.maxHp) * 100);
  enemyHpFill.style.width = pct + '%';
}

function addScore(amount) {
  state.score += amount;
  scoreValueEl.textContent = state.score;
}

function bumpCombo() {
  state.combo++;
  comboValueEl.textContent = state.combo;
  comboBadge.classList.add('show');
  clearTimeout(comboResetTimer);
  comboResetTimer = setTimeout(() => {
    state.combo = 0;
    comboBadge.classList.remove('show');
  }, 1400);
}

/* ---------------- camera shake ---------------- */

let shakeTime = 0;
let shakeStrength = 0;
function triggerShake(strength = 0.12, duration = 0.28) {
  shakeStrength = strength;
  shakeTime = duration;
}

/* ---------------- synthesized hit sound (no external audio needed) ---------------- */

let audioCtx;
function playThud(power = 1) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140 * power, t0);
    osc.frequency.exponentialRampToValueAtTime(40, t0 + 0.18);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.5 * power, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.22);

    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.24);

    // short noise burst for "impact" texture
    const bufferSize = audioCtx.sampleRate * 0.06;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.35 * power, t0);
    noise.connect(noiseGain).connect(audioCtx.destination);
    noise.start(t0);
  } catch (e) {
    /* audio is optional */
  }
}

/* ---------------- hit spark effect ---------------- */

const sparkGroup = new THREE.Group();
scene.add(sparkGroup);

function spawnSpark(position) {
  const count = 18;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const vel = [];
  for (let i = 0; i < count; i++) {
    pos[i * 3] = position.x;
    pos[i * 3 + 1] = position.y;
    pos[i * 3 + 2] = position.z;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const speed = 1.5 + Math.random() * 2;
    vel.push(new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta) * speed,
      Math.abs(Math.cos(phi)) * speed + 1,
      Math.sin(phi) * Math.sin(theta) * speed
    ));
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0xffd23d, size: 0.06, transparent: true, opacity: 1 });
  const points = new THREE.Points(geo, mat);
  points.userData = { vel, life: 0 };
  sparkGroup.add(points);
}

function updateSparks(dt) {
  for (let i = sparkGroup.children.length - 1; i >= 0; i--) {
    const p = sparkGroup.children[i];
    p.userData.life += dt;
    const posAttr = p.geometry.getAttribute('position');
    for (let j = 0; j < posAttr.count; j++) {
      const v = p.userData.vel[j];
      v.y -= 9.8 * dt; // gravity
      posAttr.setX(j, posAttr.getX(j) + v.x * dt);
      posAttr.setY(j, posAttr.getY(j) + v.y * dt);
      posAttr.setZ(j, posAttr.getZ(j) + v.z * dt);
    }
    posAttr.needsUpdate = true;
    p.material.opacity = Math.max(0, 1 - p.userData.life / 0.6);
    if (p.userData.life > 0.6) {
      p.geometry.dispose();
      p.material.dispose();
      sparkGroup.remove(p);
    }
  }
}

/* ---------------- bot reaction (no hit-react clip available, so we fake it) ---------------- */

let botStagger = { active: false, t: 0 };
let botKnockedOut = false;

function reactBotHit() {
  botStagger.active = true;
  botStagger.t = 0;
  rimRed.intensity = 12;
}

function updateBotStagger(dt) {
  if (!botModel) return;
  if (rimRed.intensity > 6) rimRed.intensity = Math.max(6, rimRed.intensity - dt * 30);

  if (botStagger.active) {
    botStagger.t += dt;
    const d = botStagger.t;
    const wobble = Math.sin(d * 40) * Math.max(0, 0.08 - d * 0.3);
    botModel.rotation.z = wobble;
    botModel.position.x = 1.05 + Math.sin(d * 50) * Math.max(0, 0.03 - d * 0.1);
    if (d > 0.25) {
      botStagger.active = false;
      botModel.rotation.z = 0;
      botModel.position.x = 1.05;
    }
  }
}

function knockOutBot() {
  if (!botModel || botKnockedOut) return;
  botKnockedOut = true;
  state.ko = true;
  botAction.paused = true;
  koBadge.classList.add('show');
  hintText.classList.add('fade');
  triggerShake(0.28, 0.5);

  // topple the bot over since we have no death animation
  const startRot = botModel.rotation.x;
  const targetRot = startRot + Math.PI / 2.1;
  const startY = botModel.position.y;
  let t = 0;
  function fall() {
    t += 1 / 60;
    const p = Math.min(1, t / 0.6);
    const eased = 1 - Math.pow(1 - p, 3);
    botModel.rotation.x = startRot + (targetRot - startRot) * eased;
    botModel.position.y = startY - eased * 0.15;
    if (p < 1) requestAnimationFrame(fall);
    else setTimeout(respawnBot, 1100);
  }
  fall();
}

function respawnBot() {
  if (!botModel) return;
  const startRot = botModel.rotation.x;
  const startY = botModel.position.y;
  let t = 0;
  function rise() {
    t += 1 / 60;
    const p = Math.min(1, t / 0.5);
    const eased = p * p * (3 - 2 * p);
    botModel.rotation.x = startRot * (1 - eased);
    botModel.position.y = startY * (1 - eased);
    if (p < 1) requestAnimationFrame(rise);
    else {
      botModel.rotation.x = 0;
      botModel.position.y = 0;
      botAction.paused = false;
      botAction.play();
      state.enemyHp = state.maxHp;
      updateHpBar();
      state.ko = false;
      botKnockedOut = false;
      koBadge.classList.remove('show');
      hintText.classList.remove('fade');
    }
  }
  rise();
}

/* ---------------- attack flow ---------------- */

function attack() {
  if (!playerAction || !botAction || state.attacking || state.ko) return;
  state.attacking = true;
  hintText.classList.add('fade');

  playerAction.reset();
  playerAction.paused = false;
  playerAction.play();

  const clip = playerAction.getClip();
  const duration = clip.duration / playerAction.timeScale; // real playback seconds
  const impactDelay = duration * 0.42; // roughly when the kick connects

  setTimeout(() => {
    if (state.ko) return;
    const dmg = 8 + Math.floor(Math.random() * 6);
    state.enemyHp = Math.max(0, state.enemyHp - dmg);
    updateHpBar();
    addScore(dmg * 10);
    bumpCombo();
    reactBotHit();
    triggerShake();
    playThud(1 + Math.min(1, state.combo * 0.08));

    const botHead = new THREE.Vector3(1.0, 1.55, 0.1);
    spawnSpark(botHead);

    if (state.enemyHp <= 0) {
      setTimeout(knockOutBot, 120);
    }
  }, impactDelay * 1000);

  setTimeout(() => {
    state.attacking = false;
    hintText.classList.remove('fade');
  }, duration * 1000 + 60);
}

canvas.addEventListener('pointerdown', () => {
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  attack();
});

/* ---------------- render loop ---------------- */

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  if (playerMixer) playerMixer.update(dt);
  if (botMixer && !state.ko) botMixer.update(dt);

  if (idleBob && playerModel && !state.attacking) {
    playerModel.position.y = Math.sin(t * 1.6) * 0.01;
  }
  if (botModel && !state.ko) {
    botModel.position.y = Math.sin(t * 1.4 + 1) * 0.008;
  }

  updateBotStagger(dt);
  updateSparks(dt);

  ring.material.opacity = 0.45 + Math.sin(t * 2) * 0.1;
  particles.rotation.y += dt * 0.02;

  // camera shake
  let camOffset = new THREE.Vector3();
  if (shakeTime > 0) {
    shakeTime -= dt;
    const s = shakeStrength * (shakeTime / 0.3);
    camOffset.set((Math.random() - 0.5) * s, (Math.random() - 0.5) * s, 0);
  }
  camera.position.copy(cameraBasePos).add(camOffset);
  camera.lookAt(cameraLookAt);

  renderer.render(scene, camera);
}
animate();
