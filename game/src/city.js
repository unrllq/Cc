// Процедурный кибер-Лондон: Square Mile, Темза, узнаваемые башни Сити.
// Всё сливается в несколько мешей (mergeGeometries), чтобы держать draw calls низкими.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const beacons = [];
export const WORLD = 2600;          // сторона мира
const HALF = WORLD / 2;
const CELL = 118;                   // шаг кварталов
const TILE = 18;                    // мировых метров на один тайл текстуры фасада

// --- Темза: русло как функция от x ------------------------------------------
export function riverZ(x) {
  return 560 + 170 * Math.sin(x * 0.0016) + 70 * Math.cos(x * 0.0041 + 1.2);
}
function inRiver(x, z, pad = 0) {
  return Math.abs(z - riverZ(x)) < 130 + pad;
}

// --- Текстуры фасадов --------------------------------------------------------
function facadeTextures() {
  const S = 256, cols = 6, rows = 6;
  const base = document.createElement('canvas'); base.width = base.height = S;
  const glow = document.createElement('canvas'); glow.width = glow.height = S;
  const b = base.getContext('2d'), g = glow.getContext('2d');

  b.fillStyle = '#0a0e17'; b.fillRect(0, 0, S, S);
  g.fillStyle = '#000000'; g.fillRect(0, 0, S, S);

  const cw = S / cols, ch = S / rows;
  const lit = ['#ffe2b0', '#ffd79a', '#e8f4ff', '#cfe9ff', '#8ff4ff'];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const px = x * cw + cw * 0.18, py = y * ch + ch * 0.2;
      const w = cw * 0.64, h = ch * 0.52;
      b.fillStyle = '#131b2c'; b.fillRect(px, py, w, h);
      b.fillStyle = 'rgba(255,255,255,.04)'; b.fillRect(px, py, w, 1);
      if (Math.random() < 0.34) {
        const c = lit[(Math.random() * lit.length) | 0];
        g.globalAlpha = 0.45 + Math.random() * 0.55;
        g.fillStyle = c; g.fillRect(px, py, w, h);
        g.globalAlpha = 1;
      }
    }
    // межэтажный карниз
    b.fillStyle = 'rgba(0,0,0,.45)';
    b.fillRect(0, y * ch + ch - 2, S, 2);
  }
  // верхняя полоска = крыша (сюда мапятся верхние грани коробок)
  b.fillStyle = '#0c111b'; b.fillRect(0, 0, S, 12);
  g.fillStyle = '#000'; g.fillRect(0, 0, S, 12);

  const map = new THREE.CanvasTexture(base);
  const emi = new THREE.CanvasTexture(glow);
  for (const t of [map, emi]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    t.colorSpace = THREE.SRGBColorSpace;
  }
  return { map, emi };
}

// Коробка с UV, растянутыми под реальный размер здания
function facadeBox(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  const su = [d / TILE, d / TILE, 0, 0, w / TILE, w / TILE];
  const sv = [h / TILE, h / TILE, 0, 0, h / TILE, h / TILE];
  for (let f = 0; f < 6; f++) {
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      if (f === 2 || f === 3) uv.setXY(i, 0.5, 0.985);           // крыша / низ
      else uv.setXY(i, uv.getX(i) * su[f], uv.getY(i) * sv[f]);
    }
  }
  return g;
}

function paint(geo, color) {
  const c = new THREE.Color(color);
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}

// Полосы перекрытий: без них стеклянные башни читаются как пустые плиты
let stripeTex = null;
function glassStripes() {
  if (stripeTex) return stripeTex;
  const c = document.createElement('canvas');
  c.width = 8; c.height = 32;
  const x = c.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, 8, 32);
  x.fillStyle = '#2f7e96'; x.fillRect(0, 0, 8, 3);
  x.fillStyle = '#12313d'; x.fillRect(0, 12, 8, 1);
  stripeTex = new THREE.CanvasTexture(c);
  stripeTex.wrapS = stripeTex.wrapT = THREE.RepeatWrapping;
  stripeTex.repeat.set(3, 26);
  stripeTex.colorSpace = THREE.SRGBColorSpace;
  return stripeTex;
}

// Стеклянная башня-ориентир: отражает небо, подсвечена изнутри
function glassMat(color, emissive) {
  return new THREE.MeshStandardMaterial({
    emissiveMap: glassStripes(),
    color, emissive, emissiveIntensity: 0.75,
    metalness: 0.95, roughness: 0.14, envMapIntensity: 1.4
  });
}

