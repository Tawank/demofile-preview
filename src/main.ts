import {
  PhysicsLoader,
  THREE,
  ExtendedObject3D,
  ThirdPersonControls,
  PointerLock,
  PointerDrag,
  Project,
  FirstPersonControls,
} from 'enable3d';
import ResizeableScene3D from './ResizeableScene3D';

const isTouchDevice = 'ontouchstart' in window;

class MainScene extends ResizeableScene3D {
  public canJump = true;
  public move = false;

  public moveTop = 0;
  public moveRight = 0;

  public controls!: FirstPersonControls | ThirdPersonControls;
  public player!: ExtendedObject3D;

  public keys = {
    w: { isDown: false },
    a: { isDown: false },
    s: { isDown: false },
    d: { isDown: false },
    space: { isDown: false },
    num2: { isDown: false },
    num4: { isDown: false },
    num6: { isDown: false },
    num8: { isDown: false },
  };

  public startPosition: THREE.Vector3 = new THREE.Vector3(-8, 0, -1);

  constructor() {
    super({ key: 'MainScene' });
  }

  init() {
		super.init();
    this.renderer.setPixelRatio(Math.max(1, window.devicePixelRatio / 2));

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.canJump = true;
    this.move = false;

    this.moveTop = 0;
    this.moveRight = 0;
  }

  async preload() {
    const map = this.load.preload('map', '/assets/maps/de_mirage.glb');
    const player = this.load.preload('player', '/assets/glb/csgo_anti_run.glb');

    await Promise.all([map, player]);
  }

