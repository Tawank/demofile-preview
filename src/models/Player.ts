import Entity from './Entity';
import { type MainScene } from '../main';
import type * as Plugins from '@enable3d/three-graphics/jsm/plugins';
import {
  THREE,
  ExtendedObject3D,
} from 'enable3d';

export class Player extends Entity {
	static async loadModel(loader: Plugins.Loaders, url: string) {
		await loader.gltf(url);
  }

  public object3d: ExtendedObject3D;
  public label: THREE.Object3D;

  public isAlive = false;

  constructor(
    protected readonly scene: MainScene,
    protected readonly object: THREE.Object3D,
    public readonly name: string,
    public readonly startPosition: THREE.Vector3,
  ) {
    super(scene, name);
    const player = object;

    this.object3d = new ExtendedObject3D();
    this.object3d.name = name;
    player.scale.set(0.01, 0.01, 0.01);
    this.object3d.rotateY(Math.PI + 0.1); // a hack
    this.object3d.add(player);
    this.object3d.rotation.set(0, Math.PI * 1.5, 0);
    this.object3d.position.copy(this.startPosition);
    // add shadow
    this.object3d.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = child.receiveShadow = true;
      }
    });

    /**
     * Animations
     */
    // scene.animationMixers.add(this.object3d.anims.mixer);
    // object.animations.forEach((animation) => {
    //   console.log(animation)
    //   if (animation.name) {
    //     this.object3d.anims.add(animation.name, animation);
    //   }
    // });
    // this.object3d.anims.play('Armature|mixamo.com|Layer0');

    /**
     * Add the player to the scene with a body
     */
    scene.add.existing(this.object3d);

    const canvas = document.createElement('canvas');
    canvas.height = 100;
    canvas.width = 500;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#6a5acd';
      ctx.font = '50px Calibri, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(name, 250, 70);
    }
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    this.label = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.2), new THREE.MeshBasicMaterial({ map: texture, transparent: true }));
    this.label.position.copy(new THREE.Vector3(0, 1, 0));
    this.object3d.add(this.label);
    this.object3d.frustumCulled = false;

    scene.physics.add.existing(this.object3d, {
      shape: 'capsule',
      axis: 'y',
      radius: 0.15,
      height: 0.4,
      offset: { y: -0.435 },
    });
    this.object3d.body.setFriction(1);
    this.object3d.body.setAngularFactor(0, 0, 0);
    // https://docs.panda3d.org/1.10/python/programming/physics/bullet/ccd
    this.object3d.body.setCcdMotionThreshold(1e-7);
    this.object3d.body.setCcdSweptSphereRadius(0.25);
  }

  public update(_delta: number): void {
    this.label.lookAt(this.scene.camera.position);
  }

  teleport(position: THREE.Vector3, rotation: THREE.Euler = new THREE.Euler(), instant = false, setBackToDynamic = false) {
    // set body to be kinematic
    this.object3d.body.setCollisionFlags(2);

    // set the new position
    if (instant || this.object3d.position.distanceTo(position) > 3) {
      this.object3d.position.copy(position);
    } else {
      this.object3d.position.lerp(position, 0.1);
    }
    this.object3d.rotation.copy(rotation);
    this.object3d.body.needUpdate = true;

    if (setBackToDynamic) {
      console.log(this.object3d.position, this.object3d.rotation)
    }

    // this will run only on the next update if body.needUpdate = true
    this.object3d.body.once.update(() => {
      // set body back to dynamic
      if (setBackToDynamic) {
        this.object3d.body.setCollisionFlags(0);
      }

      // if you do not reset the velocity and angularVelocity, the object will keep it
      this.object3d.body.setVelocity(0, 0, 0);
      this.object3d.body.setAngularVelocity(0, 0, 0);
    });
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