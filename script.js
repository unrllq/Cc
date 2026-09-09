/* =========================================
   MIA OBSESSED — Main Script
   ========================================= */

import * as THREE from 'three';
import { GLTFLoader } from './assets/vendor/three/examples/jsm/loaders/GLTFLoader.js';

/* ============ NAV / MOBILE MENU ============ */
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
burger?.addEventListener('click', () => {
  burger.classList.toggle('is-active');
  mobileMenu.classList.toggle('is-open');
});
mobileMenu?.querySelectorAll('a').forEach((a) =>
  a.addEventListener('click', () => {
    burger.classList.remove('is-active');
    mobileMenu.classList.remove('is-open');
  })
);

/* ============ WISHLIST / BAG COUNTERS ============ */
const bagCountEl = document.getElementById('bagCount');
const wishCountEl = document.getElementById('wishCount');
const wishBtn = document.getElementById('wishBtn');
let bagCount = 0;
let wishCount = 0;

wishBtn?.addEventListener('click', () => {
  wishCount++;
  wishCountEl.textContent = wishCount;
  wishBtn.style.transform = 'scale(1.15)';
  setTimeout(() => (wishBtn.style.transform = ''), 180);
});

/* ============ HERO QUOTE CAROUSEL ============ */
const quotes = [
  { text: 'She doesn’t ask for attention. She becomes it.', by: 'Mia — the muse' },
  { text: 'Worn like a secret, felt like obsession.', by: 'The Manifesto' },
  { text: 'One spray in, and the room remembers her.', by: 'Drop 03 — AW’26' },
];
let quoteIndex = 0;
const quoteText = document.getElementById('quoteText');
const quoteCount = document.getElementById('quoteCount');
const quoteByline = document.querySelector('.aside__byline');
function renderQuote() {
  const q = quotes[quoteIndex];
  quoteText.style.opacity = '0';
  setTimeout(() => {
    quoteText.textContent = q.text;
    quoteText.style.opacity = '1';
    if (quoteByline) quoteByline.textContent = q.by;
  }, 220);
  quoteCount.textContent = `${String(quoteIndex + 1).padStart(2, '0')} / ${String(quotes.length).padStart(2, '0')}`;
}
document.getElementById('quoteNext')?.addEventListener('click', () => {
  quoteIndex = (quoteIndex + 1) % quotes.length;
  renderQuote();
  restartQuoteTimer();
});
document.getElementById('quotePrev')?.addEventListener('click', () => {
  quoteIndex = (quoteIndex - 1 + quotes.length) % quotes.length;
  renderQuote();
  restartQuoteTimer();
});
let quoteTimer;
function restartQuoteTimer() {
  clearInterval(quoteTimer);
  quoteTimer = setInterval(() => {
    quoteIndex = (quoteIndex + 1) % quotes.length;
    renderQuote();
  }, 5200);
}
restartQuoteTimer();

/* ============ PRODUCT GLYPHS (inline SVG, no imagery needed) ============ */
const glyphs = {
  bottle: `<svg class="card-product__glyph" viewBox="0 0 100 130" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round">
      <rect x="32" y="8" width="36" height="16" rx="3"/>
      <path d="M40 24v14c0 3-4 5-6 9-3 5-4 11-4 17v46a6 6 0 0 0 6 6h28a6 6 0 0 0 6-6V64c0-6-1-12-4-17-2-4-6-6-6-9V24"/>
      <line x1="30" y1="80" x2="70" y2="80"/>
    </svg>`,
  jar: `<svg class="card-product__glyph" viewBox="0 0 100 130" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round">
      <rect x="26" y="10" width="48" height="14" rx="3"/>
      <path d="M30 24h40l6 14a70 70 0 0 1 4 24v46a8 8 0 0 1-8 8H28a8 8 0 0 1-8-8V62a70 70 0 0 1 4-24l6-14Z"/>
      <line x1="24" y1="70" x2="76" y2="70"/>
    </svg>`,
  roller: `<svg class="card-product__glyph" viewBox="0 0 100 130" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round">
      <circle cx="50" cy="20" r="10"/>
      <path d="M34 30h32l-4 20H38l-4-20Z"/>
      <rect x="30" y="50" width="40" height="62" rx="10"/>
    </svg>`,
  candle: `<svg class="card-product__glyph" viewBox="0 0 100 130" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round">
      <path d="M50 10c6 10 6 14 0 20-6-6-6-10 0-20Z"/>
      <rect x="24" y="34" width="52" height="80" rx="6"/>
      <line x1="24" y1="56" x2="76" y2="56"/>
    </svg>`,
};

