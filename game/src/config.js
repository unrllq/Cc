// Central tuning table. Units: metres, seconds, radians.
export const CFG = {
  world: {
    heroOffset: [0, -0.2, 0],   // drops the street's floor onto y = 0
    apron: 110,                 // flat ground around the model
    limit: 78,                  // how far you may ride from the street
    groundY: 0,
    spawn: [-11.5, 13.5, Math.PI],  // x, z, yaw: at the mouth of the alley
  },
  bike: {
    wheelRadius: 0.58,
    wheelBase: 2.26,
    rideHeight: 0.176,      // model origin above the contact patch
    mass: 260,
    // longitudinal
    enginePower: 11.5,      // m/s^2 at peak
    powerCurve: [1.0, 0.94, 0.58, 0.24], // multiplier at 0/33/66/100% of top speed
    topSpeed: 39,           // m/s  (~140 km/h) - the street is tight
    boostTopSpeed: 50,      // m/s  (~180 km/h)
    boostPower: 7.5,
    driftThrust: 6.0,      // keeps a slide alive instead of scrubbing to a halt
    reverseSpeed: 4.5,
    brakeForce: 14,
    engineBrake: 3.2,
    drag: 0.00055,
    rollResist: 0.55,
    // steering
    steerRate: 3.4,         // rad/s of steering input travel
    maxYawLow: 2.7,         // rad/s ceiling when crawling - tight U-turns
    lateralAccel: 18,       // m/s^2 of cornering grip -> yaw cap = a/v
    leanGravity: 16,        // tuning constant for the visual lean angle
    // grip
    grip: 13.0,
    driftGrip: 2.6,
    handbrakeGrip: 1.3,
    driftYawBoost: 1.6,
    slipAngleDrift: 0.20,   // rad, slip needed to enter a drift
    slipAngleExit: 0.12,    // ...and to fall out of one (hysteresis)
    // driver aids (togglable in the controls menu)
    assistSlip: 0.34,       // slip the stability aid starts catching
    assistGrip: 5.5,        // extra lateral grip it applies
    assistYaw: 3.2,         // how hard it bleeds off the spin
    driftTargetSlip: 0.46,  // angle auto counter-steer settles a drift at
    // feel
    leanMax: 0.6,
    leanMaxDrift: 0.74,
    leanRate: 5.2,
    pitchRate: 4.0,
    wheelieSpeed: 26,
    gravity: 26,
    airControl: 0.35,
    gears: [0, 10, 17, 24, 31, 39, 50],
    nitro: { max: 100, drain: 26, driftGain: 19, airGain: 12, idleGain: 1.4, minToFire: 6 },
  },
  camera: {
    fov: 62, fovBoost: 82,
    distance: 6.0, height: 2.5, lookAhead: 8.2,
    stiffness: 7.2, yawStiffness: 5.4, driftLook: 0.42,
    shake: 0.085,
  },
  game: {
    checkpointRadius: 7.0,
    startTime: 35,
    timePerCheckpoint: 7,
    driftScoreRate: 62,
    comboStep: 1.6,       // seconds of continuous drift per multiplier step
    comboMax: 8,
    airScoreRate: 120,
  },
};
export const KMH = 3.6;
