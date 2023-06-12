import {
  PhysicsLoader,
  THREE,
  ExtendedObject3D,
  ThirdPersonControls,
  Project,
  FirstPersonControls,
  PointerLock,
  PointerDrag
} from 'enable3d';
import ResizeableScene3D from './scenes/ResizeableScene3D';
import { Player } from './models/Player';
import { type Replay, parseDemofile } from './utils/parseDemofile';
import { getRandom } from './utils/random';
import { type IPlayerInfo } from 'demofile';
import { tickCounterCurrentSet, tickCounterMaxSet } from './utils/tickcouter';
import { keys } from './utils/keyboard';
import { createThirdPersonControls } from './utils/createThirdpersonControl';
import GameEvent from './events/GameEvent';
import { useGameStore } from '../stores/game'
import { useLoadingStore } from '@/stores/loading';

export class MainScene extends ResizeableScene3D {
	public readonly events = new GameEvent();

  public controls!: FirstPersonControls | ThirdPersonControls;
  public players: Record<string, Player> = {};

  public focusedPlayer = 0;

  public demoPlayers: IPlayerInfo[] = [];
  public replay: Replay[] = [];

  public gameStore!: ReturnType<typeof useGameStore>;
  public loadingStore!: ReturnType<typeof useLoadingStore>;

  public startPosition: THREE.Vector3 = new THREE.Vector3(-8, 4, 1);

  constructor() {
    super({ key: 'MainScene' });
  }

  init() {
    super.init();
  }

  async preload() {
    const map = this.load.preload('map', '/assets/maps/de_mirage.glb');
    const csgoAnti = this.load.preload('csgo_anti', '/assets/glb/csgo_anti.glb');
    const csgoTerro = this.load.preload('csgo_terrorist', '/assets/glb/csgo_terrorist.glb');

    await Promise.all([map, csgoAnti, csgoTerro]);
  }

