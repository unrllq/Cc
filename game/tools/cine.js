(() => {
  const a = window.__app, b = a.bike, dt = 1 / 60;
  const I = (o) => Object.assign({ throttle: 0, brake: 0, steer: 0, handbrake: false, boost: false, lookBack: false, freeYaw: 0, zoom: 0 }, o);
  const step = (n, inp) => {
    for (let i = 0; i < n; i++) {
      b.update(dt, inp);
      a.emitFx(dt, inp);
      a.chase.update(dt, b, inp);
      if (a.world.sky.follow) a.world.sky.follow(b.pos);
      a.fx.skid.update(dt);
      a.fx.particles.update(dt);
      a.game.update(dt);
      a.game.cp.update(dt, a.camera);
    }
  };
  const scene = window.__cine || 'drift';
  if (scene === 'drift') { b.reset(-46, -20, Math.PI); step(150, I({ throttle: 1 })); step(70, I({ throttle: 0.9, steer: -1, handbrake: true })); }
  else if (scene === 'alley') { b.reset(-13, 16, 0); step(120, I({ throttle: 0.5 })); }
  else if (scene === 'alley2') { b.reset(-14, 4, 0); step(90, I({ throttle: 0.45 })); }
  else if (scene === 'apron') { b.reset(30, 20, 0); step(240, I({ throttle: 1, boost: true })); }
  else if (scene === 'north') { b.reset(-20, -30, Math.PI / 2); step(140, I({ throttle: 0.9 })); }
  else if (scene === 'gate') { b.reset(-6, 30, 0); step(90, I({ throttle: 0.6 })); }
  else if (scene === 'wide') { b.reset(-46, 0, Math.PI); step(120, I({ throttle: 0.8 })); }
  a.fxState.speed01 = b.speed01;
  a.hud.update(dt, { bike: b, game: a.game, camera: a.camera });
  return JSON.stringify({ kmh: +b.speedKmh.toFixed(0), slip: +(b.slip * 57.3).toFixed(0), pos: b.pos.toArray().map((v) => +v.toFixed(1)) });
})()
