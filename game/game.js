import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/* ============================================================
   BOT SMASHER — three buttons, full control:
   УДАР cycles punches (Punching → Boxing → Punching Bag), КИК
   cycles kicks (Martelo → Drop Kick), and РЫВОК dashes in for a
   Fist Fight charge attack, then dashes back. The bot blocks,
   randomly throws moves back, and periodically rushes in with
   its own charge attack too.
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
const btnPunch = document.getElementById('btnPunch');
const btnRun = document.getElementById('btnRun');
const btnKick = document.getElementById('btnKick');

// stand marks both fighters return to between moves, and the closer
// "clash" marks the RUN charge attack dashes in to
const PLAYER_STAND_X = -1.05;
const BOT_STAND_X = 1.05;
const PLAYER_CLASH_X = -0.18;
const BOT_CLASH_X = 0.18;

/* ---------------- renderer / scene / camera ---------------- */

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x100e0c);
scene.fog = new THREE.Fog(0x100e0c, 8, 24);

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

/* ---------------- arena: a real scanned stone outcrop as the location ---------------- */

const ambient = new THREE.AmbientLight(0xaaa38c, 0.6);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xfff2d8, 1.7);
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

// low warm bounce light so the rock face isn't a flat silhouette from the back
const bounceLight = new THREE.DirectionalLight(0xffd9a0, 0.4);
bounceLight.position.set(-1, 0.6, 4);
scene.add(bounceLight);

const rimRed = new THREE.PointLight(0xff2e4d, 6, 8, 2);
rimRed.position.set(1.6, 1.6, -1.5);
scene.add(rimRed);

const rimBlue = new THREE.PointLight(0x3d8bff, 5, 8, 2);
rimBlue.position.set(-1.8, 1.4, -1.2);
scene.add(rimBlue);

// ground — a plain earthy floor; the fighters don't stand on the scanned rock
// itself (its scanned surface is too jagged to stand on believably), it
// stands behind them as the location's centerpiece
const floorGeo = new THREE.CircleGeometry(7, 64);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x342f26, roughness: 0.95, metalness: 0.02 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// the scanned stone location, pushed well back so it reads as a distant
// backdrop behind the fence ring rather than looming over the fight
const gltfLoader = new GLTFLoader();
gltfLoader.load('assets/location.glb', (gltf) => {
  const rock = gltf.scene;
  rock.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  const LOCATION_SCALE = 3.4;
  rock.scale.setScalar(LOCATION_SCALE);
  rock.rotation.y = 0.5;
  // the model's own lowest point is embedded slightly into the floor so no
  // gap is visible where the two meet
  rock.position.set(0.3, -(-0.6391) * LOCATION_SCALE - 0.35, -7.6);
  scene.add(rock);
  checkAllLoaded();
}, undefined, (err) => {
  console.error('location.glb failed to load', err);
  checkAllLoaded(); // decorative — don't block the fight over it
});

// a circular barrier of concrete fence segments surrounds the fight, with a
// wide gap left open on the camera-facing side so the view stays clear
const FENCE_SCALE = 0.01;
const RING_RADIUS = 4;
const RING_GAP_DEG = 110; // open arc facing the camera
gltfLoader.load('assets/fence.glb', (gltf) => {
  gltf.scene.updateMatrixWorld(true);
  let fenceMesh = null;
  gltf.scene.traverse((child) => {
    if (child.isMesh && !fenceMesh) fenceMesh = child;
  });
  const geo = fenceMesh.geometry.clone();
  geo.applyMatrix4(fenceMesh.matrixWorld);
  geo.computeBoundingBox();
  const segLength = (geo.boundingBox.max.z - geo.boundingBox.min.z) * FENCE_SCALE;
  const groundY = -geo.boundingBox.min.y * FENCE_SCALE;

  const usableArc = THREE.MathUtils.degToRad(360 - RING_GAP_DEG);
  const spacing = segLength * 0.55; // slight overlap reads as a solid barrier wall
  const count = THREE.MathUtils.clamp(Math.round((usableArc * RING_RADIUS) / spacing), 6, 24);

  const fence = new THREE.InstancedMesh(geo, fenceMesh.material, count);
  fence.castShadow = true;
  fence.receiveShadow = true;
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const theta = Math.PI - usableArc / 2 + (usableArc * i) / (count - 1);
    dummy.position.set(Math.sin(theta) * RING_RADIUS, groundY, Math.cos(theta) * RING_RADIUS);
    dummy.rotation.set(0, theta, 0);
    dummy.scale.setScalar(FENCE_SCALE);
    dummy.updateMatrix();
    fence.setMatrixAt(i, dummy.matrix);
  }
  fence.instanceMatrix.needsUpdate = true;
  scene.add(fence);
  checkAllLoaded();
}, undefined, (err) => {
  console.error('fence.glb failed to load', err);
  checkAllLoaded();
});

