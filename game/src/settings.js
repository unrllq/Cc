const KEY = 'neoStreetRider.settings.v2';

export const DEFAULTS = {
  steerSensitivity: 1.0,   // how far the stick travels
  steerSpeed: 1.0,         // how fast it gets there
  assist: true,            // stability help: catches a slide you did not ask for
  autoCounterSteer: true,  // nudges the bars the right way mid-drift
  mouseLook: true,
  mouseSensitivity: 1.0,
  invertMouse: false,
  rumble: true,
  camDistance: 1.0,
  fovShift: 1.0,
  shake: 1.0,
};

const listeners = new Set();

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export const settings = read();

export function setSetting(key, value) {
  settings[key] = value;
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* private mode */ }
  for (const fn of listeners) fn(key, value);
}

export function resetSettings() {
  for (const k of Object.keys(DEFAULTS)) settings[k] = DEFAULTS[k];
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  for (const fn of listeners) fn(null, null);
}

export function onSettingChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
