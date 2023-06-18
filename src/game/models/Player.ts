import Entity from './Entity';
import { type MainScene } from '../main';
import type * as Plugins from '@enable3d/three-graphics/jsm/plugins';
import {
  THREE,
  ExtendedObject3D,
} from 'enable3d';
import type { ReplayPlayerInfo } from '../utils/parseDemofile';

export class Player extends Entity {
	static async loadModel(loader: Plugins.Loaders, url: string) {
		await loader.gltf(url);
  }

  public object3d: ExtendedObject3D;
  public label: THREE.Object3D;
  public labelTexture: THREE.Texture;
  public labelCanvas: HTMLCanvasElement  | null;
  public labelCtx: CanvasRenderingContext2D | null;

  public isAlive = false;
  public teamNumber: number | null = null;

  constructor(
    protected readonly scene: MainScene,
    protected readonly object: {csgoTerro: THREE.Object3D, csgoAnti: THREE.Object3D},
    public readonly name: string,
    public readonly startPosition: THREE.Vector3,
  ) {
    super(scene, name);

    this.object3d = new ExtendedObject3D();
    this.object3d.name = name;
    object.csgoAnti.scale.set(0.01, 0.01, 0.01);
    object.csgoTerro.scale.set(0.01, 0.01, 0.01);
    this.object3d.rotateY(Math.PI + 0.1); // a hack
    this.object3d.add(object.csgoTerro);
    this.object3d.add(object.csgoAnti);
    this.object3d.rotation.set(0, Math.PI * 1.5, 0);
    this.object3d.position.copy(this.startPosition);

    this.object3d.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = child.receiveShadow = true;
        child.frustumCulled = false;
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

    this.labelCanvas = document.createElement('canvas');
    this.labelCanvas.height = 100;
    this.labelCanvas.width = 500;
    
    this.labelCtx = this.labelCanvas.getContext('2d');

    this.labelTexture = new THREE.Texture(this.labelCanvas);
    this.createLabel();

    this.label = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.2), new THREE.MeshBasicMaterial({ map: this.labelTexture, transparent: true }));
    this.label.position.copy(new THREE.Vector3(0, 1, 0));
    this.label.renderOrder = 999;
    this.label.onBeforeRender = function( renderer ) { renderer.clearDepth(); };
    this.label.frustumCulled = false;

    this.object3d.add( this.label );

    scene.add.existing(this.object3d);

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

  createLabel(player?: ReplayPlayerInfo) {
    if (this.labelCtx) {
      if (this.labelCanvas) {
        this.labelCanvas.width += 0;
      }

      if (player?.teamNumber === 2) this.labelCtx.fillStyle = '#fbde1a';
      else if (player?.teamNumber === 3) this.labelCtx.fillStyle = '#55d2fc';
      else this.labelCtx.fillStyle = '#ffffff';

      this.labelCtx.font = '50px Calibri, sans-serif';
      this.labelCtx.textAlign = 'center';
      this.labelCtx.fillText(this.name, 250, 70);
      this.labelCtx.font = '35px Calibri, sans-serif';
      this.labelCtx.fillText(`${player?.health || ''} ${player?.armor || ''}`, 250, 95);
      this.labelTexture.needsUpdate = true;
    }
  }

  public update(_delta: number): void {
    this.label.lookAt(this.scene.camera.position.x, this.scene.camera.position.y, this.scene.camera.position.z);
  }

  updatePlayerInfo(player: ReplayPlayerInfo) {
    this.createLabel(player);

    if (this.teamNumber !== player.teamNumber) {
      if (player.teamNumber === 2) {
        this.object3d.children[0].visible = true;
        this.object3d.children[1].visible = false;
      }
      if (player.teamNumber === 3) {
        this.object3d.children[0].visible = false;
        this.object3d.children[1].visible = true;
      }

      this.teamNumber = player.teamNumber;
    }
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