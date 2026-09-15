import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FinalGradeShader } from '../fx/postfx.js';

export const QUALITY = {
  high: { pixelRatio: 1.35, bloom: true, msaa: 4, shadows: true, shadowSize: 2048, particles: 1, anisotropy: 8 },
  medium: { pixelRatio: 1.0, bloom: true, msaa: 0, shadows: true, shadowSize: 1024, particles: 0.6, anisotropy: 4 },
  low: { pixelRatio: 0.8, bloom: false, msaa: 0, shadows: false, shadowSize: 512, particles: 0.3, anisotropy: 2 },
};

export class Renderer {
  constructor(canvas, quality = 'high') {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.06;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.canvas = canvas;
    this.composer = null;
    this.quality = null;
    this.setQuality(quality);
  }

  attach(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this._buildChain();
  }

  setQuality(name) {
    if (this.quality === name) return;
    this.quality = name;
    const q = QUALITY[name];
    this.q = q;
    this.renderer.shadowMap.enabled = q.shadows;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, q.pixelRatio));
    if (this.scene) this._buildChain();
    this.resize();
  }

  _buildChain() {
    if (this.composer) this.composer.dispose();
    const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    const target = new THREE.WebGLRenderTarget(size.x, size.y, {
      type: THREE.HalfFloatType,
      samples: this.q.msaa,
      colorSpace: THREE.LinearSRGBColorSpace,
    });
    this.composer = new EffectComposer(this.renderer, target);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    if (this.q.bloom) {
      this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.55, 0.75, 0.92);
      this.composer.addPass(this.bloom);
    } else this.bloom = null;
    this.grade = new ShaderPass(FinalGradeShader);
    this.grade.renderToScreen = true;
    this.composer.addPass(this.grade);
    this.resize();
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    if (this.camera) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
    if (this.composer) {
      const s = this.renderer.getDrawingBufferSize(new THREE.Vector2());
      this.composer.setSize(s.x, s.y);
      if (this.grade) this.grade.uniforms.uResolution.value.set(s.x, s.y);
    }
  }

  render(dt, fx) {
    if (this.grade) {
      const u = this.grade.uniforms;
      u.uTime.value += dt;
      u.uSpeed.value = fx.speed01;
      u.uBoost.value = fx.boost01;
      u.uDamage.value = fx.damage01;
      u.uVignette.value = fx.vignette;
    }
    this.composer.render(dt);
  }
}