// a spectator behind the fence, watching from the far side (opposite camera)
gltfLoader.load('assets/spectator.glb', (gltf) => {
  const girl = gltf.scene;
  girl.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  girl.position.set(0.15, 0, -(RING_RADIUS + 1.1));
  girl.rotation.y = Math.PI; // face back toward the fight
  scene.add(girl);
  checkAllLoaded();
}, undefined, (err) => {
  console.error('spectator.glb failed to load', err);
  checkAllLoaded();
});

// drifting dust motes for atmosphere
const particleCount = 90;
const particleGeo = new THREE.BufferGeometry();
const particlePos = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
  particlePos[i * 3] = (Math.random() - 0.5) * 10;
  particlePos[i * 3 + 1] = Math.random() * 4;
  particlePos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 1;
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
const particles = new THREE.Points(particleGeo, new THREE.PointsMaterial({ color: 0xb8a684, size: 0.018, transparent: true, opacity: 0.4 }));
scene.add(particles);

/* ---------------- move catalogue ----------------
   Every clip is Mixamo's shared "X Bot" rig, so any clip can be
   bound to either character's mixer regardless of which FBX it
   came from. Only the two clips that carry a visible mesh (drop
   kick for the player, center block for the bot) are added to the
   scene — the rest are loaded purely to harvest their AnimationClip. */

const MOVES = {
  // curves-only moves, bound from assets/moves.json (no mesh of their own)
  punching: { group: 'punch', timeScale: 1.4, impactFrac: 0.45, dmg: [4, 7], sparkColor: 0x9fd8ff, spark: 12, shake: [0.08, 0.16], dolly: [0.09, 0.15], sound: 0.75 },
  boxing: { group: 'punch', timeScale: 1.2, impactFrac: 0.32, dmg: [5, 9], sparkColor: 0x9fd8ff, spark: 14, shake: [0.1, 0.18], dolly: [0.1, 0.16], sound: 0.9 },
  punchingBag: { group: 'punch', timeScale: 1.15, impactFrac: 0.38, dmg: [4, 8], sparkColor: 0x9fd8ff, spark: 13, shake: [0.09, 0.17], dolly: [0.09, 0.15], sound: 0.85 },
  martelo: { group: 'kick', timeScale: 1.2, impactFrac: 0.5, dmg: [10, 15], sparkColor: 0xffb23d, spark: 22, shake: [0.22, 0.32], dolly: [0.24, 0.3], sound: 1.15, hitStop: 0.045 },
  // the RUN button's charge attack — a long combo clip, sped up
  fistFight: { group: 'charge', timeScale: 2.6, impactFrac: 0.38, dmg: [16, 23], sparkColor: 0xffe9a8, spark: 30, shake: [0.32, 0.44], dolly: [0.34, 0.42], sound: 1.4, hitStop: 0.06 },
  // the signature move — full FBX with the player's own visible mesh
  dropKick: { file: 'assets/drop-kick.fbx', group: 'kick', timeScale: 1.35, impactFrac: 0.42, dmg: [12, 18], sparkColor: 0xffd23d, spark: 26, shake: [0.3, 0.42], dolly: [0.32, 0.4], sound: 1.3, hitStop: 0.055 },
};