/* ============ PRODUCT DATA ============ */
const products = [
  { name: 'Mia Eau de Parfum', sub: '50ml · Signature', price: '$128', tag: 'Bestseller', cat: 'fragrance', glyph: 'bottle', grad: 'linear-gradient(160deg,#3a1a0f,#ff7a33 130%)' },
  { name: 'Obsession Body Oil', sub: '100ml · Dry finish', price: '$58', tag: 'New', cat: 'body', glyph: 'jar', grad: 'linear-gradient(160deg,#1a1522,#a24bd6 130%)' },
  { name: 'Midnight Musk Roll-On', sub: '10ml · Travel size', price: '$42', tag: null, cat: 'fragrance', glyph: 'roller', grad: 'linear-gradient(160deg,#101820,#2e7d8f 130%)' },
  { name: 'Mia Eau de Parfum', sub: '100ml · Signature', price: '$185', tag: 'Bestseller', cat: 'fragrance', glyph: 'bottle', grad: 'linear-gradient(160deg,#241108,#ffb020 130%)' },
  { name: 'Silhouette Hair Mist', sub: '75ml · Weightless', price: '$46', tag: null, cat: 'body', glyph: 'roller', grad: 'linear-gradient(160deg,#1a0f1d,#ff5a8a 130%)' },
  { name: 'Signature Candle', sub: '220g · Hand-poured', price: '$64', tag: 'New', cat: 'accessories', glyph: 'candle', grad: 'linear-gradient(160deg,#141416,#ff5a1f 130%)' },
];

const productGrid = document.getElementById('productGrid');
function renderProducts() {
  productGrid.innerHTML = products
    .map(
      (p, i) => `
    <article class="card-product" data-cat="${p.cat}" style="transition-delay:${(i % 3) * 80}ms">
      <div class="card-product__media" style="background:${p.grad}">
        ${p.tag ? `<span class="card-product__tag">${p.tag}</span>` : ''}
        ${glyphs[p.glyph]}
      </div>
      <div class="card-product__body">
        <div>
          <div class="card-product__name">${p.name}</div>
          <div class="card-product__sub">${p.sub}</div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <span class="card-product__price">${p.price}</span>
          <button class="card-product__add" aria-label="Add ${p.name} to bag">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>
      </div>
    </article>`
    )
    .join('');

  productGrid.querySelectorAll('.card-product__add').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!btn.classList.contains('is-added')) {
        bagCount++;
        bagCountEl.textContent = bagCount;
      }
      btn.classList.add('is-added');
      setTimeout(() => btn.classList.remove('is-added'), 260);
    });
  });

  observeReveal();
}
renderProducts();

/* ============ FILTER PILLS ============ */
document.getElementById('filterPills')?.addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-pill');
  if (!btn) return;
  document.querySelectorAll('.filter-pill').forEach((p) => p.classList.remove('is-active'));
  btn.classList.add('is-active');
  const filter = btn.dataset.filter;
  productGrid.querySelectorAll('.card-product').forEach((card) => {
    const show = filter === 'all' || card.dataset.cat === filter;
    card.style.display = show ? '' : 'none';
  });
});

/* ============ NEWSLETTER ============ */
const newsletterForm = document.getElementById('newsletterForm');
const newsletterNote = document.getElementById('newsletterNote');
newsletterForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  newsletterNote.textContent = 'You’re in. Welcome to the obsession.';
  newsletterNote.classList.add('is-success');
  newsletterForm.reset();
});

/* ============ SCROLL REVEAL ============ */
function observeReveal() {
  const els = document.querySelectorAll('.reveal:not(.in-view), .card-product:not(.in-view)');
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  els.forEach((el) => io.observe(el));
}
observeReveal();

/* ============ EXPLORE BADGE ============ */
document.getElementById('stageBadge')?.addEventListener('click', () => {
  document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' });
});

/* =========================================================
   3D STAGE — Mia, draggable / auto-rotating GLB viewer
   ========================================================= */
