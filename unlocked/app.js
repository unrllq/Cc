/* =========================================================
   UNLOCKED — interaction layer (no dependencies)
   ========================================================= */
(() => {
'use strict';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const body = document.body;
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- motion state ---------- */
let motion = !prefersReduced.matches;
try { if (localStorage.getItem('ul-motion') === 'off') motion = false; } catch (e) {}

const motionBtn   = $('#motionToggle');
const motionState = $('#motionState');

function applyMotion() {
  body.dataset.motion = motion ? 'on' : 'off';
  if (motionBtn)   motionBtn.setAttribute('aria-pressed', String(motion));
  if (motionState) motionState.textContent = motion ? 'ON' : 'OFF';
}
applyMotion();

motionBtn?.addEventListener('click', () => {
  motion = !motion;
  try { localStorage.setItem('ul-motion', motion ? 'on' : 'off'); } catch (e) {}
  applyMotion();
});
prefersReduced.addEventListener?.('change', e => { if (e.matches) { motion = false; applyMotion(); } });

/* =========================================================
   BOOT SEQUENCE
   ========================================================= */
const bootEl  = $('#boot');
const bootBar = $('#bootBar');
const bootPct = $('#bootPct');
const bootLog = $('#bootLog');

const BOOT_LINES = [
  'init profile.module',
  'reading assessment vectors',
  'mapping city infrastructure',
  'matching people · 1 284 nodes',
  'calibrating difficulty',
  'challenge engine <b>ready</b>'
];

async function runBoot() {
  if (!bootEl) return;
  if (!motion) { finishBoot(); return; }

  let i = 0;
  const step = async () => {
    if (i < BOOT_LINES.length) {
      const l = document.createElement('div');
      l.innerHTML = '> ' + BOOT_LINES[i];
      bootLog.appendChild(l);
      if (bootLog.children.length > 5) bootLog.firstChild.remove();
      i++;
    }
  };

  let p = 0;
  const total = 1500;
  const t0 = performance.now();

  await new Promise(resolve => {
    const tick = now => {
      const el = now - t0;
      p = clamp(el / total);
      const eased = 1 - Math.pow(1 - p, 2.2);
      bootBar.style.width = (eased * 100) + '%';
      bootPct.textContent = String(Math.round(eased * 100)).padStart(3, '0');
      const want = Math.floor(eased * BOOT_LINES.length);
      while (i < want) step();
      if (p < 1) requestAnimationFrame(tick); else resolve();
    };
    requestAnimationFrame(tick);
  });

  while (i < BOOT_LINES.length) step();
  await sleep(320);
  finishBoot();
}

function finishBoot() {
  body.classList.add('booted');
  setTimeout(() => bootEl?.setAttribute('hidden', ''), 900);
  startHero();
}

/* =========================================================
   TEXT: split + scramble
   ========================================================= */
function splitText(el) {
  if (el.dataset.splitDone) return;
  const text = el.textContent;
  el.textContent = '';
  [...text].forEach((c, i) => {
    const s = document.createElement('span');
    s.className = 'ch';
    s.textContent = c === ' ' ? ' ' : c;
    s.style.animationDelay = (i * 26) + 'ms';
    el.appendChild(s);
  });
  el.dataset.splitDone = '1';
}
$$('[data-split]').forEach(splitText);

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\<>#*+-';
function scramble(el, dur = 620) {
  if (!motion) return;
  const final = el.dataset.text || el.textContent;
  el.dataset.text = final;
  const start = performance.now();
  const tick = now => {
    const p = clamp((now - start) / dur);
    let out = '';
    for (let i = 0; i < final.length; i++) {
      const reveal = p * final.length;
      if (i < reveal - 1) out += final[i];
      else if (final[i] === ' ') out += ' ';
      else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = out;
    if (p < 1) requestAnimationFrame(tick); else el.textContent = final;
  };
  requestAnimationFrame(tick);
}
$$('[data-scramble]').forEach(el => {
  el.addEventListener('mouseenter', () => scramble(el, 420));
});

function startHero() {
  $$('.hero [data-split]').forEach(el => el.classList.add('in'));
  setTimeout(() => $$('.hero .reveal').forEach(el => el.classList.add('in')), 260);
}

/* =========================================================
   REVEAL OBSERVER
   ========================================================= */
const revealIO = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    if (e.target.matches('[data-scramble]')) scramble(e.target, 700);
    revealIO.unobserve(e.target);
  });
}, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

