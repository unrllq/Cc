import * as THREE from 'three';

const SkyShader = {
  uniforms: {
    uZenith: { value: new THREE.Color(0x2f6fd0) },
    uSky: { value: new THREE.Color(0x8fc0f0) },
    uHaze: { value: new THREE.Color(0xdfe9f2) },
    uSunDir: { value: new THREE.Vector3(0.26, 0.92, 0.3).normalize() },
    uSunColor: { value: new THREE.Color(0xfff6e0) },
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
    uniform vec3 uZenith, uSky, uHaze, uSunDir, uSunColor;
    varying vec3 vDir;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(41.7, 289.1))) * 43758.5); }
    void main() {
      vec3 d = normalize(vDir);
      float h = clamp(d.y, -1.0, 1.0);
      // haze near the horizon, deep blue overhead
      vec3 col = mix(uHaze, uSky, smoothstep(-0.02, 0.28, h));
      col = mix(col, uZenith, smoothstep(0.24, 0.92, h));
      // sun disc plus a wide warm scatter around it
      float s = max(dot(d, normalize(uSunDir)), 0.0);
      col += uSunColor * pow(s, 1800.0) * 12.0;
      col += uSunColor * pow(s, 8.0) * 0.30;
      col += uSunColor * pow(s, 2.0) * 0.06;
      // a few soft clouds so the sky is not a flat gradient
      vec2 p = d.xz / max(0.16, d.y);
      float c = 0.0, amp = 0.5;
      for (int i = 0; i < 4; i++) {
        vec2 g = floor(p * 0.6);
        vec2 f = fract(p * 0.6);
        float a = hash(g), b = hash(g + vec2(1.0, 0.0));
        float cc = hash(g + vec2(0.0, 1.0)), dd = hash(g + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        c += amp * mix(mix(a, b, u.x), mix(cc, dd, u.x), u.y);
        p *= 2.03; amp *= 0.5;
      }
      float cloud = smoothstep(0.55, 0.95, c) * smoothstep(0.02, 0.22, d.y);
      col = mix(col, vec3(1.0, 0.99, 0.97), cloud * 0.75);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

/** Clear daylight: sun, sky dome, bounce fill and a matching environment map. */
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
  dome.scale.setScalar(900);
  dome.frustumCulled = false;
  dome.renderOrder = -1;
  scene.add(dome);

  scene.fog = new THREE.Fog(0xdae6f2, 45, 185);

  const sunDir = mat.uniforms.uSunDir.value;

  // key light
  const sun = new THREE.DirectionalLight(0xfff4e2, 3.4);
  sun.position.copy(sunDir).multiplyScalar(160);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 20;
  sun.shadow.camera.far = 400;
  const S = 55;
  Object.assign(sun.shadow.camera, { left: -S, right: S, top: S, bottom: -S });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.04;
  scene.add(sun, sun.target);

  // sky fill + warm bounce off the tarmac
  const hemi = new THREE.HemisphereLight(0xcfe2ff, 0x8a8175, 2.6);
  scene.add(hemi);
  scene.add(new THREE.AmbientLight(0xbfd2e6, 0.85));
  const bounce = new THREE.DirectionalLight(0xffe7c8, 0.5);
  bounce.position.set(-sunDir.x * 100, 30, -sunDir.z * 100);
  scene.add(bounce);

  // environment map generated from this very sky
  const sky = { dome, sun, hemi, bounce, sunDir };
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  const envDome = new THREE.Mesh(geo, mat.clone());
  envDome.scale.setScalar(100);
  envScene.add(envDome);
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.MeshBasicMaterial({ color: 0x6d6a66 }),
  );
  plate.rotation.x = -Math.PI / 2;
  plate.position.y = -0.5;
  envScene.add(plate);
  const env = pmrem.fromScene(envScene, 0.02);
  scene.environment = env.texture;
  scene.environmentIntensity = 1.0;
  sky.env = env.texture;
  pmrem.dispose();

  // The shadow frustum is kept tight and dragged along with the rider,
  // otherwise it either smears across the whole apron or costs a huge map.
  const follow = new THREE.Vector3();
  const offset = sunDir.clone().multiplyScalar(150);
  sky.follow = (target) => {
    follow.set(Math.round(target.x / 4) * 4, 0, Math.round(target.z / 4) * 4);
    sun.target.position.copy(follow);
    sun.position.copy(follow).add(offset);
    sun.target.updateMatrixWorld();
    sun.updateMatrixWorld();
  };

  return sky;
}
