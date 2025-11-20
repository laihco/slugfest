import * as THREE from "https://esm.sh/three@0.172.0";

import { Scene1_MainHub } from "./Scene1_MainHub.ts";
import { Scene2_Watergun } from "./Scene2_Watergun.ts";
import { Scene3_MilkToss } from "./Scene3_MilkToss.ts";
import { GameScene } from "./SceneInterface.ts";

// -------------------------------------------
// Renderer Setup
// -------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// -------------------------------------------
// Scene Instances
// -------------------------------------------
const scenes: Record<number, GameScene> = {
  1: new Scene1_MainHub(renderer),
  2: new Scene2_Watergun(renderer),
  3: new Scene3_MilkToss(renderer),
};

let currentScene: GameScene = scenes[1];

// -------------------------------------------
// Scene Manager API
// -------------------------------------------
export function switchScene(id: number) {
  if (scenes[id]) {
    currentScene = scenes[id];
    console.log("Switched to scene", id);
  } else {
    console.warn("Scene", id, "does not exist");
  }
}

// -------------------------------------------
// Handle Input (1, 2, 3)
// -------------------------------------------
addEventListener("keydown", (e) => {
  if (["1", "2", "3"].includes(e.key)) {
    currentScene = scenes[Number(e.key)];
    console.log("Switched to scene", e.key);
  }
});

// -------------------------------------------
// Resize
// -------------------------------------------
addEventListener("resize", () => {
  if (currentScene.camera instanceof THREE.PerspectiveCamera) {
    currentScene.camera.aspect = innerWidth / innerHeight;
    currentScene.camera.updateProjectionMatrix();
  }

  renderer.setSize(innerWidth, innerHeight);
});

// -------------------------------------------
// Animation Loop (delta time)
// -------------------------------------------
let last = performance.now();

function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();
  const delta = (now - last) / 1000; // seconds
  last = now;

  currentScene.update(delta);
}

animate();
