// Central tuning table. Units: metres, seconds, radians.
export const CFG = {
  world: {
    // The street model is authored at about 0.62 of life size (its own photo
    // textures put a storey at 1.65 m), so it is scaled up until a floor is a
    // real 2.7 m. The rider is scaled the other way until the man on the bike
    // is a real 1.75 m sitting height. Together that is the size ratio.
    heroScale: 1.6,
    heroDrop: -0.32,            // model floor (0.2 * scale) down onto y = 0
    apron: 150,                 // flat ground around the model
    limit: 110,                 // how far you may ride from the street
    groundY: 0,
    spawn: [-18.4, 21.6, Math.PI],  // x, z, yaw: at the mouth of the alley
  },
  bike: {
    modelScale: 0.8,        // 3.33 m machine -> 2.66 m, rider head at 1.76 m
    wheelRadius: 0.464,
    wheelBase: 1.81,
    rideHeight: 0.141,      // model origin above the contact patch
    bodyRadius: 0.68,       // collision sphere
    bodyHeight: 1.0,
    mass: 260,
    // longitudinal
    enginePower: 11.5,      // m/s^2 at peak
    powerCurve: [1.0, 0.94, 0.58, 0.24], // multiplier at 0/33/66/100% of top speed
    topSpeed: 44,           // m/s  (~158 km/h)
    boostTopSpeed: 55,      // m/s  (~198 km/h)
    boostPower: 7.5,
    driftThrust: 4.5,       // keeps a slide alive instead of scrubbing to a halt
    reverseSpeed: 4.5,
    brakeForce: 14,
    engineBrake: 3.2,
    drag: 0.00055,
    rollResist: 0.55,
    // steering
    steerRate: 3.4,         // rad/s of steering input travel
    maxYawLow: 2.3,         // rad/s ceiling when crawling
    lateralAccel: 12.0,     // m/s^2 of grip: 1.2 g, a sports bike on warm tyres
    leanGravity: 9.81,      // real gravity, so lean = atan(a_lat / g)
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
    leanMax: 0.9,           // 51 deg: where a real sports bike runs out of tyre
    leanMaxDrift: 1.0,
    leanRate: 5.2,
    pitchRate: 4.0,
    wheelieSpeed: 24,
    gravity: 22,
    airControl: 0.35,
    gears: [0, 11, 19, 27, 34, 44, 55],
    nitro: { max: 100, drain: 26, driftGain: 19, airGain: 12, idleGain: 1.4, minToFire: 6 },
  },
  camera: {
    fov: 62, fovBoost: 82,
    distance: 5.4, height: 2.15, lookAhead: 8.0,
    stiffness: 7.2, yawStiffness: 5.4, driftLook: 0.42,
    shake: 0.085,
  },
  game: {
    checkpointRadius: 8.0,
    startTime: 40,
    timePerCheckpoint: 9,
    driftScoreRate: 62,
    comboStep: 1.6,       // seconds of continuous drift per multiplier step
    comboMax: 8,
    airScoreRate: 120,
  },
};
export const KMH = 3.6;
