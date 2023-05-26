import type * as Plugins from '@enable3d/three-graphics/jsm/plugins';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { THREE } from 'enable3d';
import Entity from './Entity';
import { type MainScene } from '../main';
import {vertexShader, fragmentShader} from '../shaders/smoke';

export class Smoke extends Entity {
  static async loadModel(loader: Plugins.Loaders, url: string) {
    await loader.gltf(url);
  }

  public mesh: THREE.Mesh;
  public material: THREE.RawShaderMaterial;

  constructor(
    protected readonly scene: MainScene,
    public readonly name: string,
  ) {
    super(scene, name);

    // Texture

    const size = 128;
    const data = new Uint8Array(size * size * size);

    let i = 0;
    const scale = 0.05;
    const perlin = new ImprovedNoise();
    const vector = new THREE.Vector3();

    for (let z = 0; z < size; z++) {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const d =
            1.0 -
            vector
              .set(x, y, z)
              .subScalar(size / 2)
              .divideScalar(size)
              .length();
          data[i] =
            (128 +
              128 *
                perlin.noise((x * scale) / 1.5, y * scale, (z * scale) / 1.5)) *
            d *
            d;
          i++;
        }
      }
    }

    const texture = new THREE.Data3DTexture(data, size, size, size);
    texture.format = THREE.RedFormat;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.unpackAlignment = 1;
    texture.needsUpdate = true;

    // Material

    const geometry = new THREE.BoxGeometry(2, 2, 2);
    this.material = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: {
        base: { value: new THREE.Color(0x798aa0) },
        map: { value: texture },
        cameraPos: { value: new THREE.Vector3() },
        threshold: { value: 0.2 },
        opacity: { value: 0.2 },
        range: { value: 0.2 },
        steps: { value: 75 },
        frame: { value: 0 },
      },
      vertexShader,
      fragmentShader,
      side: THREE.BackSide,
      transparent: true,
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    scene.add.mesh(this.mesh);
    this.mesh.position.copy(new THREE.Vector3(-8, 0, 1));
  }

  public update(_delta: number): void {
    
    this.material.uniforms.cameraPos.value.copy( this.scene.camera.position );
    this.mesh.rotation.y = - performance.now() / 7500;

    this.material.uniforms.frame.value ++;

  }

  public addToScene(): void {
    throw new Error('Method not implemented.');
  }
  public removeFromScene(): void {
    throw new Error('Method not implemented.');
  }
  public destroy(): void {
    throw new Error('Method not implemented.');
  }
}
