import { CFG } from '../config.js';

const $ = (id) => document.getElementById(id);

/** Speedo, nitro, score, timer, minimap and floating call-outs. */
export class HUD {
  constructor(world) {
    this.map = world && world.map;
    this.root = $('hud');
    this.speedCanvas = $('speedo');
    this.sctx = this.speedCanvas.getContext('2d');
    this.mapCanvas = $('minimap');
    this.mctx = this.mapCanvas.getContext('2d');
    this.elScore = $('score');
    this.elCombo = $('combo');
    this.elDrift = $('driftPop');
    this.elTime = $('timeLeft');
    this.elCp = $('cpCount');
    this.elDist = $('cpDist');
    this.elArrow = $('cpArrow');
    this.elGear = $('gearNum');
    this.elKmh = $('kmhNum');
    this.elNitro = $('nitroFill');
    this.elMsg = $('bigMsg');
    this.elObjective = $('objective');
    this.world = world;
    this.pops = [];
    this._mapDirty = true;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this._sizeCanvases();
    window.addEventListener('resize', () => this._sizeCanvases());
  }

  _sizeCanvases() {
    for (const c of [this.speedCanvas, this.mapCanvas]) {
      const r = c.getBoundingClientRect();
      c.width = Math.max(80, r.width * this.dpr);
      c.height = Math.max(80, r.height * this.dpr);
    }
    this._mapDirty = true;
  }

  show(v = true) { this.root.classList.toggle('hidden', !v); }

  message(text, ms = 1400, cls = '') {
    this.elMsg.textContent = text;
    this.elMsg.className = 'big-msg show ' + cls;
    clearTimeout(this._msgT);
    this._msgT = setTimeout(() => { this.elMsg.className = 'big-msg'; }, ms);
  }

  pop(text, cls = '') {
    const el = document.createElement('div');
    el.className = 'pop ' + cls;
    el.textContent = text;
    this.elDrift.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }

  update(dt, { bike, game, camera }) {
    this.drawSpeedo(bike);
    this.drawMap(bike, game);

    this.elKmh.textContent = Math.round(bike.speedKmh);
    this.elGear.textContent = bike.forwardSpeed < -0.5 ? 'R' : bike.gear;
    this.elNitro.style.width = (bike.nitro / CFG.bike.nitro.max * 100).toFixed(1) + '%';
    this.elNitro.classList.toggle('firing', bike.boosting);

    this.elScore.textContent = Math.floor(game.score).toLocaleString('en-US').replace(/,/g, ' ');
    const combo = game.combo;
    this.elCombo.textContent = combo > 1 ? `x${combo.toFixed(1)}` : '';
    this.elCombo.classList.toggle('hot', combo >= 3);

    if (game.mode === 'timeattack') {
      this.elTime.textContent = game.time.toFixed(1);
      this.elTime.classList.toggle('danger', game.time < 8);
      this.elCp.textContent = `${game.cp.index}/${game.cp.list.length}`;
      const t = game.cp.target;
      if (t) {
        const dx = t.userData.pos.x - bike.pos.x, dz = t.userData.pos.z - bike.pos.z;
        const dist = Math.hypot(dx, dz);
        this.elDist.textContent = `${Math.round(dist)} m`;
        const ang = Math.atan2(dx, -dz) - bike.yaw;
        this.elArrow.style.transform = `rotate(${ang}rad)`;
      } else {
        this.elDist.textContent = '';
      }
    }
  }

