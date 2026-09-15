import * as THREE from 'three';

const SkyShader = {
  uniforms: {
    uTop: { value: new THREE.Color(0x05060f) },
    uMid: { value: new THREE.Color(0x1b2352) },
    uHorizon: { value: new THREE.Color(0x53294c) },
    uGlow: { value: new THREE.Color(0xff6a2e) },
    uMoonDir: { value: new THREE.Vector3(0.4, 0.35, -0.85).normalize() },
  },
  vertexShader: /* glsl */`
    varying vec3 vDir;
    void main() {
      vDir = normalize((modelMatrix * vec4(position, 1.0)).xyz - cameraPosition);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    precision highp float;
    uniform vec3 uTop, uMid, uHorizon, uGlow, uMoonDir;
    varying vec3 vDir;
    float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
    void main() {
      vec3 d = normalize(vDir);
      float h = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);
      vec3 col = mix(uHorizon, uMid, smoothstep(0.5, 0.72, h));
      col = mix(col, uTop, smoothstep(0.68, 0.95, h));
      // city light bleeding up from the horizon
      float bleed = pow(1.0 - clamp(abs(d.y) * 3.1, 0.0, 1.0), 2.2);
      col += uGlow * bleed * 0.30;
      // moon
      float m = max(dot(d, normalize(uMoonDir)), 0.0);
      col += vec3(0.85, 0.9, 1.0) * pow(m, 2600.0) * 9.0;
      col += vec3(0.30, 0.42, 0.7) * pow(m, 26.0) * 0.30;
      // stars, only up high
      vec3 g = floor(d * 420.0);
      float s = hash(g);
      float star = smoothstep(0.9975, 1.0, s) * smoothstep(0.1, 0.55, d.y);
      col += vec3(star) * 1.4;
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

export function buildSky(scene, renderer) {
  const geo = new THREE.SphereGeometry(1, 40, 24);
  const mat = new THREE.ShaderMaterial({
    ...SkyShader,
    uniforms: THREE.UniformsUtils.clone(SkyShader.uniforms),
    side: THREE.BackSide,
    depthWrite: false,
    toneMapped: false,
  });
  const dome = new THREE.Mesh(geo, mat);
  dome.scale.setScalar(1400);
  dome.frustumCulled = false;
  dome.renderOrder = -1;
  scene.add(dome);

  scene.fog = new THREE.FogExp2(0x121a2e, 0.0052);

  // ----- lights -----
  const hemi = new THREE.HemisphereLight(0x6577bd, 0x241d16, 1.3);
  scene.add(hemi);

  const moon = new THREE.DirectionalLight(0xbcd0ff, 0.8);
  moon.position.set(120, 150, -240);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  moon.shadow.camera.near = 20;
  moon.shadow.camera.far = 420;
  const S = 90;
  Object.assign(moon.shadow.camera, { left: -S, right: S, top: S, bottom: -S });
  moon.shadow.bias = -0.0012;
  moon.shadow.normalBias = 0.05;
  scene.add(moon);
  scene.add(moon.target);

  // low ambient so nothing reads as pure black
  scene.add(new THREE.AmbientLight(0x3a4a78, 0.55));

  // warm bounce from the neon街
  const fill = new THREE.DirectionalLight(0xff7a5c, 0.22);
  fill.position.set(-140, 60, 180);
  scene.add(fill);

  // ----- environment map so the bike's chrome has something to reflect -----
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envScene = new THREE.Scene();
  const envDome = new THREE.Mesh(geo, mat.clone());
  envDome.scale.setScalar(100);
  envScene.add(envDome);
  // a few emissive slabs so reflections show city structure
  const slabMat = new THREE.MeshBasicMaterial({ color: 0x2a3a66 });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const m = new THREE.Mesh(new THREE.BoxGeometry(14, 30 + (i % 4) * 18, 14), slabMat);
    m.position.set(Math.cos(a) * 55, 8, Math.sin(a) * 55);
    envScene.add(m);
  }
  const groundPlate = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial({ color: 0x0a0b10 }));
  groundPlate.rotation.x = -Math.PI / 2;
  envScene.add(groundPlate);
  const env = pmrem.fromScene(envScene, 0.04);
  scene.environment = env.texture;
  scene.environmentIntensity = 0.42;
  pmrem.dispose();

  return { dome, moon, hemi, fill, env: env.texture };
}
