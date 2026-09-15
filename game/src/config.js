// Central tuning table. Units: metres, seconds, radians.
export const CFG = {
  world: {
    roadWidth: 18,
    axes: [-200, -120, -45, 45, 120, 200], // road centre lines on both X and Z
    limit: 232,                            // hard world boundary (invisible wall)
    groundY: 0,
    heroOffset: [16.8, -0.2, 7],           // puts the alley inside the central block
    heroAlleyMouth: [5.3, 22],             // world x,z where the alley opens south
  },
  bike: {
    wheelRadius: 0.58,
    wheelBase: 2.26,
    rideHeight: 0.176,      // model origin above the contact patch
    mass: 260,
    // longitudinal
    enginePower: 11.5,      // m/s^2 at peak
    powerCurve: [1.0, 0.94, 0.58, 0.24], // multiplier at 0/33/66/100% of top speed
    topSpeed: 51,           // m/s  (~184 km/h)
    boostTopSpeed: 63,      // m/s  (~227 km/h)
    boostPower: 7.5,
    reverseSpeed: 7,
    brakeForce: 14,
    engineBrake: 3.2,
    drag: 0.00055,
    rollResist: 0.55,
    // steering
    steerRate: 3.4,         // rad/s of steering input travel
    maxYawLow: 2.25,        // rad/s ceiling when crawling
    lateralAccel: 17,       // m/s^2 of cornering grip -> yaw cap = a/v
    leanGravity: 16,        // tuning constant for the visual lean angle
    // grip
    grip: 13.0,
    driftGrip: 2.6,
    handbrakeGrip: 1.3,
    driftYawBoost: 1.6,
    slipAngleDrift: 0.20,   // rad, slip needed to enter a drift
    slipAngleExit: 0.12,    // ...and to fall out of one (hysteresis)
    // feel
    leanMax: 0.6,
    leanMaxDrift: 0.74,
    leanRate: 5.2,
    pitchRate: 4.0,
    wheelieSpeed: 26,
    gravity: 26,
    airControl: 0.35,
    gears: [0, 14, 24, 34, 43, 52, 68],
    nitro: { max: 100, drain: 26, driftGain: 19, airGain: 12, idleGain: 1.4, minToFire: 6 },
  },
  camera: {
    fov: 62, fovBoost: 82,
    distance: 6.0, height: 2.5, lookAhead: 8.2,
    stiffness: 7.2, yawStiffness: 5.4, driftLook: 0.42,
    shake: 0.085,
  },
  game: {
    checkpointRadius: 7.5,
    startTime: 60,
    timePerCheckpoint: 11,
    driftScoreRate: 62,
    comboStep: 1.6,       // seconds of continuous drift per multiplier step
    comboMax: 8,
    airScoreRate: 120,
  },
};
export const KMH = 3.6;
