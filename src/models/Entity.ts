// import { type THREE } from 'enable3d';
import type { MainScene } from '../main';

export default abstract class Entity {
  // abstract readonly object3d: THREE.Object3D;

  protected constructor(
    protected readonly scene: MainScene,
    public readonly uuid: string,
  ) {}

  public abstract update(delta: number): void;

  public abstract addToScene(): void;

  public abstract removeFromScene(): void;

  public abstract destroy(): void;
}
