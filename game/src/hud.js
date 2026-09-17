// HUD: скорость, высота, форсаж, таймер, миникарта и маркер следующего кольца.
import * as THREE from 'three';
import { WORLD, riverZ } from './city.js';
import { fmtTime } from './gameplay.js';

export function createHUD(city) {
  const el = {
    speed: document.getElementById('speed'),
    alt: document.getElementById('alt'),
    boost: document.getElementById('boostBar'),
    boostBox: document.querySelector('.boost'),
    timer: document.getElementById('timer'),
    ringNow: document.getElementById('ringNow'),
    ringAll: document.getElementById('ringAll'),
    combo: document.getElementById('combo'),
    toast: document.getElementById('toast'),
    damage: document.getElementById('damage'),
    navcue: document.getElementById('navcue'),
    cue: document.querySelector('#navcue i'),
    map: document.getElementById('minimap')
  };
  const mctx = el.map.getContext('2d');

  // --- статическая подложка карты
  const OFF = 760;
  const off = document.createElement('canvas');
  off.width = off.height = OFF;
  const o = off.getContext('2d');
  const s = OFF / WORLD;                       // пикселей на метр
  const mx = x => (x + WORLD / 2) * s;
  const mz = z => (z + WORLD / 2) * s;

  o.fillStyle = '#04070f'; o.fillRect(0, 0, OFF, OFF);
  o.strokeStyle = 'rgba(40,120,150,.25)'; o.lineWidth = 1;
  for (let g = -WORLD / 2; g <= WORLD / 2; g += 118) {
    o.beginPath(); o.moveTo(mx(g), 0); o.lineTo(mx(g), OFF); o.stroke();
    o.beginPath(); o.moveTo(0, mz(g)); o.lineTo(OFF, mz(g)); o.stroke();
  }
  // Темза
  o.strokeStyle = 'rgba(30,120,190,.55)';
  o.lineWidth = 240 * s;
  o.beginPath();
  for (let x = -WORLD; x <= WORLD; x += 60) {
    const px = mx(x), pz = mz(riverZ(x));
    x === -WORLD ? o.moveTo(px, pz) : o.lineTo(px, pz);
  }
  o.stroke();
  // здания
  for (const b of city.footprints) {
    const h = Math.min(1, b.h / 240);
    o.fillStyle = `rgba(${90 + h * 110},${140 + h * 90},${190 + h * 60},${0.35 + h * 0.5})`;
    o.fillRect(mx(b.x - b.hw), mz(b.z - b.hd), b.hw * 2 * s, b.hd * 2 * s);
  }

  const v = new THREE.Vector3();
  let lastToast = 0;

  function toast(text, color = '#31e6ff') {
    el.toast.textContent = text;
    el.toast.style.color = color;
    el.toast.classList.add('show');
    lastToast = performance.now();
  }

  function damage(on) {
    el.damage.classList.toggle('on', on);
  }

  function update(player, course, camera, time) {
    el.speed.textContent = String(Math.round(player.speedKmh)).padStart(3, '0');
    el.alt.textContent = Math.round(player.pos.y);
    el.boost.style.width = (player.boostFuel * 100).toFixed(0) + '%';
    el.boostBox.classList.toggle('boost--hot', player.overheat);
    el.timer.textContent = fmtTime(course.state.time);
    el.ringNow.textContent = course.state.passed;
    el.ringAll.textContent = course.state.total;
    el.combo.textContent = course.state.combo > 1 ? `COMBO ×${course.state.combo}` : '';

    if (el.toast.classList.contains('show') && performance.now() - lastToast > 1300) {
      el.toast.classList.remove('show');
    }

    // --- маркер следующего кольца
    const t = course.target;
    if (t && !course.state.finished) {
      el.navcue.style.display = '';
      v.copy(t).project(camera);
      const behind = v.z > 1;
      let x = v.x, y = v.y;
      if (behind) { x = -x; y = -y; }
      const m = Math.max(Math.abs(x), Math.abs(y));
      const edge = behind || m > 0.92;
      if (edge) { const k = 0.92 / (m || 1); x *= k; y *= k; }
      el.navcue.style.transform =
        `translate(${x * innerWidth / 2}px, ${-y * innerHeight / 2}px)`;
      el.cue.style.opacity = edge ? 0.9 : 0.55;
      el.cue.style.transform = `scale(${edge ? 0.55 : 1})`;
    } else {
      el.navcue.style.display = 'none';
    }

    drawMap(player, course, time);
  }

  function drawMap(player, course, time) {
    const W = el.map.width, H = el.map.height;
    mctx.clearRect(0, 0, W, H);
    mctx.save();
    mctx.beginPath();
    mctx.arc(W / 2, H / 2, W / 2 - 2, 0, Math.PI * 2);
    mctx.clip();
    mctx.fillStyle = 'rgba(3,6,12,.85)';
    mctx.fillRect(0, 0, W, H);

    const yaw = Math.atan2(player.forward.x, player.forward.z);
    const zoom = 0.85;                       // ~500 м вокруг игрока
    mctx.translate(W / 2, H / 2);
    mctx.rotate(Math.PI - yaw);
    mctx.scale(zoom, zoom);
    mctx.drawImage(off, -mx(player.pos.x), -mz(player.pos.z));

    // кольца трассы
    for (const r of course.rings) {
      const px = mx(r.pos.x) - mx(player.pos.x);
      const pz = mz(r.pos.z) - mz(player.pos.z);
      const active = r.i === course.state.index;
      mctx.beginPath();
      mctx.arc(px, pz, active ? 6 : 3.4, 0, Math.PI * 2);
      mctx.fillStyle = r.done ? 'rgba(49,230,255,.35)'
        : active ? `rgba(255,45,148,${0.6 + 0.4 * Math.sin(time * 5)})` : 'rgba(255,45,148,.35)';
      mctx.fill();
    }
    mctx.restore();

    // игрок — всегда носом вверх
    mctx.save();
    mctx.translate(W / 2, H / 2);
    mctx.beginPath();
    mctx.moveTo(0, -9); mctx.lineTo(6, 8); mctx.lineTo(0, 4); mctx.lineTo(-6, 8);
    mctx.closePath();
    mctx.fillStyle = '#eaf9ff';
    mctx.shadowColor = '#31e6ff'; mctx.shadowBlur = 12;
    mctx.fill();
    mctx.restore();

    // рамка
    mctx.beginPath();
    mctx.arc(W / 2, H / 2, W / 2 - 2, 0, Math.PI * 2);
    mctx.strokeStyle = 'rgba(49,230,255,.45)';
    mctx.lineWidth = 1.5;
    mctx.stroke();
  }

  return { update, toast, damage };
}
