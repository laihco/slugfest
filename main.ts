import * as THREE from "https://esm.sh/three@0.172.0";

import { Scene1_MainHub } from "./Scene1_MainHub.ts";
import { Scene2_Watergun } from "./Scene2_Watergun.ts";
import { Scene3_MilkToss } from "./Scene3_MilkToss.ts";
import { GameScene } from "./SceneInterface.ts";

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// --- helper to create a fresh MilkToss scene ---
function createMilkTossScene(): Scene3_MilkToss {
  return new Scene3_MilkToss(renderer, () => {
    // called when can-toss is won or lost
    const hub = scenes[1] as Scene1_MainHub;
    hub.resetPlayerPosition();
    switchScene(1);
  });
}

// Scenes
const scenes: Record<number, GameScene> = {
  1: new Scene1_MainHub(renderer),
  2: new Scene2_Watergun(renderer),
  3: createMilkTossScene(),
};

let currentScene: GameScene = scenes[1];


// Make sure all scenes start with their UI hidden
Object.values(scenes).forEach((scene) => {
  if (hasUI(scene) && scene.hideUI) {
    scene.hideUI();
  }
});

// Type guard for UI
function hasUI(
  scene: unknown,
): scene is { showUI?: () => void; hideUI?: () => void } {
  return typeof scene === "object" && scene !== null &&
    ("showUI" in scene || "hideUI" in scene);
}

export function switchScene(id: number) {
  // Always recreate Milk Toss so it starts fresh
  if (id === 3) {
    // hide UI for old scene
    if (hasUI(currentScene) && currentScene.hideUI) {
      currentScene.hideUI();
    }

    const freshMilkToss = createMilkTossScene();
    scenes[3] = freshMilkToss;
    currentScene = freshMilkToss;

    // show UI for the new MilkToss instance
    if (hasUI(currentScene) && currentScene.showUI) {
      currentScene.showUI();
    }

    console.log("Switched to scene", id, "(fresh instance)");
    return;
  }

  const next = scenes[id];
  if (!next) {
    console.warn("Scene", id, "does not exist");
    return;
  }

  // hide UI for old scene
  if (hasUI(currentScene) && currentScene.hideUI) {
    currentScene.hideUI();
  }

  currentScene = next;

  // show UI for new scene (if it has any)
  if (hasUI(currentScene) && currentScene.showUI) {
    currentScene.showUI();
  }

  console.log("Switched to scene", id);
}


// Keyboard switching
addEventListener("keydown", (e) => {
  if (["1", "2", "3"].includes(e.key)) {
    switchScene(Number(e.key));
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