  async create() {
    super.create();

    this.gameStore = useGameStore();
    this.loadingStore = useLoadingStore();

    const demoFileFile = (await fetch(
      'assets/demos/match730_003613235383443128481_0129488978_191.dem'
    ).then((response) => response.arrayBuffer())) as Buffer;

    const demoFile = await parseDemofile(demoFileFile);

    this.demoPlayers = demoFile.players.filter((demoPlayer) => !demoPlayer.fakePlayer);
    this.replay = demoFile.replay;
    this.gameStore.maxTick = demoFile.tickMax;
    tickCounterMaxSet(demoFile.tickMax);

    const addMap = async () => {
      const object = await this.load.gltf('map');
      const scene = object.scenes[0];

      const map = new ExtendedObject3D();
      map.scale.set(0.01, 0.01, 0.01);
      map.name = 'scene';
      map.add(scene);
      this.add.existing(map);
      console.log(map.children);

      map.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = child.receiveShadow = true;

          if (
            ['de_mirage', 'dust_food_crates_74', 'wagonmdl_1'].some((object) =>
              child.name.includes(object)
            )
          ) {
            this.physics.add.existing(child, {
              shape: 'concaveMesh',
              mass: 0,
              collisionFlags: 1,
              autoCenter: false
            });
            child.body.setAngularFactor(0, 0, 0);
            child.body.setLinearFactor(0, 0, 0);
          }
        }
      });
    };

    this.loadingStore.set('Map', 10);
    await addMap();

    this.loadingStore.set('Players', 50);

    for (const demoPlayer of this.demoPlayers) {
      const playerObject = await this.load.gltf(
        Math.random() < 0.5 ? 'csgo_anti' : 'csgo_terrorist'
      );

      const player = new Player(
        this,
        playerObject.scene.children[0],
        demoPlayer.name,
        this.startPosition.add(
          new THREE.Vector3(getRandom(-2, 2), getRandom(-2, 2), getRandom(-2, 2))
        )
      );

      if (this.outlinePass?.selectedObjects) {
        this.outlinePass.selectedObjects = [
          ...this.outlinePass.selectedObjects,
          player.object3d.children[0]
        ];
      }

      this.players[demoPlayer.userId] = player;
    }

    this.loadingStore.set('Scene', 70);

    this.controls = createThirdPersonControls(
      this.camera,
      Object.values(this.players)[this.focusedPlayer].object3d
    );

    if (this.controls instanceof ThirdPersonControls) {
      this.controls.theta = 90;
    }

    const pl = new PointerLock(this.canvas);
    const pd = new PointerDrag(this.canvas);
    pd.onMove((delta) => {
      if (pl.isLocked()) {
        this.controls.update(delta.x * 2, delta.y * 2);
      }
    });

    document.addEventListener('mousedown', (event) => {
      if (!pl.isLocked()) return;

      if (event.button === 0) {
        this.focusedPlayer = (this.focusedPlayer + 1) % Object.keys(this.players).length;
      } else if (event.button === 2) {
        this.focusedPlayer = (this.focusedPlayer - 1) % Object.keys(this.players).length;
        if (this.focusedPlayer < 0) this.focusedPlayer = Object.keys(this.players).length - 1;
      } else if (event.button === 1) {
        this.gameStore.started = !this.gameStore.started;
      }
      // const v3 = new THREE.Vector3();
      // const rotation = this.camera.getWorldDirection(v3);
      // const theta = Math.atan2(rotation.x, rotation.z);
      this.controls = createThirdPersonControls(
        this.camera,
        Object.values(this.players)[this.focusedPlayer].object3d,
        this.controls
      );
    });

    document.addEventListener('keydown', (event) => {
      if (event.code === 'Space') {
        this.gameStore.started = !this.gameStore.started;
      }
    });

    addEventListener('wheel', (event) => {
      this.controls.targetRadius += event.deltaY / 100;
    });

    this.loadingStore.set();
  }

  update(_time: number, delta: number) {
    const replayLength = this.replay.length - 1;
    if (Math.round(this.gameStore.tick) < 0) this.gameStore.tick = replayLength;
    else if (Math.round(this.gameStore.tick) > replayLength - 1) this.gameStore.tick = 0;
    const tickRounded = Math.round(this.gameStore.tick);
    tickCounterCurrentSet(this.replay[tickRounded].tick);

    this.controls.update(0, 0);
    Object.values(this.players).forEach((player) => player.update(delta));

    Object.entries(this.replay[tickRounded].players).forEach(([userId, player]) => {
      if (!player || !this.players[userId]) return;

      if (player.isAlive || (!player.isAlive && this.players[userId].isAlive)) {
        this.players[userId].isAlive = player.isAlive;
        const position = [
          player.position[1],
          player.position[2] + (player.isAlive ? 0 : -10),
          player.position[0]
        ];
        const rotation = player.isAlive
          ? [0, (Math.PI / 180) * player.rotation[1], 0]
          : [Math.PI / 2, 0, (Math.PI / 180) * player.rotation[1]];
        this.players[userId].teleport(
          new THREE.Vector3(...position).multiplyScalar(0.01),
          new THREE.Euler(...rotation),
          !player.isAlive
        );
      }
    });

    if (this.gameStore.started) {
      this.gameStore.tick += delta / 20;
    }

    if (keys.arrowLeft.isDown) {
      this.gameStore.tick -= delta / 2;
    } else if (keys.arrowRight.isDown) {
      this.gameStore.tick += delta / 2;
    } else if (keys.arrowDown.isDown) {
      this.gameStore.tick += delta * 4;
    } else if (keys.arrowUp.isDown) {
      this.gameStore.tick -= delta * 4;
    }
  }
}

export function initGame(canvas: HTMLCanvasElement): Promise<MainScene> {
  return new Promise((resolve) => {
    PhysicsLoader('/ammo', () => {
      const project = new Project({
        renderer: new THREE.WebGLRenderer({
          canvas,
          antialias: true
        }),
        // gravity: {
        //   x: 0,
        //   y: -9.81 * 10,
        //   z: 0,
        // },
        antialias: true,
        maxSubSteps: 2,
        fixedTimeStep: 1 / 60,
        scenes: [MainScene]
      });
      resolve(project.scenes.get('MainScene') as MainScene);
    });
  });
}
