import * as THREE from "https://esm.sh/three@0.172.0";

export interface GameScene {
  camera: THREE.PerspectiveCamera;
  update(): void;
}
