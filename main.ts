import * as THREE from "https://esm.sh/three@0.172.0";

import { setLang, t } from "./i18n.ts";
import { initInputManager } from "./InputManager.ts";
import { inventory } from "./inventory.ts";
import { Scene1_MainHub } from "./Scene1_MainHub.ts";
import { Scene2_Watergun } from "./Scene2_Watergun.ts";
import { Scene3_MilkToss } from "./Scene3_MilkToss.ts";
import { Scene4_DuckPond } from "./Scene4_DuckPond.ts";
import { GameScene } from "./SceneInterface.ts";
import { showInfoOverlay } from "./UIOverlay.ts";

setLang("en"); // for now, everything is English

// Grab UI elements

document.addEventListener("DOMContentLoaded", () => {
  const invList = document.getElementById("inventory-list");
  if (!invList) {
    console.error("inventory-list element not found");
    return;
  }

  function updateInventoryUI() {
    const items = inventory.getItems();

    if (!invList) return;

    invList.innerHTML = "";

    for (const item of items) {
      const li = document.createElement("li");
      li.textContent = `${item.name} x${item.quantity}`;
      invList.appendChild(li);
    }
  }

  inventory.onChange(updateInventoryUI);
  updateInventoryUI();
});

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
// Initialize global input system (touch + mouse)
initInputManager(renderer.domElement);

function createMilkTossScene(): Scene3_MilkToss {
  return new Scene3_MilkToss(renderer, () => {
    const hub = scenes[1] as Scene1_MainHub;
    hub.resetPlayerPosition();
    switchScene(1);
  });
}

function createDuckPondScene(): Scene4_DuckPond {
  return new Scene4_DuckPond(renderer, () => {
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
  4: createDuckPondScene(),
};

let currentScene: GameScene = scenes[1];

// ---------- Type guard ----------
function hasUI(
  scene: unknown,
): scene is { showUI?: () => void; hideUI?: () => void } {
  return typeof scene === "object" && scene !== null &&
    ("showUI" in scene || "hideUI" in scene);
}

// ---------- Scene intro tracking ----------
const shownSceneIntro = new Set<number>();

function showSceneIntro(id: number) {
  if (shownSceneIntro.has(id)) return;
  shownSceneIntro.add(id);

  switch (id) {
    case 1:
      showInfoOverlay(
        "intro-hub",
        t("introHubTitle"),
        t("introHubBody"),
        t("introButton"),
      );
      break;
    case 2:
      showInfoOverlay(
        "intro-watergun",
        t("introWatergunTitle"),
        t("introWatergunBody"),
        t("introButton"),
      );
      break;
    case 3:
      showInfoOverlay(
        "intro-milktoss",
        t("introMilkTitle"),
        t("introMilkBody"),
        t("introButton"),
      );
      break;
    case 4:
      showInfoOverlay(
        "intro-duckpond",
        t("introDuckTitle"),
        t("introDuckBody"),
        t("introButton"),
      );
      break;
  }
}

// Make sure all scenes start with their UI hidden
Object.values(scenes).forEach((scene) => {
  if (hasUI(scene) && scene.hideUI) {
    scene.hideUI();
  }
});

// Since we start in the hub, show its intro once
showSceneIntro(1);

export function switchScene(id: number) {
  // Always recreate Milk Toss so it starts fresh
  if (id === 3) {
    if (hasUI(currentScene) && currentScene.hideUI) {
      currentScene.hideUI();
    }

    const freshMilkToss = createMilkTossScene();
    scenes[3] = freshMilkToss;
    currentScene = freshMilkToss;

    if (hasUI(currentScene) && currentScene.showUI) {
      currentScene.showUI();
    }

    showSceneIntro(3); // <- add this

    console.log("Switched to scene", id, "(fresh instance)");
    return;
  }

  if (id === 4) {
    if (hasUI(currentScene) && currentScene.hideUI) {
      currentScene.hideUI();
    }

    const freshDuckPond = createDuckPondScene();
    scenes[4] = freshDuckPond;
    currentScene = freshDuckPond;

    if (hasUI(currentScene) && currentScene.showUI) {
      currentScene.showUI();
    }

    showSceneIntro(4); // <- add this

    console.log("Switched to scene", id, "(fresh instance)");
    return;
  }

  const next = scenes[id];
  if (!next) {
    console.warn("Scene", id, "does not exist");
    return;
  }

  if (hasUI(currentScene) && currentScene.hideUI) {
    currentScene.hideUI();
  }

  currentScene = next;

  if (hasUI(currentScene) && currentScene.showUI) {
    currentScene.showUI();
  }

  showSceneIntro(id); // <- add this

  console.log("Switched to scene", id);
}

// Keyboard switching
addEventListener("keydown", (e) => {
  if (["1", "2", "3", "4"].includes(e.key)) {
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
