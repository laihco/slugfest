import * as THREE from "https://esm.sh/three@0.172.0";

import { Scene1_MainHub } from "./Scene1_MainHub.ts";
import { Scene2_Watergun } from "./Scene2_Watergun.ts";
import { Scene3_MilkToss } from "./Scene3_MilkToss.ts";
import { GameScene } from "./SceneInterface.ts";

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// Scene instances
const scenes: Record<number, GameScene> = {
  1: new Scene1_MainHub(renderer),
  2: new Scene2_Watergun(renderer),
  3: new Scene3_MilkToss(renderer),
};

let currentScene: GameScene = scenes[1];

// Type guard for scenes with UI
function hasUI(
  scene: unknown,
): scene is { showUI?: () => void; hideUI?: () => void } {
  return typeof scene === "object" && scene !== null &&
    ("showUI" in scene || "hideUI" in scene);
}

// Ensure all scenes hide their UI at start
Object.values(scenes).forEach((scene) => {
  if (hasUI(scene) && scene.hideUI) scene.hideUI();
});

// Switch scenes
addEventListener("keydown", (e) => {
  if (["1", "2", "3"].includes(e.key)) {
    // Hide previous scene's UI
    if (hasUI(currentScene) && currentScene.hideUI) currentScene.hideUI();

    currentScene = scenes[Number(e.key)];

    // Show UI only if this scene has it
    if (hasUI(currentScene) && currentScene.showUI) currentScene.showUI();

    console.log("Switched to scene", e.key);
  }
});

// Resize
addEventListener("resize", () => {
  if (currentScene.camera instanceof THREE.PerspectiveCamera) {
    currentScene.camera.aspect = innerWidth / innerHeight;
    currentScene.camera.updateProjectionMatrix();
  }
  renderer.setSize(innerWidth, innerHeight);
});

// Animate
let last = performance.now();
function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();
  const delta = (now - last) / 1000;
  last = now;

  currentScene.update(delta);
}

animate();
