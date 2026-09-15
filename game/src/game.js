import * as THREE from 'three';
import { CFG } from './config.js';
import { Checkpoints, makeRoute } from './world/checkpoints.js';

const G = CFG.game;
const KEY = 'neoStreetRider.records.v1';

const store = {
  read() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } },
  write(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* private mode */ } },
};

/** Run rules: checkpoints, clock, drift scoring, records. */
export class Game {
  constructor({ scene, bike, collision, audio, hud, fx, camera }) {
    this.bike = bike;
    this.collision = collision;
    this.audio = audio;
    this.hud = hud;
    this.fx = fx;
    this.camera = camera;
    this.cp = new Checkpoints(scene);
    this.route = makeRoute(collision);
    this.mode = 'freeride';
    this.state = 'menu';
    this.score = 0;
    this.combo = 1;
    this.time = G.startTime;
    this.elapsed = 0;
    this.driftBank = 0;
    this.topSpeed = 0;
    this.records = store.read();
  }

  get best() { return this.records[this.mode] || null; }

  start(mode) {
    this.mode = mode;
    this.state = 'playing';
    this.score = 0;
    this.combo = 1;
    this.driftBank = 0;
    this.elapsed = 0;
    this.topSpeed = 0;
    this.time = G.startTime;
    this.cp.build(mode === 'timeattack' ? this.route : []);
    const spawn = mode === 'timeattack'
      ? { x: CFG.world.heroAlleyMouth[0], z: 44, yaw: 0 }   // on the south avenue, nose pointed at the alley
      : { x: 45, z: 60, yaw: 0 };
    this.bike.reset(spawn.x, spawn.z, spawn.yaw);
    this.fx.skid.clear();
    this.fx.particles.clear();
    if (this.mode === 'timeattack') {
      this.hud.message('GO!', 900, 'go');
      this.audio.beep(1040, 0.2, 'triangle', 0.22);
    } else {
      this.hud.message('FREE RIDE', 1400);
    }
  }

  update(dt) {
    if (this.state !== 'playing') return;
    const bike = this.bike;
    this.elapsed += dt;
    this.topSpeed = Math.max(this.topSpeed, bike.speedKmh);

    // ---- drift & air scoring ----
    if (bike.drifting && bike.speed > 8) {
      const quality = Math.min(1.6, Math.abs(bike.slip) * 3.4) * Math.min(1.4, bike.speed / 24);
      const gain = G.driftScoreRate * quality * dt;
      this.driftBank += gain;
      this.combo = Math.min(G.comboMax, 1 + bike.driftTime / G.comboStep);
    } else if (bike.airTime > 0.25) {
      this.driftBank += G.airScoreRate * dt;
    } else if (this.driftBank > 0) {
      // bank the run when the slide ends cleanly
      const total = Math.round(this.driftBank * this.combo);
      if (total > 40) {
        this.score += total;
        this.hud.pop(`+${total}`, this.combo >= 3 ? 'hot' : '');
        if (this.combo >= 3) this.audio.beep(660 + this.combo * 40, 0.09, 'triangle', 0.12);
      }
      this.driftBank = 0;
      this.combo = 1;
    }
    if (bike.impact > 0.35 && this.driftBank > 0) {
      this.driftBank = 0;
      this.combo = 1;
      this.hud.pop('CRASH', 'bad');
    }

    // ---- checkpoints & clock ----
    if (this.mode === 'timeattack') {
      this.time -= dt;
      if (this.cp.test(bike)) {
        const left = this.cp.list.length - this.cp.index;
        this.time += G.timePerCheckpoint;
        this.score += 500;
        this.audio.checkpoint(this.cp.index);
        if (left === 0) return this.finish(true);
        this.hud.pop(`+${G.timePerCheckpoint}s`, 'time');
        this.hud.message(`CHECKPOINT  ${this.cp.index}/${this.cp.list.length}`, 900);
      }
      if (this.time <= 0) {
        this.time = 0;
        return this.finish(false);
      }
    }
  }

  finish(won) {
    this.state = 'finished';
    this.score += Math.round(this.driftBank * this.combo);
    this.driftBank = 0;
    if (won) {
      this.score += Math.round(this.time * 25);
      this.audio.fanfare();
    } else this.audio.fail();
    const rec = this.records[this.mode] || { score: 0, time: 0 };
    const isBest = this.score > (rec.score || 0);
    if (isBest) {
      this.records[this.mode] = { score: Math.floor(this.score), time: this.elapsed, date: Date.now() };
      store.write(this.records);
    }
    this.result = { won, score: Math.floor(this.score), time: this.elapsed, topSpeed: this.topSpeed, isBest, best: rec.score || 0 };
    return this.result;
  }

  /** Put the bike back on the nearest sensible piece of road. */
  respawn() {
    const bike = this.bike;
    const t = this.cp.target;
    let x = bike.pos.x, z = bike.pos.z, yaw = bike.yaw;
    if (t) {
      x = t.userData.pos.x; z = t.userData.pos.z;
      yaw = Math.atan2(-(t.userData.pos.x - bike.pos.x), -(t.userData.pos.z - bike.pos.z));
    } else {
      const a = CFG.world.axes.reduce((p, c) => (Math.abs(c - x) < Math.abs(p - x) ? c : p), 999);
      x = a;
    }
    bike.reset(x, z, yaw);
    this.fx.skid.break();
    this.combo = 1;
    this.driftBank = 0;
  }
}
