import { THREE, FirstPersonControls, ThirdPersonControls } from 'enable3d';

export function createThirdPersonControls(
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
  target: THREE.Object3D,
  oldControls?: FirstPersonControls | ThirdPersonControls,
) {
  return new ThirdPersonControls(camera, target, {
    offset: new THREE.Vector3(0, 1, 0),
    targetRadius: 3,
    theta:
      oldControls instanceof ThirdPersonControls
        ? oldControls.theta
        : undefined,
    phi:
      oldControls instanceof ThirdPersonControls ? oldControls.phi : undefined,
    radius:
      oldControls instanceof ThirdPersonControls
        ? oldControls.targetRadius
        : undefined,
  });
}