$$('.reveal:not(.hero .reveal), [data-split]:not(.hero [data-split]), .sec__title').forEach(el => revealIO.observe(el));

/* =========================================================
   CLOCK
   ========================================================= */
const clockEl = $('#clock');
const footClock = $('#footClock');
function tickClock() {
  const d = new Date();
  const t = [d.getHours(), d.getMinutes(), d.getSeconds()].map(n => String(n).padStart(2, '0')).join(':');
  if (clockEl) clockEl.textContent = t;
  if (footClock) footClock.textContent = t + ' LOCAL';
}
tickClock();
setInterval(tickClock, 1000);

/* =========================================================
   CURSOR + MAGNETIC + GLOW
   ========================================================= */
const cursor = $('#cursor');
const glow   = $('#fxGlow');
let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my, gx = mx, gy = my;

if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
  body.classList.add('has-pointer');
  addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });

  $$('a, button, .fcard, .tcard, .lvl, .arch li, input').forEach(el => {
    el.addEventListener('mouseenter', () => body.classList.add('cursor-hot'));
    el.addEventListener('mouseleave', () => body.classList.remove('cursor-hot'));
  });

  $$('.magnetic').forEach(el => {
    el.addEventListener('mousemove', e => {
      if (!motion) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * 0.18}px, ${dy * 0.24}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });

  $$('.tilt').forEach(el => {
    el.addEventListener('mousemove', e => {
      if (!motion) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${-py * 6}deg) rotateY(${px * 7}deg) translateZ(0)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
}

/* =========================================================
   NAV / MENU
   ========================================================= */
const nav = $('#nav');
const burger = $('#burger');
const menu = $('#menu');
let menuOpen = false;

function toggleMenu(force) {
  menuOpen = force !== undefined ? force : !menuOpen;
  body.classList.toggle('menu-open', menuOpen);
  body.classList.toggle('is-locked', menuOpen);
  burger?.setAttribute('aria-expanded', String(menuOpen));
  burger?.setAttribute('aria-label', menuOpen ? 'Close menu' : 'Open menu');
  if (menuOpen) { menu.hidden = false; }
  else { setTimeout(() => { if (!menuOpen) menu.hidden = true; }, 600); }
}
burger?.addEventListener('click', () => toggleMenu());
$$('.menu a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));
addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen) { toggleMenu(false); burger?.focus(); } });

/* =========================================================
   SECTION INDEX
   ========================================================= */
const sections = $$('[data-index]');
const indexList = $('#sectionIndex ol');
if (indexList) {
  sections.forEach(sec => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="#${sec.id}"><span>${sec.dataset.index}</span><i></i></a>`;
    indexList.appendChild(li);
  });
}
const indexItems = $$('#sectionIndex li');

/* =========================================================
   MARQUEES
   ========================================================= */
const marquees = $$('[data-marquee]').map(el => {
  const track = el.querySelector('.ticker__track');
  const original = track.innerHTML;
  track.innerHTML = original + original + original;
  return { el, track, x: 0, speed: parseFloat(el.dataset.speed) || 1, w: 0 };
});
function measureMarquees() {
  marquees.forEach(m => { m.w = m.track.scrollWidth / 3; });
}
measureMarquees();
addEventListener('resize', measureMarquees);

/* =========================================================
   PARALLAX + SCROLL DRIVEN
   ========================================================= */
const parallaxEls = $$('[data-parallax]').map(el => ({ el, k: parseFloat(el.dataset.parallax) || 0.1 }));
const progressBar = $('#progressBar');
const steps = $$('.step');
const stepsRail = $('#stepsRail');
const stepRing = $('#stepRing');
const stepPct = $('#stepPct');
const stepNow = $('#stepNow');
const stepLines = $('#stepLines');
const rail = $('#rail');
const railTrack = $('#railTrack');
const railBar = $('#railBar');
const railPct = $('#railPct');
const flow = $('#flow');
const flowItems = $$('#flow li');

const STEP_STATE = [
  { label: 'BUILDING PROFILE', lines: ['age / location loaded', 'interests mapped', 'available time: 6h / week'] },
  { label: 'RUNNING ASSESSMENT', lines: ['endurance test ok', 'strength test ok', 'coordination 71/100'] },
  { label: 'GOALS LOCKED', lines: ['sport: hyrox + 10k', 'personal: discipline', 'career: networking'] },
  { label: 'GENERATING CHALLENGE', lines: ['slot found: fri 19:00', 'partner matched 94%', 'difficulty set: lvl 06'] }
];
let lastStep = -1;
function setStep(i) {
  if (i === lastStep) return;
  lastStep = i;
  steps.forEach((s, n) => s.classList.toggle('on', n === i));
  const pct = Math.round(((i + 1) / steps.length) * 100);
  if (stepPct) stepPct.textContent = pct + '%';
  if (stepRing) stepRing.style.strokeDashoffset = String(327 - (327 * pct) / 100);
  const st = STEP_STATE[i];
  if (st && stepNow) stepNow.textContent = st.label;
  if (st && stepLines) {
    stepLines.innerHTML = '';
    st.lines.forEach((l, n) => {
      const s = document.createElement('span');
      s.textContent = '· ' + l;
      s.style.animationDelay = (n * 110) + 'ms';
      stepLines.appendChild(s);
    });
  }
}

let lastY = scrollY, navHidden = false, scrollVel = 0;

function onFrame(now) {
  const y = scrollY;
  scrollVel = lerp(scrollVel, y - lastY, 0.25);

  /* progress */
  const max = document.documentElement.scrollHeight - innerHeight;
  if (progressBar) progressBar.style.width = clamp(y / (max || 1)) * 100 + '%';

  /* nav */
  nav?.classList.toggle('is-stuck', y > 40);
  if (!menuOpen) {
    const shouldHide = y > 320 && y > lastY + 2;
    if (shouldHide !== navHidden) { navHidden = shouldHide; nav?.classList.toggle('is-hidden', navHidden); }
  }
  lastY = y;

  /* cursor */
  if (cursor) {
    cx = lerp(cx, mx, 0.35); cy = lerp(cy, my, 0.35);
    cursor.style.transform = `translate(${cx}px, ${cy}px)`;
  }
  if (glow) {
    gx = lerp(gx, mx, 0.06); gy = lerp(gy, my, 0.06);
    glow.style.transform = `translate(${gx}px, ${gy}px)`;
  }

  /* marquees */
  if (motion) {
    const boost = 1 + Math.min(Math.abs(scrollVel) * 0.06, 5);
    marquees.forEach(m => {
      m.x -= m.speed * boost;
      if (m.w) {
        if (m.x <= -m.w) m.x += m.w;
        if (m.x > 0) m.x -= m.w;
      }
      m.track.style.transform = `translate3d(${m.x}px,0,0)`;
    });
  }

  /* parallax */
  if (motion) {
    parallaxEls.forEach(p => {
      const r = p.el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) return;
      const off = (r.top + r.height / 2 - innerHeight / 2) * -p.k;
      p.el.style.transform = `translate3d(0, ${off.toFixed(1)}px, 0)`;
    });
  }

  /* steps */
  if (steps.length) {
    const first = steps[0].getBoundingClientRect();
    const last = steps[steps.length - 1].getBoundingClientRect();
    const total = last.bottom - first.top;
    const p = clamp((innerHeight * 0.55 - first.top) / (total || 1));
    if (stepsRail) stepsRail.style.height = p * 100 + '%';
    setStep(Math.min(steps.length - 1, Math.floor(p * steps.length)));
  }

  /* levels rail */
  if (rail && railTrack && innerWidth > 760) {
    const r = rail.getBoundingClientRect();
    const p = clamp(-r.top / (rail.offsetHeight - innerHeight || 1));
    const dist = Math.max(0, railTrack.scrollWidth - innerWidth + 40);
    railTrack.style.transform = `translate3d(${-p * dist}px,0,0)`;
    if (railBar) railBar.style.width = p * 100 + '%';
    if (railPct) railPct.textContent = String(Math.round(p * 100)).padStart(2, '0') + '%';
  }

  /* formula flow */
  if (flow) {
    const r = flow.getBoundingClientRect();
    const p = clamp((innerHeight * 0.72 - r.top) / (r.height || 1));
    flow.style.setProperty('--flow', p * 100 + '%');
    flowItems.forEach((li, i) => li.classList.toggle('on', p > (i + 0.4) / flowItems.length));
  }

  /* section index */
  let activeIdx = 0;
  sections.forEach((s, i) => { if (s.getBoundingClientRect().top <= innerHeight * 0.42) activeIdx = i; });
  indexItems.forEach((li, i) => li.classList.toggle('on', i === activeIdx));

  requestAnimationFrame(onFrame);
}
requestAnimationFrame(onFrame);

/* =========================================================
   COUNTERS
   ========================================================= */
const countIO = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const target = parseInt(el.dataset.count, 10);
    countIO.unobserve(el);
    if (!motion) { el.textContent = target; return; }
    const dur = 1400, t0 = performance.now(), pad = el.textContent.trim().length;
    const tick = now => {
      const p = clamp((now - t0) / dur);
      const v = Math.round(target * (1 - Math.pow(1 - p, 3)));
      el.textContent = String(v).padStart(pad > 1 ? pad : 1, '0');
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}, { threshold: 0.6 });
$$('[data-count]').forEach(el => countIO.observe(el));

/* =========================================================
   RADAR
   ========================================================= */
const radarShape = $('#radarShape');
const radarPts = $('#radarPts');
const RADAR = [
  { k: 'STR', v: 74 }, { k: 'END', v: 82 }, { k: 'SPD', v: 69 },
  { k: 'REC', v: 81 }, { k: 'CNS', v: 88 }, { k: 'SOC', v: 72 }
];
function radarPoints(scale) {
  return RADAR.map((d, i) => {
    const a = (-90 + i * 60) * Math.PI / 180;
    const r = 130 * (d.v / 100) * scale;
    return [150 + Math.cos(a) * r, 150 + Math.sin(a) * r];
  });
}
if (radarShape) {
  const drawRadar = (scale) => {
    const pts = radarPoints(scale);
    radarShape.setAttribute('points', pts.map(p => p.map(n => n.toFixed(1)).join(',')).join(' '));
    if (radarPts) {
      radarPts.innerHTML = pts.map(p =>
        `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3"/>`).join('');
    }
  };
  const rIO = new IntersectionObserver(es => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      rIO.unobserve(e.target);
      if (!motion) { drawRadar(1); return; }
      const t0 = performance.now(), dur = 1200;
      const tick = now => {
        const p = clamp((now - t0) / dur);
        drawRadar(1 - Math.pow(1 - p, 3));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.4 });
  rIO.observe(radarShape.closest('.score__radar') || radarShape);
}

