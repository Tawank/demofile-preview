import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

export function modelLoader(url: string, onProgress?: ((event: ProgressEvent<EventTarget>) => void) | undefined) {
  return new Promise<GLTF>((resolve, reject) => {
    loader.load(url, data => resolve(data), onProgress, reject);
  });
}