const PLAYER_PUNCH_SEQUENCE = ['punching', 'boxing', 'punchingBag']; // УДАР button
const PLAYER_KICK_SEQUENCE = ['martelo', 'dropKick']; // КИК button
const BOT_MOVE_POOL = ['punching', 'boxing', 'punchingBag', 'martelo']; // random showboating between blocks

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
let playerModel, botModel;
const playerActions = {};
const botActions = {};
let playerAnimating = false; // true only while a player move's mixer should advance

function resetPlayerPose() {
  playerMixer.stopAllAction();
  const idle = playerActions.dropKick;
  idle.reset();
  idle.play();
  idle.paused = true;
  playerMixer.update(0);
  playerAnimating = false;
}

// 2 character FBX files (mesh + skeleton) + 1 JSON file with the other moves'
// animation curves (see assets/moves.json) + the fence ring + the spectator
const TOTAL_ASSETS = 5;
let loadedCount = 0;
function checkAllLoaded() {
  loadedCount++;
  if (loadedCount === TOTAL_ASSETS) {
    bindPendingClipsIfReady();
    loadingEl.classList.add('hidden');
    hud.classList.remove('hidden');
    startIdle();
    startBotAI();
  }
}

// PLAYER — Drop Kick rig supplies the visible mesh; held at frame 0 as a ready stance
loader.load(MOVES.dropKick.file, (fbx) => {
  playerModel = fbx;
  fbx.scale.setScalar(MIXAMO_SCALE);
  fbx.position.set(PLAYER_STAND_X, 0, 0.15);
  fbx.rotation.y = Math.PI / 2 + 0.15;
  tintMaterials(fbx, 0x3d8bff);
  scene.add(fbx);

  playerMixer = new THREE.AnimationMixer(fbx);
  const action = playerMixer.clipAction(fbx.animations[0]);
  action.clampWhenFinished = true;
  action.loop = THREE.LoopOnce;
  action.timeScale = MOVES.dropKick.timeScale;
  playerActions.dropKick = action;
  // freeze on the very first frame as an idle "ready" pose
  action.play();
  action.paused = true;
  playerMixer.update(0);

  checkAllLoaded();
});

// BOT — Center Block rig supplies the visible mesh; loops its blocking stance
loader.load('assets/center-block.fbx', (fbx) => {
  botModel = fbx;
  fbx.scale.setScalar(MIXAMO_SCALE);
  fbx.position.set(BOT_STAND_X, 0, 0);
  fbx.rotation.y = -Math.PI / 2 - 0.15;
  tintMaterials(fbx, 0xff2e4d);
  scene.add(fbx);

  botMixer = new THREE.AnimationMixer(fbx);
  const action = botMixer.clipAction(fbx.animations[0]);
  action.loop = THREE.LoopRepeat;
  botActions.centerBlock = action;
  action.play();
  botCurrentAction = action;

  checkAllLoaded();
});

// The remaining moves carry no character of their own, so instead of shipping
// 4 more full FBX files (mesh + skin weights we'd throw away) their animation
// curves were pre-extracted once via AnimationClip.toJSON() into a single
// small JSON file — bind each curve set to BOTH mixers (same Mixamo rig).
const pendingClips = {};

fetch('assets/moves.json')
  .then((r) => r.json())
  .then((data) => {
    Object.keys(data).forEach((name) => {
      pendingClips[name] = THREE.AnimationClip.parse(data[name]);
    });
    checkAllLoaded();
  })
  .catch((err) => {
    loadingLabel.textContent = `Ошибка загрузки: assets/moves.json`;
    console.error(err);
  });

