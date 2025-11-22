import * as THREE from "three";

export interface GameScene {
  camera: THREE.PerspectiveCamera;
  update(delta: number): void;
}