/* =========================================================
   NEXT CHALLENGE ROTATOR
   ========================================================= */
const NEXT = [
  { type:'BOXING CHALLENGE', when:'FRIDAY / 19:00', what:'Sparring · 6 rounds', where:'Hamburg · Nord Box Club', who:'Jürgen · matched 94%', lvl:'06 — ENDURE' },
  { type:'RUN CHALLENGE',    when:'SATURDAY / 07:30', what:'6.8 km · target 35 min', where:'Alster loop · Start → Finish', who:'Solo · pace group optional', lvl:'04 — PUSH' },
  { type:'HYROX CHALLENGE',  when:'SUNDAY / 09:00', what:'8 stations · team session', where:'Hyrox Box · Hamburg Süd', who:'4 participants matched', lvl:'07 — PERFORM' },
  { type:'CAREER CHALLENGE', when:'TUESDAY / 18:30', what:'Networking · 3 contacts', where:'Tech Meetup · Kreuzberg', who:'Complementary skills', lvl:'05 — COMPETE' }
];
const nc = { type:$('#ncType'), when:$('#ncWhen'), what:$('#ncWhat'), where:$('#ncWhere'), who:$('#ncWho'), lvl:$('#ncLevel'), bar:$('#ncBar'), idx:$('#ncIndex') };
let ncI = 0, ncTimer = null, ncStart = 0;
const NC_PERIOD = 6200;