// Standard_Run carries a lot of baked-in forward root motion (it's meant to
// travel, not loop in place) — zero out its Hips X/Z so it can be looped as
// a pure leg-cycling animation while WE drive the actual translation.
function makeInPlaceClip(clip) {
  const inPlace = clip.clone();
  const track = inPlace.tracks.find((t) => t.name.endsWith('Hips.position'));
  if (track) {
    const vals = track.values;
    const baseX = vals[0];
    const baseZ = vals[2];
    for (let i = 0; i < vals.length; i += 3) {
      vals[i] = baseX;
      vals[i + 2] = baseZ;
    }
  }
  return inPlace;
}

function bindPendingClipsIfReady() {
  if (!playerMixer || !botMixer) return;
  Object.keys(pendingClips).forEach((name) => {
    if (name === 'standardRun') {
      if (!playerActions.runCycle) {
        const pAction = playerMixer.clipAction(makeInPlaceClip(pendingClips[name]));
        pAction.loop = THREE.LoopRepeat;
        playerActions.runCycle = pAction;
      }
      if (!botActions.runCycle) {
        const bAction = botMixer.clipAction(makeInPlaceClip(pendingClips[name]));
        bAction.loop = THREE.LoopRepeat;
        botActions.runCycle = bAction;
      }
      return;
    }

    if (playerActions[name] && botActions[name]) return;
    const clip = pendingClips[name];
    const cfg = MOVES[name];

    if (!playerActions[name]) {
      const pAction = playerMixer.clipAction(clip);
      pAction.clampWhenFinished = true;
      pAction.loop = THREE.LoopOnce;
      pAction.timeScale = cfg.timeScale;
      playerActions[name] = pAction;
    }
    if (!botActions[name]) {
      const bAction = botMixer.clipAction(clip);
      bAction.clampWhenFinished = true;
      bAction.loop = THREE.LoopOnce;
      bAction.timeScale = cfg.timeScale;
      botActions[name] = bAction;
    }
  });
}

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
};

let punchIndex = 0; // next move in PLAYER_PUNCH_SEQUENCE
let kickIndex = 0; // next move in PLAYER_KICK_SEQUENCE

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

/* ---------------- camera: idle sway + attack punch-in + shake + hit-stop ---------------- */

let shakeTime = 0;
let shakeStrength = 0;
function triggerShake(strength = 0.12, duration = 0.28) {
  shakeStrength = strength;
  shakeTime = duration;
}

let dollyTime = 0;
let dollyDuration = 0.25;
let dollyStrength = 0;
function triggerDolly(strength, duration) {
  dollyStrength = strength;
  dollyDuration = duration;
  dollyTime = duration;
}