  drawSpeedo(bike) {
    const c = this.sctx, W = this.speedCanvas.width, H = this.speedCanvas.height;
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 6 * this.dpr;
    c.clearRect(0, 0, W, H);
    const A0 = Math.PI * 0.75, A1 = Math.PI * 2.25;
    const maxKmh = CFG.bike.boostTopSpeed * 3.6;
    const t = Math.min(1, bike.speedKmh / maxKmh);

    // track
    c.lineWidth = 9 * this.dpr;
    c.strokeStyle = 'rgba(120,150,200,0.16)';
    c.beginPath(); c.arc(cx, cy, R, A0, A1); c.stroke();

    // ticks
    for (let i = 0; i <= 12; i++) {
      const a = A0 + (A1 - A0) * (i / 12);
      const inner = R - (i % 3 === 0 ? 15 : 9) * this.dpr;
      c.strokeStyle = i > 9 ? 'rgba(255,60,110,0.85)' : 'rgba(150,190,240,0.5)';
      c.lineWidth = (i % 3 === 0 ? 2.4 : 1.4) * this.dpr;
      c.beginPath();
      c.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
      c.lineTo(cx + Math.cos(a) * (R - 3 * this.dpr), cy + Math.sin(a) * (R - 3 * this.dpr));
      c.stroke();
    }

    // value arc
    const a1 = A0 + (A1 - A0) * t;
    const grad = c.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#19f0ff');
    grad.addColorStop(0.6, '#8b5cff');
    grad.addColorStop(1, '#ff2d6f');
    c.strokeStyle = grad;
    c.lineWidth = 9 * this.dpr;
    c.lineCap = 'round';
    c.beginPath(); c.arc(cx, cy, R, A0, a1); c.stroke();

    // rpm ring
    c.strokeStyle = bike.rpm > 0.9 ? 'rgba(255,60,90,0.95)' : 'rgba(255,255,255,0.35)';
    c.lineWidth = 3 * this.dpr;
    c.beginPath(); c.arc(cx, cy, R - 14 * this.dpr, A0, A0 + (A1 - A0) * bike.rpm); c.stroke();

    // needle
    c.save();
    c.translate(cx, cy);
    c.rotate(a1);
    c.fillStyle = '#ff3b6b';
    c.beginPath();
    c.moveTo(-3 * this.dpr, 0); c.lineTo(0, -R * 0.78); c.lineTo(3 * this.dpr, 0);
    c.closePath(); c.fill();
    c.restore();
  }

  drawMap(bike, game) {
    const c = this.mctx, W = this.mapCanvas.width, H = this.mapCanvas.height;
    const m = this.map;
    c.clearRect(0, 0, W, H);
    c.fillStyle = 'rgba(8,14,24,0.55)';
    c.fillRect(0, 0, W, H);
    if (!m) return;
    if (!this._mapImg) this._mapImg = m.toCanvas(3);

    // world -> minimap pixels
    const spanX = (m.maxX - m.minX), spanZ = (m.maxZ - m.minZ);
    const span = Math.max(spanX, spanZ);
    const s = W / span;
    const ox = (W - spanX * s) / 2, oy = (H - spanZ * s) / 2;
    const toX = (x) => ox + (x - m.minX) * s;
    const toY = (z) => oy + (z - m.minZ) * s;
    c.globalAlpha = 0.85;
    c.drawImage(this._mapImg, ox, oy, spanX * s, spanZ * s);
    c.globalAlpha = 1;

    // checkpoints
    game.cp.list.forEach((g, i) => {
      if (i < game.cp.index) return;
      const p = g.userData.pos;
      c.beginPath();
      c.arc(toX(p.x), toY(p.z), i === game.cp.index ? 4.5 : 2.4, 0, 6.29);
      c.fillStyle = i === game.cp.index ? '#18e0ff' : 'rgba(255,106,26,0.8)';
      c.fill();
    });

    // player
    const px = toX(bike.pos.x), py = toY(bike.pos.z);
    c.save();
    c.translate(px, py);
    c.rotate(-bike.yaw);
    c.fillStyle = '#ffe14d';
    c.beginPath();
    c.moveTo(0, -6); c.lineTo(4.2, 5); c.lineTo(0, 2.4); c.lineTo(-4.2, 5);
    c.closePath(); c.fill();
    c.restore();
  }
}