// --- Небо --------------------------------------------------------------------
function buildSky(scene) {
  const geo = new THREE.SphereGeometry(HALF * 2.4, 32, 24);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      varying vec3 vP; uniform float uTime;
      float hash(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7)))*43758.5453); }
      void main(){
        vec3 d = normalize(vP);
        float h = clamp(d.y*0.5+0.5, 0.0, 1.0);
        vec3 low  = vec3(0.30,0.05,0.24);
        vec3 mid  = vec3(0.07,0.09,0.26);
        vec3 high = vec3(0.01,0.02,0.07);
        vec3 col = mix(low, mid, smoothstep(0.42,0.58,h));
        col = mix(col, high, smoothstep(0.55,0.92,h));
        // зарево над Сити
        float glowDir = pow(max(0.0, dot(d, normalize(vec3(0.25,0.06,-1.0)))), 6.0);
        col += vec3(0.55,0.16,0.45) * glowDir * 0.5;
        // звёзды
        vec3 g = floor(d*260.0);
        float s = step(0.9972, hash(g)) * smoothstep(0.5,0.85,h);
        float tw = 0.6 + 0.4*sin(uTime*2.0 + hash(g)*60.0);
        col += vec3(0.8,0.92,1.0) * s * tw;
        gl_FragColor = vec4(col, 1.0);
      }`
  });
  const sky = new THREE.Mesh(geo, mat);
  sky.frustumCulled = false;
  scene.add(sky);
  return { mat, geo };
}

// Карта отражений из того же неба: стеклянные башни ловят закат, а не чёрноту
function skyEnvironment(scene, renderer, sky) {
  if (!renderer) return;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  const mat = sky.mat.clone();
  mat.uniforms = THREE.UniformsUtils.clone(sky.mat.uniforms);
  envScene.add(new THREE.Mesh(sky.geo, mat));
  const rt = pmrem.fromScene(envScene, 0, 1, 12000);
  scene.environment = rt.texture;
  if ('environmentIntensity' in scene) scene.environmentIntensity = 0.55;
  pmrem.dispose();
}

// --- Ориентиры Сити ----------------------------------------------------------
function landmarks(group, colliders, tag) {
  const add = (mesh, x, z, hw, hd, h, name) => {
    mesh.position.set(x, mesh.position.y, z);
    group.add(mesh);
    colliders.push({ x, z, hw, hd, h, name });
    tag.push({ x, z, hw, hd, h, name });
  };

  // 30 St Mary Axe — «Огурец»
  {
    const pts = [];
    for (let i = 0; i <= 22; i++) {
      const t = i / 22;
      const r = 26 * Math.sin(Math.PI * (0.12 + t * 0.82)) * (1 - t * 0.12) + 3;
      pts.push(new THREE.Vector2(r, t * 190));
    }
    const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), glassMat(0x12303a, 0x0d5f6e));
    add(m, -140, -70, 27, 27, 190, 'Gherkin');
    const cap = new THREE.Mesh(new THREE.SphereGeometry(7, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0x6ff6ff }));
    cap.position.set(-140, 190, -70); group.add(cap);
  }

  // 122 Leadenhall — «Тёрка»
  {
    const g = new THREE.BoxGeometry(64, 216, 62, 1, 1, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      if (p.getY(i) > 0) p.setX(i, p.getX(i) * 0.3 + 18);
    }
    g.computeVertexNormals(); g.translate(0, 108, 0);
    const m = new THREE.Mesh(g, glassMat(0x16252f, 0x0b4152));
    add(m, 40, -6, 33, 32, 216, 'Cheesegrater');
  }

  // 20 Fenchurch — «Уоки-токи»
  {
    const pts = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      pts.push(new THREE.Vector2(22 + Math.pow(t, 1.8) * 16, t * 150));
    }
    const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), glassMat(0x101d2a, 0x134a63));
    add(m, 176, 118, 38, 30, 150, 'Walkie-Talkie');
  }

  // 22 Bishopsgate — самая массивная плита
  {
    const g = facadeBox(74, 262, 70).translate(0, 131, 0);
    const m = new THREE.Mesh(g, glassMat(0x16202e, 0x1a4a66));
    add(m, -56, 62, 37, 35, 262, '22 Bishopsgate');
  }

  // Tower 42 — три смещённых сегмента
  {
    const g = mergeGeometries([
      facadeBox(30, 182, 30).translate(0, 91, 0),
      facadeBox(28, 150, 28).translate(20, 75, 12),
      facadeBox(26, 124, 26).translate(-18, 62, -14)
    ]);
    const m = new THREE.Mesh(g, glassMat(0x1a2130, 0x123d55));
    add(m, -250, 140, 38, 32, 182, 'Tower 42');
  }

  // Lloyd's building — «наизнанку», трубы снаружи
  {
    const parts = [facadeBox(70, 84, 60).translate(0, 42, 0)];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const t = new THREE.CylinderGeometry(3.6, 3.6, 104, 8)
        .translate(Math.cos(a) * 38, 52, Math.sin(a) * 33);
      parts.push(t);
    }
    const m = new THREE.Mesh(mergeGeometries(parts),
      new THREE.MeshStandardMaterial({ color: 0x2a3340, metalness: 0.85, roughness: 0.35,
        emissive: 0x0e3a4a, emissiveIntensity: 0.5 }));
    add(m, 122, -96, 40, 36, 104, "Lloyd's");
  }

  // The Shard — за рекой, главный силуэт на юге
  {
    const g = new THREE.CylinderGeometry(2, 40, 306, 8, 1, true).translate(0, 153, 0);
    const m = new THREE.Mesh(g, glassMat(0x0e1a26, 0x0a4d66));
    m.material.side = THREE.DoubleSide;
    add(m, 300, 780, 34, 34, 306, 'The Shard');
    const tip = new THREE.Mesh(new THREE.SphereGeometry(4, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xff3d8f }));
    tip.position.set(300, 310, 780); group.add(tip);
  }

  // St Paul's — купол на западе, вокруг него низкая застройка
  {
    const parts = [
      new THREE.CylinderGeometry(34, 34, 40, 20).translate(0, 20, 0),
      new THREE.CylinderGeometry(24, 24, 26, 20).translate(0, 52, 0),
      new THREE.SphereGeometry(24, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 64, 0),
      new THREE.CylinderGeometry(3, 6, 20, 10).translate(0, 96, 0),
      new THREE.BoxGeometry(14, 62, 14).translate(-42, 31, 26),
      new THREE.BoxGeometry(14, 62, 14).translate(-42, 31, -26)
    ];
    const m = new THREE.Mesh(mergeGeometries(parts),
      new THREE.MeshStandardMaterial({ color: 0xbfae94, roughness: 0.8, metalness: 0.05,
        emissive: 0x2a1c10, emissiveIntensity: 0.6 }));
    add(m, -560, 180, 46, 40, 106, "St Paul's");
  }

  // Tower Bridge — через Темзу на востоке
  {
    const x = 520, z = riverZ(x);
    const parts = [
      new THREE.BoxGeometry(22, 96, 26).translate(0, 48, -66),
      new THREE.BoxGeometry(22, 96, 26).translate(0, 48, 66),
      new THREE.BoxGeometry(16, 8, 210).translate(0, 74, 0),
      new THREE.BoxGeometry(26, 5, 300).translate(0, 16, 0),
      new THREE.ConeGeometry(14, 26, 4).translate(0, 106, -66),
      new THREE.ConeGeometry(14, 26, 4).translate(0, 106, 66)
    ];
    const m = new THREE.Mesh(mergeGeometries(parts),
      new THREE.MeshStandardMaterial({ color: 0x5b6b7d, roughness: 0.6, metalness: 0.4,
        emissive: 0x123047, emissiveIntensity: 0.8 }));
    m.position.y = 0;
    add(m, x, z, 20, 150, 120, 'Tower Bridge');
  }
}

// --- Главная сборка ----------------------------------------------------------
export async function buildCity(scene, renderer) {
  const root = new THREE.Group();
  scene.add(root);
  // вся процедурная застройка живёт отдельной веткой: её целиком
  // выключает подключённая модель города из assets/city.glb
  const proc = new THREE.Group();
  root.add(proc);

  const sky = buildSky(scene);
  const skyMat = sky.mat;
  skyEnvironment(scene, renderer, sky);
  scene.fog = new THREE.FogExp2(0x1a1030, 0.00095);

  const colliders = [];     // AABB для столкновений
  const footprints = [];    // то же для миникарты
  const tex = facadeTextures();

  // --- земля
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD * 1.6, WORLD * 1.6),
    new THREE.MeshStandardMaterial({ color: 0x080a16, roughness: 0.95, metalness: 0.1 })
  );
  ground.rotation.x = -Math.PI / 2;
  root.add(ground);

  // --- Темза
  {
    const seg = 60, w = 240;
    const g = new THREE.PlaneGeometry(WORLD * 1.4, w, seg, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      p.setY(i, p.getY(i) - riverZ(x));  // после поворота локальный Y станет мировым Z
    }
    g.computeVertexNormals();
    const river = new THREE.Mesh(g, new THREE.MeshStandardMaterial({
      color: 0x03111d, roughness: 0.08, metalness: 1.0,
      emissive: 0x08222f, emissiveIntensity: 0.6
    }));
    river.rotation.x = -Math.PI / 2;
    river.position.y = 0.6;
    root.add(river);
  }

  // --- зарезервированные участки под ориентиры
  const reserved = [
    [-140, -70, 70], [40, -6, 80], [176, 118, 80], [-56, 62, 90],
    [-250, 140, 80], [122, -96, 80], [300, 780, 90], [-560, 180, 150], [520, riverZ(520), 200]
  ];
  const isReserved = (x, z) => reserved.some(([rx, rz, r]) =>
    (x - rx) ** 2 + (z - rz) ** 2 < r * r);

  // --- рядовая застройка
  const blocks = [];
  const tints = [0x9aa7c2, 0x8290ae, 0xa5a0bd, 0x7e8ca8, 0xb3a6c6];
  for (let gx = -HALF; gx <= HALF; gx += CELL) {
    for (let gz = -HALF; gz <= HALF; gz += CELL) {
      const jx = gx + (Math.random() - 0.5) * 18;
      const jz = gz + (Math.random() - 0.5) * 18;
      if (inRiver(jx, jz, 20) || isReserved(jx, jz)) continue;

      const distC = Math.hypot(jx, jz);
      const cluster = Math.max(0, 1 - distC / 620);               // плотный центр Сити
      const south = jz > riverZ(jx) ? 0.55 : 1;                   // за рекой ниже
      const nearStPauls = Math.hypot(jx + 560, jz - 180) < 240 ? 0.35 : 1;

      if (Math.random() < 0.12) continue;                 // пустые участки / скверы
      const count = Math.random() < 0.4 ? 2 : 1;
      for (let n = 0; n < count; n++) {
        const w = 34 + Math.random() * (38 + cluster * 26);
        const d = 34 + Math.random() * (38 + cluster * 26);
        const spike = Math.random() < 0.06 ? 1.9 : 1;   // редкие башни-выбросы
        const h = (24 + Math.random() * 70 + Math.pow(cluster, 1.6) * 230) * south * nearStPauls * spike;
        const ox = (Math.random() - 0.5) * (CELL - w - 26);
        const oz = (Math.random() - 0.5) * (CELL - d - 26);
        const x = jx + ox, z = jz + oz;
        if (inRiver(x, z, 10) || isReserved(x, z)) continue;

        const geo = facadeBox(w, h, d).translate(x, h / 2, z);
        paint(geo, tints[(Math.random() * tints.length) | 0]);
        blocks.push(geo);
        colliders.push({ x, z, hw: w / 2, hd: d / 2, h });
        footprints.push({ x, z, hw: w / 2, hd: d / 2, h });

        // стилобат: башня не растёт «палкой» прямо из асфальта
        if (h > 150) {
          const pw = w * 1.45, pd = d * 1.45, ph = 18 + Math.random() * 14;
          const pg = facadeBox(pw, ph, pd).translate(x, ph / 2, z);
          paint(pg, 0x6c7690);
          blocks.push(pg);
          colliders.push({ x, z, hw: pw / 2, hd: pd / 2, h: ph });
        }

        // антенна-маяк на высоких крышах
        if (h > 150 && Math.random() < 0.5) {
          const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 22, 5),
            new THREE.MeshBasicMaterial({ color: 0x8899aa }));
          mast.position.set(x, h + 11, z);
          proc.add(mast);
          const bulb = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 6),
            new THREE.MeshBasicMaterial({ color: 0xff2d55 }));
          bulb.position.set(x, h + 23, z);
          bulb.userData.blink = Math.random() * 6;
          proc.add(bulb);
          beacons.push(bulb);
        }
      }
    }
  }

  const cityMesh = new THREE.Mesh(
    mergeGeometries(blocks),
    new THREE.MeshStandardMaterial({
      map: tex.map, emissiveMap: tex.emi, emissive: 0xffffff, emissiveIntensity: 0.95,
      vertexColors: true, roughness: 0.62, metalness: 0.45
    })
  );
  proc.add(cityMesh);

  landmarks(proc, colliders, footprints);

  // --- светящаяся сетка улиц
  {
    const lines = [];
    for (let g = -HALF; g <= HALF; g += CELL) {
      lines.push(new THREE.BoxGeometry(WORLD, 0.6, 9).translate(0, 0.4, g));
      lines.push(new THREE.BoxGeometry(9, 0.6, WORLD).translate(g, 0.4, 0));
    }
    const streets = new THREE.Mesh(mergeGeometries(lines),
      new THREE.MeshBasicMaterial({ color: 0x1b6e8c, transparent: true, opacity: 0.55 }));
    proc.add(streets);
  }

  // --- наземный трафик (светящиеся «капли» вдоль улиц)
  const CARS = 260;
  const cars = new THREE.InstancedMesh(
    new THREE.BoxGeometry(3.4, 1.2, 7),
    new THREE.MeshBasicMaterial({ color: 0xffd08a }), CARS);
  cars.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const carData = [];
  for (let i = 0; i < CARS; i++) {
    const axis = Math.random() < 0.5;
    const lane = (Math.round((Math.random() * WORLD - HALF) / CELL)) * CELL + (Math.random() < 0.5 ? -3 : 3);
    carData.push({
      axis, lane, t: Math.random() * WORLD - HALF,
      v: (18 + Math.random() * 26) * (Math.random() < 0.5 ? 1 : -1)
    });
  }
  proc.add(cars);

  // --- воздушный трафик: аэрокары с неоновыми хвостами
  const DRONES = 46;
  const drones = new THREE.InstancedMesh(
    new THREE.BoxGeometry(5, 1.6, 12),
    new THREE.MeshBasicMaterial({ color: 0x59f2ff }), DRONES);
  drones.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const droneTails = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1.2, 0.6, 26),
    new THREE.MeshBasicMaterial({ color: 0xff2d94, transparent: true, opacity: 0.4 }), DRONES);
  droneTails.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const droneData = [];
  for (let i = 0; i < DRONES; i++) {
    droneData.push({
      axis: Math.random() < 0.5, lane: (Math.random() - 0.5) * WORLD * 0.8,
      y: 70 + Math.random() * 170, t: (Math.random() - 0.5) * WORLD,
      v: (34 + Math.random() * 48) * (Math.random() < 0.5 ? 1 : -1)
    });
  }
  proc.add(drones, droneTails);

  // --- неоновые вывески на случайных фасадах
  const signTextures = ['神経', 'RIDE//404', 'ミルク', 'SYNTH', 'NEO CITY', '銀行', 'VOLT', '無限']
    .map(makeSign);
  for (let i = 0; i < 26; i++) {
    const b = footprints[(Math.random() * footprints.length) | 0];
    if (!b || b.h < 60) continue;
    const t = signTextures[(Math.random() * signTextures.length) | 0];
    const w = Math.min(b.hw, b.hd) * 1.7;
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.45),
      new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.DoubleSide }));
    const side = (Math.random() * 4) | 0;
    const y = 30 + Math.random() * (b.h - 40);
    if (side === 0) { sign.position.set(b.x, y, b.z + b.hd + 0.6); }
    else if (side === 1) { sign.position.set(b.x, y, b.z - b.hd - 0.6); sign.rotation.y = Math.PI; }
    else if (side === 2) { sign.position.set(b.x + b.hw + 0.6, y, b.z); sign.rotation.y = Math.PI / 2; }
    else { sign.position.set(b.x - b.hw - 0.6, y, b.z); sign.rotation.y = -Math.PI / 2; }
    proc.add(sign);
  }

  // --- обновление
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v3 = new THREE.Vector3(1, 1, 1);
  const pos = new THREE.Vector3(), euler = new THREE.Euler();

  function update(dt, time) {
    skyMat.uniforms.uTime.value = time;

    for (let i = 0; i < CARS; i++) {
      const c = carData[i];
      c.t += c.v * dt;
      if (c.t > HALF) c.t = -HALF; else if (c.t < -HALF) c.t = HALF;
      pos.set(c.axis ? c.t : c.lane, 1.4, c.axis ? c.lane : c.t);
      euler.set(0, c.axis ? Math.PI / 2 : 0, 0);
      q.setFromEuler(euler);
      cars.setMatrixAt(i, m4.compose(pos, q, v3));
    }
    cars.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < DRONES; i++) {
      const d = droneData[i];
      d.t += d.v * dt;
      if (d.t > HALF) d.t = -HALF; else if (d.t < -HALF) d.t = HALF;
      const x = d.axis ? d.t : d.lane, z = d.axis ? d.lane : d.t;
      const y = d.y + Math.sin(time * 0.6 + i) * 2.5;
      euler.set(0, d.axis ? Math.PI / 2 : 0, 0);
      q.setFromEuler(euler);
      pos.set(x, y, z);
      drones.setMatrixAt(i, m4.compose(pos, q, v3));
      const back = Math.sign(d.v) * -19;
      pos.set(d.axis ? x + back : x, y, d.axis ? z : z + back);
      droneTails.setMatrixAt(i, m4.compose(pos, q, v3));
    }
    drones.instanceMatrix.needsUpdate = true;
    droneTails.instanceMatrix.needsUpdate = true;

    for (const b of beacons) {
      b.visible = (Math.sin(time * 2.2 + b.userData.blink) > 0.1);
    }
  }

  // --- необязательная модель города из assets/city.glb
  const glb = await tryLoadGLB('assets/city.glb');
  let usingGLB = false;
  if (glb) {
    usingGLB = true;
    proc.visible = false;
    colliders.length = 0;
    footprints.length = 0;
    fitToWorld(glb, 1900);
    root.add(glb);
    // грубые AABB по мешам модели: гигантские «подложки» пропускаем
    const box = new THREE.Box3(), size = new THREE.Vector3(), center = new THREE.Vector3();
    glb.traverse(o => {
      if (!o.isMesh) return;
      box.setFromObject(o);
      box.getSize(size); box.getCenter(center);
      if (size.x > 420 || size.z > 420 || size.y < 6) return;
      const c = { x: center.x, z: center.z, hw: size.x / 2, hd: size.z / 2, h: box.max.y };
      colliders.push(c); footprints.push(c);
    });
  }

  return { root, proc, colliders, footprints, update, usingGLB };
}

async function tryLoadGLB(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    if (!res.ok) return null;
    const gltf = await new GLTFLoader().loadAsync(url);
    return gltf.scene;
  } catch (e) {
    return null;
  }
}

// Вписываем произвольную модель в масштаб мира: основание на нуле, центр в (0,0)
function fitToWorld(obj, span) {
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3(); box.getSize(size);
  const s = span / Math.max(size.x, size.z);
  obj.scale.setScalar(s);
  box.setFromObject(obj);
  const c = new THREE.Vector3(); box.getCenter(c);
  obj.position.x -= c.x;
  obj.position.z -= c.z;
  obj.position.y -= box.min.y;
}

function makeSign(text) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 230;
  const x = c.getContext('2d');
  x.clearRect(0, 0, 512, 230);
  const hue = ['#31e6ff', '#ff2d94', '#ffb63d', '#7cff9b'][(Math.random() * 4) | 0];
  x.strokeStyle = hue; x.lineWidth = 6; x.globalAlpha = 0.85;
  x.strokeRect(12, 12, 488, 206);
  x.font = 'bold 110px "Orbitron", system-ui, sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.shadowColor = hue; x.shadowBlur = 40;
  x.fillStyle = hue;
  x.fillText(text, 256, 118);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Проверка столкновения точки со зданиями (AABB + запас под радиус байка)
export function hitBuilding(colliders, p, r = 3.2) {
  if (p.y > 320) return null;
  for (let i = 0; i < colliders.length; i++) {
    const c = colliders[i];
    if (p.y > c.h + r) continue;
    if (Math.abs(p.x - c.x) < c.hw + r && Math.abs(p.z - c.z) < c.hd + r) return c;
  }
  return null;
}