let hitStopTimer = 0;
function triggerHitStop(duration) {
  hitStopTimer = duration;
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

function spawnSpark(position, color = 0xffd23d, count = 18) {
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
  const mat = new THREE.PointsMaterial({ color, size: 0.06, transparent: true, opacity: 1 });
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
let botCurrentAction = null;

function reactBotHit(strength = 1) {
  botStagger.active = true;
  botStagger.t = 0;
  botStagger.strength = strength;
  // wobble relative to wherever the bot currently is (it may be mid-rush)
  botStagger.baseX = botModel.position.x;
  rimRed.intensity = 12;
}

function updateBotStagger(dt) {
  if (!botModel) return;
  if (rimRed.intensity > 6) rimRed.intensity = Math.max(6, rimRed.intensity - dt * 30);

  if (botStagger.active) {
    botStagger.t += dt;
    const d = botStagger.t;
    const s = botStagger.strength || 1;
    const wobble = Math.sin(d * 40) * Math.max(0, 0.08 * s - d * 0.3);
    botModel.rotation.z = wobble;
    botModel.position.x = botStagger.baseX + Math.sin(d * 50) * Math.max(0, 0.03 * s - d * 0.1);
    if (d > 0.25) {
      botStagger.active = false;
      botModel.rotation.z = 0;
      botModel.position.x = botStagger.baseX;
    }
  }
}

function knockOutBot() {
  if (!botModel || botKnockedOut) return;
  botKnockedOut = true;
  state.ko = true;
  if (activeRun && activeRun.who === 'bot') activeRun = null; // cancel a rush in progress
  if (botCurrentAction) botCurrentAction.paused = true;
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
      botModel.position.x = BOT_STAND_X;

      botMixer.stopAllAction();
      const idle = botActions.centerBlock;
      idle.reset();
      idle.paused = false;
      idle.play();
      botCurrentAction = idle;
      botAI.mode = 'idle';
      botAI.timer = 0;
      botAI.threshold = 2 + Math.random() * 1.5;

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

/* ---------------- bot AI: idle block, then randomly throw a move ---------------- */

const botAI = {
  mode: 'idle', timer: 0, threshold: 2.5, activeMove: null, lastMove: null,
  rushTimer: 0, rushThreshold: 6 + Math.random() * 3,
};

function startBotAI() {
  botAI.mode = 'idle';
  botAI.timer = 0;
  botAI.threshold = 2 + Math.random() * 1.5;
  botAI.rushTimer = 0;
  botAI.rushThreshold = 6 + Math.random() * 3;
}

function pickBotMove() {
  const pool = BOT_MOVE_POOL.filter((m) => m !== botAI.lastMove);
  return pool[Math.floor(Math.random() * pool.length)];
}

function updateBotAI(dt) {
  if (state.ko || !botMixer) return;
  if (activeRun && activeRun.who === 'bot') return; // the rush sequence drives the bot itself
  bindPendingClipsIfReady();

  // rush timer keeps ticking regardless of idle/move sub-state, so a run of
  // showboat moves can't keep pushing the rush attack further away
  botAI.rushTimer += dt;
  if (
    botAI.mode === 'idle' &&
    botAI.rushTimer >= botAI.rushThreshold &&
    botActions.runCycle &&
    botActions.fistFight
  ) {
    botAI.rushTimer = 0;
    botAI.rushThreshold = 6 + Math.random() * 3;
    botAI.mode = 'rush';
    startRunSequence({
      who: 'bot', model: botModel, mixer: botMixer, actions: botActions,
      fromX: BOT_STAND_X, toX: BOT_CLASH_X, attackName: 'fistFight', dealsDamage: false,
    });
    return;
  }

  if (botAI.mode === 'idle') {
    botAI.timer += dt;

    if (botAI.timer >= botAI.threshold) {
      const name = pickBotMove();
      const action = botActions[name];
      if (action) {
        botMixer.stopAllAction();
        action.reset();
        action.play();
        botCurrentAction = action;
        botAI.mode = 'move';
        botAI.timer = 0;
        botAI.activeMove = name;
        botAI.lastMove = name;
      } else {
        botAI.timer = 0; // clip not loaded yet, try again shortly
      }
    }
  } else if (botAI.mode === 'move') {
    const cfg = MOVES[botAI.activeMove];
    const duration = botCurrentAction.getClip().duration / botCurrentAction.timeScale;
    botAI.timer += dt;
    if (botAI.timer >= duration + 0.1) {
      botMixer.stopAllAction();
      const idle = botActions.centerBlock;
      idle.reset();
      idle.play();
      botCurrentAction = idle;
      botAI.mode = 'idle';
      botAI.timer = 0;
      botAI.threshold = 2 + Math.random() * 1.8;
    }
  }
}

/* ---------------- player attack flow ----------------
   Driven entirely by the render loop's own dt (not setTimeout) so a slow
   device or a throttled background tab can never let an attack's input
   lock outlive its animation — everything advances on the same clock. */

function landHit(cfg) {
  if (state.ko) return;
  const dmg = cfg.dmg[0] + Math.floor(Math.random() * (cfg.dmg[1] - cfg.dmg[0] + 1));
  state.enemyHp = Math.max(0, state.enemyHp - dmg);
  updateHpBar();
  addScore(dmg * 10);
  bumpCombo();
  reactBotHit(dmg / 8);
  triggerShake(cfg.shake[0], cfg.shake[1]);
  triggerDolly(cfg.dolly[0], cfg.dolly[1]);
  if (cfg.hitStop) triggerHitStop(cfg.hitStop);
  playThud(cfg.sound + Math.min(0.5, state.combo * 0.05));

  const botHead = new THREE.Vector3(1.0, 1.55, 0.1);
  spawnSpark(botHead, cfg.sparkColor, cfg.spark);

  if (state.enemyHp <= 0) {
    knockOutBot();
  }
}

// { name, t, impactAt, endAt, impactDone }
let activeAttack = null;

function doPlayerMove(name) {
  const action = playerActions[name];
  if (!action) return; // clip not loaded yet

  state.attacking = true;
  hintText.classList.add('fade');

  playerMixer.stopAllAction();
  action.reset();
  action.play();
  playerAnimating = true;

  const duration = action.getClip().duration / action.timeScale;
  activeAttack = {
    name,
    t: 0,
    impactAt: duration * MOVES[name].impactFrac,
    endAt: duration + 0.06,
    impactDone: false,
  };
}

function updateActiveAttack(dt) {
  if (!activeAttack) return;
  activeAttack.t += dt;

  if (!activeAttack.impactDone && activeAttack.t >= activeAttack.impactAt) {
    activeAttack.impactDone = true;
    landHit(MOVES[activeAttack.name]);
  }

  if (activeAttack.t >= activeAttack.endAt) {
    activeAttack = null;
    state.attacking = false;
    hintText.classList.remove('fade');
    if (!state.ko) resetPlayerPose();
  }
}

function unlockAudio() {
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

function performPunch() {
  if (!playerActions.dropKick || state.attacking || state.ko || activeRun) return;
  const name = PLAYER_PUNCH_SEQUENCE[punchIndex % PLAYER_PUNCH_SEQUENCE.length];
  punchIndex++;
  doPlayerMove(name);
}

function performKick() {
  if (!playerActions.dropKick || state.attacking || state.ko || activeRun) return;
  const name = PLAYER_KICK_SEQUENCE[kickIndex % PLAYER_KICK_SEQUENCE.length];
  kickIndex++;
  doPlayerMove(name);
}

function performRunAttack() {
  if (!playerActions.runCycle || !playerActions.fistFight || state.attacking || state.ko || activeRun) return;
  state.attacking = true;
  playerAnimating = true;
  hintText.classList.add('fade');
  startRunSequence({
    who: 'player', model: playerModel, mixer: playerMixer, actions: playerActions,
    fromX: PLAYER_STAND_X, toX: PLAYER_CLASH_X, attackName: 'fistFight', dealsDamage: true,
  });
}

btnPunch.addEventListener('pointerdown', () => { unlockAudio(); performPunch(); });
btnKick.addEventListener('pointerdown', () => { unlockAudio(); performKick(); });
btnRun.addEventListener('pointerdown', () => { unlockAudio(); performRunAttack(); });

/* ---------------- run-in charge attack: shared by player (РЫВОК) and bot ----------------
   approach (translate + looping run cycle) → attack clip → return (translate back) */

let activeRun = null;

function startRunSequence({ who, model, mixer, actions, fromX, toX, attackName, dealsDamage }) {
  mixer.stopAllAction();
  const run = actions.runCycle;
  run.reset();
  run.timeScale = 2.3;
  run.play();

  activeRun = {
    who, model, mixer, actions, fromX, toX, attackName, dealsDamage,
    phase: 'approach', t: 0,
    approachDur: 0.4,
    returnDur: 0.32,
    impactDone: false,
  };
}

function updateActiveRun(dt) {
  if (!activeRun) return;
  const r = activeRun;
  r.t += dt;

  if (r.phase === 'approach') {
    const p = Math.min(1, r.t / r.approachDur);
    const eased = p * p * (3 - 2 * p);
    r.model.position.x = r.fromX + (r.toX - r.fromX) * eased;

    if (p >= 1) {
      r.mixer.stopAllAction();
      const atk = r.actions[r.attackName];
      atk.reset();
      atk.play();
      r.phase = 'attack';
      r.t = 0;
      r.attackDur = atk.getClip().duration / atk.timeScale;
      r.impactAt = r.attackDur * MOVES[r.attackName].impactFrac;
    }
  } else if (r.phase === 'attack') {
    if (r.dealsDamage && !r.impactDone && r.t >= r.impactAt) {
      r.impactDone = true;
      landHit(MOVES[r.attackName]);
    }

    if (r.t >= r.attackDur + 0.05) {
      r.phase = 'return';
      r.t = 0;
      if (r.who === 'player') {
        resetPlayerPose(); // stops the mixer + freezes the ready pose
      } else {
        r.mixer.stopAllAction();
        const idle = r.actions.centerBlock;
        idle.reset();
        idle.play();
        botCurrentAction = idle;
      }
    }
  } else if (r.phase === 'return') {
    const p = Math.min(1, r.t / r.returnDur);
    const eased = p * p * (3 - 2 * p);
    r.model.position.x = r.toX + (r.fromX - r.toX) * eased;

    if (p >= 1) {
      r.model.position.x = r.fromX;
      if (r.who === 'player') {
        state.attacking = false;
        hintText.classList.remove('fade');
      } else {
        botAI.mode = 'idle';
        botAI.timer = 0;
        botAI.threshold = 2 + Math.random() * 1.8;
      }
      activeRun = null;
    }
  }
}

/* ---------------- render loop ---------------- */

function animate() {
  requestAnimationFrame(animate);
  const rawDt = Math.min(clock.getDelta(), 0.05);
  const dt = hitStopTimer > 0 ? 0 : rawDt;
  hitStopTimer = Math.max(0, hitStopTimer - rawDt);
  const t = clock.elapsedTime;

  if (playerMixer && playerAnimating) playerMixer.update(dt);
  if (botMixer && !state.ko) botMixer.update(dt);

  updateActiveAttack(dt);
  updateActiveRun(dt);
  updateBotAI(dt);

  if (idleBob && playerModel && !state.attacking) {
    playerModel.position.y = Math.sin(t * 1.6) * 0.01;
  }
  if (botModel && !state.ko && botAI.mode === 'idle') {
    botModel.position.y = Math.sin(t * 1.4 + 1) * 0.008;
  }

  updateBotStagger(dt);
  updateSparks(dt);

  particles.rotation.y += dt * 0.02;

  // --- camera: slow idle sway + attack dolly punch-in + shake + hit-stop ---
  const swayX = Math.sin(t * 0.17) * 0.16;
  const swayY = Math.sin(t * 0.23) * 0.035;

  let dollyOffset = 0;
  if (dollyTime > 0) {
    dollyTime -= dt;
    const p = 1 - Math.max(0, dollyTime) / dollyDuration;
    dollyOffset = -dollyStrength * Math.sin(Math.min(1, p) * Math.PI);
  }

  let shakeOffset = new THREE.Vector3();
  if (shakeTime > 0) {
    shakeTime -= dt;
    const s = shakeStrength * (shakeTime / 0.3);
    shakeOffset.set((Math.random() - 0.5) * s, (Math.random() - 0.5) * s, 0);
  }

  camera.position.set(
    cameraBasePos.x + swayX + shakeOffset.x,
    cameraBasePos.y + swayY + shakeOffset.y,
    cameraBasePos.z + dollyOffset + shakeOffset.z
  );
  camera.lookAt(cameraLookAt);

  renderer.render(scene, camera);
}
animate();