function renderNC(i) {
  const d = NEXT[i];
  if (!d || !nc.type) return;
  nc.type.textContent = d.type;
  nc.when.textContent = d.when;
  nc.what.textContent = d.what;
  nc.where.textContent = d.where;
  nc.who.textContent = d.who;
  nc.lvl.textContent = d.lvl;
  nc.idx.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(NEXT.length).padStart(2, '0');
  if (motion) scramble(nc.when, 380);
}
function nextNC(step = 1) {
  ncI = (ncI + step + NEXT.length) % NEXT.length;
  renderNC(ncI);
  ncStart = performance.now();
}
function ncLoop(now) {
  if (nc.bar) {
    const p = motion ? clamp((now - ncStart) / NC_PERIOD) : 0;
    nc.bar.style.width = p * 100 + '%';
    if (p >= 1) nextNC(1);
  }
  ncTimer = requestAnimationFrame(ncLoop);
}
if (nc.type) { renderNC(0); ncStart = performance.now(); requestAnimationFrame(ncLoop); }
$('#ncNext')?.addEventListener('click', () => nextNC(1));

/* =========================================================
   TERMINAL TYPEWRITER
   ========================================================= */
function makeTyper(el) {
  let run = 0;
  async function type(blocks, { speed = 9, hold = 4200, loop = true } = {}) {
    const id = ++run;
    while (id === run) {
      el.textContent = '';
      const caret = document.createElement('span');
      caret.className = 'caret';
      for (const b of blocks) {
        if (id !== run) return;
        const span = document.createElement('span');
        if (b.c) span.className = b.c;
        el.appendChild(span);
        el.appendChild(caret);
        if (!motion) { span.textContent = b.t; caret.remove(); continue; }
        for (const ch of b.t) {
          if (id !== run) return;
          span.textContent += ch;
          if (ch !== '\n') await sleep(speed);
        }
        if (b.pause) await sleep(b.pause);
      }
      caret.remove();
      el.appendChild(caret);
      if (!loop || !motion) return;
      await sleep(hold);
    }
  }
  return { type, stop: () => { run++; } };
}

