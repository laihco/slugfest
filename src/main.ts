// Keep first import style for THREE
import * as THREE from "three";

// deno-lint-ignore no-sloppy-imports
import { Scene1_MainHub } from "./Scene1_MainHub";
// deno-lint-ignore no-sloppy-imports
import { Scene2_Watergun } from "./Scene2_Watergun";
// deno-lint-ignore no-sloppy-imports
import { Scene3_MilkToss } from "./Scene3_MilkToss";
// deno-lint-ignore no-sloppy-imports
import { GameScene } from "./SceneInterface";

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// Scenes
const scenes: Record<number, GameScene> = {
  1: new Scene1_MainHub(renderer),
  2: new Scene2_Watergun(renderer),
  3: new Scene3_MilkToss(renderer, () => {
    // called when can-toss is won
    const hub = scenes[1] as Scene1_MainHub;
    hub.resetPlayerPosition();
    switchScene(1);
  }),
};

let currentScene: GameScene = scenes[1];

// Make sure all scenes start with their UI hidden
Object.values(scenes).forEach((scene) => {
  if (hasUI(scene) && scene.hideUI) scene.hideUI();
});

// Type guard for UI
function hasUI(
  scene: unknown,
): scene is { showUI?: () => void; hideUI?: () => void } {
  return typeof scene === "object" && scene !== null &&
    ("showUI" in scene || "hideUI" in scene);
}

export function switchScene(id: number) {
  const next = scenes[id];
  if (!next) {
    console.warn("Scene", id, "does not exist");
    return;
  }

  // hide UI for old scene
  if (hasUI(currentScene) && currentScene.hideUI) currentScene.hideUI();

  currentScene = next;

  // show UI for new scene
  if (hasUI(currentScene) && currentScene.showUI) currentScene.showUI();

  console.log("Switched to scene", id);
}

// Keyboard switching
addEventListener("keydown", (e) => {
  if (["1", "2", "3"].includes(e.key)) switchScene(Number(e.key));
});

// Resize
addEventListener("resize", () => {
  if (currentScene.camera instanceof THREE.PerspectiveCamera) {
    currentScene.camera.aspect = innerWidth / innerHeight;
    currentScene.camera.updateProjectionMatrix();
  }
  renderer.setSize(innerWidth, innerHeight);
});

// Animate loop
let last = performance.now();
function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();
  const delta = (now - last) / 1000;
  last = now;

  currentScene.update(delta);
}
animate();