(function initStage() {
  const wrap = document.getElementById('stageCanvasWrap');
  const stage = document.getElementById('stage');
  const loader = document.getElementById('stageLoader');
  const loaderFill = document.getElementById('loaderFill');
  const loaderWord = document.getElementById('loaderWord');
  const hint = document.getElementById('stageHint');
  if (!wrap) return;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 1.28, 4.4);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  wrap.appendChild(renderer.domElement);

  /* lighting rig */
  const hemi = new THREE.HemisphereLight(0xfff1e0, 0x1a0f08, 1.15);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xfff2df, 2.6);
  key.position.set(2.4, 3.6, 3.2);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x9fd6ff, 0.55);
  fill.position.set(-3, 1.2, 1.6);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xff9a4d, 1.6);
  rim.position.set(-1.2, 3.4, -3.4);
  scene.add(rim);

  /* fake contact shadow */
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 256;
  const sctx = shadowCanvas.getContext('2d');
  const grad = sctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, 'rgba(0,0,0,0.55)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, 256, 256);
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
  const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  scene.add(shadowMesh);

  /* pivot group the model rotates around */
  const pivot = new THREE.Group();
  scene.add(pivot);

  let modelReady = false;
  const gltfLoader = new GLTFLoader();
  gltfLoader.load(
    './assets/models/mia-obsessed.glb',
    (gltf) => {
      const model = gltf.scene;

      // Skinned meshes store their raw geometry in bind-pose local space,
      // which does not reflect the actual posed silhouette — computeBoundingBox()
      // resolves each vertex through the skeleton and already lands in the
      // model's own local space (its bindMatrix cancels the mesh's own
      // matrixWorld), so it must NOT be re-transformed by matrixWorld here.
      model.updateWorldMatrix(true, true);
      const box = new THREE.Box3();
      let boxStarted = false;
      model.traverse((n) => {
        if (n.isSkinnedMesh) {
          n.computeBoundingBox();
          boxStarted ? box.union(n.boundingBox) : (box.copy(n.boundingBox), (boxStarted = true));
        } else if (n.isMesh) {
          if (!n.geometry.boundingBox) n.geometry.computeBoundingBox();
          const b = n.geometry.boundingBox.clone().applyMatrix4(n.matrixWorld);
          boxStarted ? box.union(b) : (box.copy(b), (boxStarted = true));
        }
        if (n.isMesh) {
          n.castShadow = false;
          n.receiveShadow = false;
          if (n.material) n.material.envMapIntensity = 1.0;
        }
      });
      const size = new THREE.Vector3();
      box.getSize(size);

      const targetHeight = 2.05;
      const scale = targetHeight / (size.y || 1);
      model.scale.setScalar(scale);

      const center2 = new THREE.Vector3();
      box.getCenter(center2);
      model.position.x -= center2.x * scale;
      model.position.z -= center2.z * scale;
      model.position.y -= box.min.y * scale;

      pivot.add(model);
      shadowMesh.position.y = 0.001;

      camera.position.set(0, targetHeight * 0.62, 4.35);
      camera.lookAt(0, targetHeight * 0.52, 0);

      modelReady = true;
      loader.classList.add('is-hidden');
    },
    (evt) => {
      if (evt.total) {
        const pct = Math.min(100, Math.round((evt.loaded / evt.total) * 100));
        loaderFill.style.width = pct + '%';
        loaderWord.textContent = `Loading Mia — ${pct}%`;
      }
    },
    (err) => {
      loaderWord.textContent = 'Could not load the model';
      console.error('GLTF load error', err);
    }
  );

  /* ============ resize ============ */
  function resize() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  resize();

  /* ============ drag-to-rotate + auto-rotate ============ */
  let isDragging = false;
  let lastX = 0;
  let lastY = 0;
  let velocityY = 0;
  let targetTiltX = 0;
  let idleTimeout = null;
  const autoRotateSpeed = 0.22; // rad/s
  let autoRotateActive = true;
  const ROTATE_SPEED = 0.010;
  const TILT_SPEED = 0.006;
  const TILT_LIMIT = 0.22;

  function hideHint() {
    hint.style.opacity = '0';
  }

  function onPointerDown(e) {
    isDragging = true;
    autoRotateActive = false;
    clearTimeout(idleTimeout);
    lastX = e.clientX;
    lastY = e.clientY;
    velocityY = 0;
    wrap.setPointerCapture?.(e.pointerId);
    hideHint();
  }
  function onPointerMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    pivot.rotation.y += dx * ROTATE_SPEED;
    targetTiltX = THREE.MathUtils.clamp(targetTiltX + dy * TILT_SPEED, -TILT_LIMIT, TILT_LIMIT);
    velocityY = dx * ROTATE_SPEED;
  }
  function onPointerUp() {
    if (!isDragging) return;
    isDragging = false;
    idleTimeout = setTimeout(() => {
      autoRotateActive = true;
    }, 1500);
  }

  wrap.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);

  // auto-hide the drag hint after a while regardless of interaction
  setTimeout(hideHint, 6000);

  /* ============ render loop ============ */
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);

    if (modelReady) {
      if (isDragging) {
        // handled in pointermove
      } else if (autoRotateActive) {
        pivot.rotation.y += autoRotateSpeed * dt;
        velocityY *= 0.9;
      } else if (Math.abs(velocityY) > 0.0002) {
        pivot.rotation.y += velocityY;
        velocityY *= 0.94;
      }
      pivot.rotation.x += (targetTiltX * 0.4 - pivot.rotation.x) * Math.min(1, dt * 4);
    }

    renderer.render(scene, camera);
  }
  animate();
})();
