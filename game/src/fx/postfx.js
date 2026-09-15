import * as THREE from 'three';

/**
 * Final composite: radial speed streaks, chromatic fringe, vignette,
 * film grain and a soft filmic lift. Keeps the neon readable.
 */
export const FinalGradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    uSpeed: { value: 0 },     // 0..1 normalised speed
    uBoost: { value: 0 },     // 0..1 nitro
    uDamage: { value: 0 },    // red flash on impact
    uVignette: { value: 1 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    precision highp float;
    uniform sampler2D tDiffuse;
    uniform vec2 uResolution;
    uniform float uTime, uSpeed, uBoost, uDamage, uVignette;
    varying vec2 vUv;

    float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }

    void main() {
      vec2 uv = vUv;
      vec2 c = uv - 0.5;
      float r = length(c);

      // radial blur that ramps up with speed / nitro
      float amt = uSpeed * 0.022 + uBoost * 0.05;
      vec3 col = vec3(0.0);
      if (amt > 0.0005) {
        float w = 0.0;
        for (int i = 0; i < 6; i++) {
          float t = float(i) / 5.0;
          float k = 1.0 - t * amt * smoothstep(0.08, 0.75, r);
          float wi = 1.0 - t * 0.55;
          col += texture2D(tDiffuse, 0.5 + c * k).rgb * wi;
          w += wi;
        }
        col /= w;
      } else {
        col = texture2D(tDiffuse, uv).rgb;
      }

      // chromatic aberration towards the edges
      float ca = (0.0012 + uSpeed * 0.0022 + uBoost * 0.0035) * smoothstep(0.1, 0.8, r);
      col.r = texture2D(tDiffuse, 0.5 + c * (1.0 - ca)).r * 0.55 + col.r * 0.45;
      col.b = texture2D(tDiffuse, 0.5 + c * (1.0 + ca)).b * 0.55 + col.b * 0.45;

      // nitro tint + damage flash
      col = mix(col, col * vec3(0.72, 0.88, 1.35) + vec3(0.02, 0.05, 0.12), uBoost * 0.55);
      col = mix(col, vec3(0.55, 0.06, 0.06) + col * 0.6, uDamage * 0.55);

      // vignette
      float vig = smoothstep(1.05, 0.28, r * (1.0 + uSpeed * 0.18));
      col *= mix(1.0, vig, 0.85 * uVignette);

      // grain
      float g = hash(uv * uResolution + fract(uTime) * 91.7) - 0.5;
      col += g * 0.028;

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};
