(() => {
  const a = window.__app, b = a.bike, dt = 1 / 60;
  const I = (o) => Object.assign({ throttle: 0, brake: 0, steer: 0, handbrake: false, boost: false, lookBack: false, freeYaw: 0 }, o);
  const step = (n, inp) => {
    for (let i = 0; i < n; i++) {
      b.update(dt, inp);
      a.emitFx(dt, inp);
      a.chase.update(dt, b, inp);
      a.fx.skid.update(dt);
      a.fx.particles.update(dt);
      a.game.update(dt);
      a.game.cp.update(dt, a.camera);
    }
  };
  const P = new URLSearchParams(location.search);
  const scene = window.__cine || 'drift';
  if (scene === 'drift') {
    b.reset(45, 150, 0);
    step(240, I({ throttle: 1 }));
    step(110, I({ throttle: 0.85, steer: 1, handbrake: true }));
  } else if (scene === 'boost') {
    b.reset(45, 190, 0);
    step(300, I({ throttle: 1, boost: true }));
  } else if (scene === 'alley') {
    b.reset(5.3, 40, 0);
    step(150, I({ throttle: 0.55 }));
    step(60, I({ throttle: 0.4, steer: -0.2 }));
  } else if (scene === 'gate') {
    b.reset(5.3, 44, 0);
    step(120, I({ throttle: 0.6 }));
  } else if (scene === 'wheelie') {
    b.reset(-45, 120, Math.PI / 2);
    step(70, I({ throttle: 1, boost: true }));
  } else if (scene === 'turn') {
    b.reset(45, 160, 0);
    step(200, I({ throttle: 1 }));
    step(80, I({ throttle: 0.6, brake: 0.3, steer: -1 }));
  }
  a.fxState.speed01 = b.speed01;
  a.fxState.boost01 = b.boosting ? 1 : 0;
  a.hud.update(dt, { bike: b, game: a.game, camera: a.camera });
  return JSON.stringify({ kmh: +b.speedKmh.toFixed(0), slip: +(b.slip * 57.3).toFixed(0), pos: b.pos.toArray().map((v) => +v.toFixed(1)), marks: a.fx.skid.head });
})()