const ENGINE_RUNS = [
  [
    { t: '$ engine.generate --goal "hyrox 8 stations"\n', c: 'a' },
    { t: 'reading profile ......... ', c: 'k' }, { t: 'ok\n', c: 'a', pause: 90 },
    { t: 'assessment vector ....... ', c: 'k' }, { t: 'lvl 06\n', c: 'v', pause: 90 },
    { t: 'load last 14 days ....... ', c: 'k' }, { t: 'high\n', c: 'h', pause: 140 },
    { t: 'scanning city nodes ..... ', c: 'k' }, { t: '38 found\n', c: 'v', pause: 90 },
    { t: 'matching people ......... ', c: 'k' }, { t: '4 / 4\n\n', c: 'a', pause: 200 },
    { t: 'CHALLENGE 0148\n', c: 'a' },
    { t: 'WHAT       ', c: 'k' }, { t: 'HYROX · 8 stations\n', c: 'v' },
    { t: 'WHEN       ', c: 'k' }, { t: 'Sunday 09:00\n', c: 'v' },
    { t: 'WHERE      ', c: 'k' }, { t: 'Hyrox Box · Hamburg Süd\n', c: 'v' },
    { t: 'WITH WHOM  ', c: 'k' }, { t: 'Team of 4 · matched 76%\n', c: 'v' },
    { t: 'DIFFICULTY ', c: 'k' }, { t: '07 / 08\n', c: 'v' },
    { t: 'WHY        ', c: 'k' }, { t: 'endurance + consistency\n', c: 'v' },
    { t: 'RESULT     ', c: 'k' }, { t: 'pending\n\n', c: 'k' },
    { t: '> scheduled. next action locked.', c: 'a' }
  ],
  [
    { t: '$ engine.generate --goal "10k under 45:00"\n', c: 'a' },
    { t: 'recovery score .......... ', c: 'k' }, { t: '81\n', c: 'v', pause: 90 },
    { t: 'sleep 7d avg ............ ', c: 'k' }, { t: '6h 42m\n', c: 'v', pause: 90 },
    { t: 'adjusting volume ........ ', c: 'k' }, { t: '-12%\n', c: 'h', pause: 160 },
    { t: 'route selection ......... ', c: 'k' }, { t: 'flat · 6.8 km\n\n', c: 'v', pause: 200 },
    { t: 'CHALLENGE 0149\n', c: 'a' },
    { t: 'WHAT       ', c: 'k' }, { t: 'Tempo run · 6.8 km\n', c: 'v' },
    { t: 'WHEN       ', c: 'k' }, { t: 'Saturday 07:30\n', c: 'v' },
    { t: 'WHERE      ', c: 'k' }, { t: 'Alster loop · Start → Finish\n', c: 'v' },
    { t: 'WITH WHOM  ', c: 'k' }, { t: 'Pace partner · 88%\n', c: 'v' },
    { t: 'DIFFICULTY ', c: 'k' }, { t: '04 / 08\n', c: 'v' },
    { t: 'WHY        ', c: 'k' }, { t: 'speed at controlled load\n', c: 'v' },
    { t: 'RESULT     ', c: 'k' }, { t: 'pending\n\n', c: 'k' },
    { t: '> what · where · when · with whom = decided.', c: 'a' }
  ]
];