  async create() {
    const { lights } = await this.warpSpeed(
      '-ground',
      '-orbitControls',
    );

    if (!lights) throw new Error('lights not defined');

    const { hemisphereLight, ambientLight, directionalLight } = lights;
    const intensity = 0.65;
    hemisphereLight.intensity = intensity;
    ambientLight.intensity = intensity;
    directionalLight.intensity = intensity;
    directionalLight.shadow.mapSize = new THREE.Vector2(2048, 2048);

    // this.physics.debug?.enable();

    const addMap = async () => {
      const object = await this.load.gltf('map');
      const scene = object.scenes[0];

      const map = new ExtendedObject3D();
      map.scale.set(0.01, 0.01, 0.01);
      map.name = 'scene';
      map.add(scene);
      this.add.existing(map);

      map.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = child.receiveShadow = true;

          console.log(child);

          if (
            [
              'de_mirage',
              'dust_food_crates_74',
              'wagonmdl_1',
            ].some((object) => child.name.includes(object))
          ) {
            this.physics.add.existing(child, {
              shape: 'concaveMesh',
              mass: 0,
              collisionFlags: 1,
              autoCenter: false,
            });
            child.body.setAngularFactor(0, 0, 0);
            child.body.setLinearFactor(0, 0, 0);
          }
        }
      });
    };
    const addPlayer = async () => {
      const object = await this.load.gltf('player');
      const player = object.scene.children[0];

      this.player = new ExtendedObject3D();
      this.player.name = 'player';
      // player.scale.set(1, 1, 1);
      this.player.rotateY(Math.PI + 0.1); // a hack
      this.player.add(player);
      this.player.rotation.set(0, Math.PI * 1.5, 0);
      this.player.position.copy(this.startPosition);
      // add shadow
      this.player.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = child.receiveShadow = true;
        }
      });

      /**
       * Animations
       */
      this.animationMixers.add(this.player.anims.mixer);
      object.animations.forEach((animation) => {
        console.log(animation)
        if (animation.name) {
          this.player.anims.add(animation.name, animation);
        }
      });
      this.player.anims.play('Armature|mixamo.com|Layer0');

      /**
       * Add the player to the scene with a body
       */
      this.add.existing(this.player);
      this.physics.add.existing(this.player, {
        shape: 'capsule',
        axis: 'y',
        radius: 0.15,
        height: 0.4,
        offset: { y: -0.435 },
      });
      this.player.body.setFriction(1);
      this.player.body.setAngularFactor(0, 0, 0);
      // https://docs.panda3d.org/1.10/python/programming/physics/bullet/ccd
      this.player.body.setCcdMotionThreshold(1e-7);
      this.player.body.setCcdSweptSphereRadius(0.25);

      this.controls = new FirstPersonControls(this.camera, this.player, {
        offset: new THREE.Vector3(0, 0.8, 0),
        targetRadius: 3,
      }) as FirstPersonControls | ThirdPersonControls;

      if (this.controls instanceof ThirdPersonControls){
        this.controls.theta = 90;
      }

      const pl = new PointerLock(this.canvas);
      const pd = new PointerDrag(this.canvas);
      pd.onMove((delta) => {
        if (pl.isLocked()) {
          this.controls.update(delta.x * 2, delta.y * 2);
        }
      });
    };

    await addMap();
    await addPlayer();

    const press = (e: KeyboardEvent, isDown: boolean) => {
      e.preventDefault();
      const { code } = e;
      switch (code) {
        case 'KeyW':
          this.keys.w.isDown = isDown;
          break;
        case 'ArrowUp':
          this.keys.w.isDown = isDown;
          break;
        case 'Space':
          this.keys.space.isDown = isDown;
          break;
        case 'Numpad2':
          this.keys.num2.isDown = isDown;
          break;
        case 'Numpad4':
          this.keys.num4.isDown = isDown;
          break;
        case 'Numpad6':
          this.keys.num6.isDown = isDown;
          break;
        case 'Numpad8':
          this.keys.num8.isDown = isDown;
          break;
      }
    };

    document.addEventListener('keydown', (e) => press(e, true));
    document.addEventListener('keyup', (e) => press(e, false));
  }

  jump() {
    if (!this.player || !this.canJump) return;
    this.canJump = false;
    // this.player.anims.play('jump_running', 500, false);
    setTimeout(() => {
      this.canJump = true;
      // this.player.anims.play('idle');
    }, 650);
    this.player.body.applyForceY(3.5);
  }

  update(time: number, delta: number) {
    if (this.player && this.player.body) {
      /**
       * Update Controls
       */
      this.controls.update(this.moveRight * 2, -this.moveTop * 2);
      /**
       * Player Turn
       */
      const speed = 4;
      const v3 = new THREE.Vector3();

      const rotation = this.camera.getWorldDirection(v3);
      const theta = Math.atan2(rotation.x, rotation.z);
      const rotationPlayer = this.player.getWorldDirection(v3);
      const thetaPlayer = Math.atan2(rotationPlayer.x, rotationPlayer.z);
      this.player.body.setAngularVelocityY(0);

      const l = Math.abs(theta - thetaPlayer);
      let rotationSpeed = isTouchDevice ? 2 : 4;
      const d = Math.PI / 24;

      if (l > d) {
        if (l > Math.PI - d) rotationSpeed *= -1;
        if (theta < thetaPlayer) rotationSpeed *= -1;
        this.player.body.setAngularVelocityY(rotationSpeed);
      }

      /**
       * Player Move
       */
      if (this.keys.w.isDown || this.move) {
        // if (this.player.anims.current === 'idle' && this.canJump)
        //   this.player.anims.play('run');

        const x = Math.sin(theta) * speed,
          y = this.player.body.velocity.y,
          z = Math.cos(theta) * speed;

        this.player.body.setVelocity(x, y, z);
      } else {
        // if (this.player.anims.current === 'run' && this.canJump)
        //   this.player.anims.play('idle');
      }

      if (this.keys.num2.isDown) {
        this.startPosition.x -= 1;
        this.teleport(this.startPosition);
      }

      if (this.keys.num6.isDown) {
        this.startPosition.x += 1;
        this.teleport(this.startPosition);
      }

      if (this.keys.num4.isDown) {
        this.startPosition.z -= 1;
        this.teleport(this.startPosition);
      }

      if (this.keys.num8.isDown) {
        this.startPosition.z += 1;
        this.teleport(this.startPosition);
      }

      /**
       * Player Jump
       */
      if (this.keys.space.isDown && this.canJump) {
        this.jump();
      }
    }
  }

  teleport(vector3: THREE.Vector3) {
    // set body to be kinematic
    this.player.body.setCollisionFlags(2);

    // set the new position
    this.player.position.copy(vector3);
    console.log('newPosition', vector3.x, vector3.y, vector3.z);
    this.player.body.needUpdate = true;

    // this will run only on the next update if body.needUpdate = true
    this.player.body.once.update(() => {
      // set body back to dynamic
      this.player.body.setCollisionFlags(0);

      // if you do not reset the velocity and angularVelocity, the object will keep it
      this.player.body.setVelocity(0, 0, 0);
      this.player.body.setAngularVelocity(0, 0, 0);
    });
  }
}

window.addEventListener('load', () => {
  PhysicsLoader('/ammo', () => {
    const project = new Project({
      antialias: true,
      maxSubSteps: 10,
      fixedTimeStep: 1 / 120,
      scenes: [MainScene],
    });
  });
});
