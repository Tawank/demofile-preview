import { EffectComposer, RenderPass, Scene3D, THREE } from 'enable3d';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

export default class ResizeableScene3D extends Scene3D {
  outlinePass!: OutlinePass;

  init() {
    this.resize();
    window.addEventListener('resize', () => {
      this.resize();
    });

    this.renderer.setPixelRatio(Math.max(1, window.devicePixelRatio / 2));

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  async create() {
    const { lights } = await this.warpSpeed('-ground', '-orbitControls');

    if (!lights) throw new Error('lights not defined');

    const { hemisphereLight, ambientLight, directionalLight } = lights;
    hemisphereLight.intensity = 0.4;
    ambientLight.intensity = 0.4;
    directionalLight.intensity = 0.8;
    directionalLight.shadow.mapSize = new THREE.Vector2(4096, 4096);
    directionalLight.position.set(100, 200, 50);

    // this.physics.debug?.enable();

    // this.composer = new EffectComposer(this.renderer);

    // const renderPass = new RenderPass(this.scene, this.camera);
    // this.composer.addPass(renderPass);

    // const effectFXAA = new ShaderPass(FXAAShader);
    // effectFXAA.uniforms.resolution.value.set(
    //   1 / window.innerWidth,
    //   1 / window.innerHeight,
    // );
    // this.composer.addPass(effectFXAA);

    // this.outlinePass = new OutlinePass(
    //   new THREE.Vector2(window.innerWidth, window.innerHeight),
    //   this.scene,
    //   this.camera,
    // );
    // this.outlinePass.visibleEdgeColor.set(0x190a05);
    // this.outlinePass.hiddenEdgeColor.set(0x190a05);
    // this.composer.addPass(this.outlinePass);
  }

  resize() {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    this.renderer.setSize(newWidth, newHeight);
    this.renderer.setPixelRatio(Math.max(1, window.devicePixelRatio / 2));
    const camera = this.camera as THREE.PerspectiveCamera;
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
  }
}