const termBody = $('#termBody');
if (termBody) {
  const typer = makeTyper(termBody);
  let variant = 0, started = false;
  const runNext = async () => {
    while (true) {
      await typer.type(ENGINE_RUNS[variant % ENGINE_RUNS.length], { speed: 8, loop: false });
      if (!motion) return;
      await sleep(4600);
      variant++;
    }
  };
  new IntersectionObserver((es, o) => {
    es.forEach(e => {
      if (e.isIntersecting && !started) { started = true; o.disconnect(); runNext(); }
    });
  }, { threshold: 0.25 }).observe(termBody);
}

/* =========================================================
   AI ADVISOR
   ========================================================= */
const ADVISOR = [
  { t: '> analysing profile · 14 days\n\n', c: 'k' },
  { t: 'WEAK AREA\n', c: 'k' }, { t: 'Recovery\n\n', c: 'h', pause: 260 },
  { t: 'REASON\n', c: 'k' },
  { t: 'High training load over the last 14 days.\nSleep below your own baseline.\n\n', c: 'v', pause: 260 },
  { t: 'RECOMMENDATION\n', c: 'k' },
  { t: 'Reduce intensity. Insert one recovery\nchallenge before Sunday.\n\n', c: 'a', pause: 400 },
  { t: 'CAREER\n', c: 'k' }, { t: 'Professional growth slowed down.\n\n', c: 'v', pause: 260 },
  { t: 'RECOMMENDATION\n', c: 'k' },
  { t: 'Attend 2 networking events.\nComplete 1 project challenge.\n\n', c: 'a', pause: 300 },
  { t: '> next challenge adapted.', c: 'a' }
];
const advisorBody = $('#advisorBody');
if (advisorBody) {
  const typer = makeTyper(advisorBody);
  let started = false;
  new IntersectionObserver((es, o) => {
    es.forEach(e => {
      if (e.isIntersecting && !started) {
        started = true; o.disconnect();
        typer.type(ADVISOR, { speed: 11, hold: 7000, loop: true });
      }
    });
  }, { threshold: 0.3 }).observe(advisorBody);
}

/* =========================================================
   WAITLIST FORM
   ========================================================= */
const form = $('#waitForm');
const emailInput = $('#email');
const emailErr = $('#emailErr');
const formOk = $('#formOk');
const submitBtn = $('#submitBtn');

function showError(msg) {
  emailErr.textContent = msg;
  emailErr.hidden = false;
  emailInput.setAttribute('aria-invalid', 'true');
}
function clearError() {
  emailErr.hidden = true;
  emailInput.removeAttribute('aria-invalid');
}
emailInput?.addEventListener('blur', () => {
  const v = emailInput.value.trim();
  if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) showError('Enter a valid email, e.g. name@domain.com'); else clearError();
});
emailInput?.addEventListener('input', () => { if (!emailErr.hidden) clearError(); });

form?.addEventListener('submit', async e => {
  e.preventDefault();
  const v = emailInput.value.trim();
  if (!v) { showError('Email is required to send your access code.'); emailInput.focus(); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { showError('Enter a valid email, e.g. name@domain.com'); emailInput.focus(); return; }
  clearError();
  submitBtn.disabled = true;
  const label = submitBtn.querySelector('.btn__label');
  const original = label.textContent;
  label.textContent = 'SENDING…';
  await sleep(900);
  label.textContent = original;
  submitBtn.disabled = false;
  formOk.hidden = false;
  form.reset();
});

/* =========================================================
   SMOOTH ANCHORS (respects reduced motion)
   ========================================================= */
$$('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: motion ? 'smooth' : 'auto', block: 'start' });
    history.replaceState(null, '', id);
  });
});

/* boot last so listeners exist */
runBoot();
})();
