import * as THREE from "https://esm.sh/three@0.172.0";

export interface GameScene {
  camera: THREE.Camera;   // can be Perspective, Orthographic, etc.
  update(delta: number): void;
}
