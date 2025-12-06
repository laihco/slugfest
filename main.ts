import * as THREE from "https://esm.sh/three@0.172.0";

import { Scene1_MainHub } from "./Scene1_MainHub.ts";
import { Scene2_Watergun } from "./Scene2_Watergun.ts";
import { Scene3_MilkToss } from "./Scene3_MilkToss.ts";
import { Scene4_DuckPond } from "./Scene4_DuckPond.ts";
import { GameScene } from "./SceneInterface.ts";
import { inventory } from "./inventory.ts";

type LangCode = "en" | "hi" | "ar";

let currentLang: LangCode = "en";
let currentIntroSceneId: number | null = null; // which scene's intro is open

type SceneIntroText = {
  title: string;
  body: string;
  buttonLabel?: string;
  dir?: "ltr" | "rtl";
};

type SceneIntroPerLang = Record<LangCode, SceneIntroText>;

const sceneIntros: Record<number, SceneIntroPerLang> = {
  1: {
    en: {
      title: "Welcome to the Carnival!",
      body: "Use W A S D to move around the hub.\n" +
        "Walk into the glowing cubes to enter each game.\n" +
        "Win prizes to unlock more attractions!",
      buttonLabel: "Let’s go!",
      dir: "ltr",
    },
    hi: {
      title: "मेले में आपका स्वागत है!",
      body: "W A S D से इधर-उधर चलें।\n" +
        "चमकते क्यूब्स के पास जाकर अलग-अलग खेल शुरू करें।\n" +
        "इनाम जीतकर और भी आकर्षण अनलॉक करें!",
      buttonLabel: "चलो शुरू करें!",
      dir: "ltr",
    },
    ar: {
      title: "مرحبًا بكم في مدينة الملاهي!",
      body: "استخدم W A S D للتحرك في الساحة.\n" +
        "ادخل إلى المكعبات المضيئة لبدء الألعاب.\n" +
        "اربح الجوائز لفتح المزيد من الألعاب!",
      buttonLabel: "لنبدأ!",
      dir: "rtl",
    },
  },

  2: {
    en: {
      title: "Watergun Game",
      body: "Aim at the targets and blast them with water.\n" +
        "You have limited time, so be quick and accurate!",
      buttonLabel: "Start spraying!",
      dir: "ltr",
    },
    hi: {
      title: "वॉटरगन गेम",
      body: "लक्ष्यों पर निशाना लगाएँ और पानी से उन्हें हिट करें।\n" +
        "समय सीमित है, तो जल्दी और सटीक खेलें!",
      buttonLabel: "चलो पानी चलाएँ!",
      dir: "ltr",
    },
    ar: {
      title: "لعبة مسدس الماء",
      body: "وجّه الماء نحو الأهداف وأصبها.\n" +
        "وقتك محدود، فكن سريعًا ودقيقًا!",
      buttonLabel: "ابدأ الرش!",
      dir: "rtl",
    },
  },

  3: {
    en: {
      title: "Milk Toss",
      body: "Knock down all the milk bottles!\n" +
        "Hold the mouse button to charge your throw,\n" +
        "then release to toss. You only get a few balls.",
      buttonLabel: "Start throwing!",
      dir: "ltr",
    },
    hi: {
      title: "मिल्क टॉस",
      body: "सारी दूध की बोतलें गिराने की कोशिश करें!\n" +
        "माउस बटन दबाकर थ्रो चार्ज करें,\n" +
        "फिर छोड़ें और गेंद फेंकें। आपके पास गिनती की गेंदें हैं।",
      buttonLabel: "फेंकना शुरू करें!",
      dir: "ltr",
    },
    ar: {
      title: "رمي زجاجات الحليب",
      body: "حاول إسقاط جميع زجاجات الحليب!\n" +
        "اضغط مع الاستمرار على زر الفأرة لشحن الرمية،\n" +
        "ثم حرّر لترمي. لديك عدد محدود من الكرات.",
      buttonLabel: "ابدأ الرمي!",
      dir: "rtl",
    },
  },

  4: {
    en: {
      title: "Duck Pond",
      body: "Click once to lock your cursor, then aim at a duck.\n" +
        "Click again to pick one up and see what you win!",
      buttonLabel: "Start fishing!",
      dir: "ltr",
    },
    hi: {
      title: "डक तालाब",
      body: "एक बार क्लिक करके कर्सर लॉक करें, फिर किसी बतख पर निशाना लगाएँ।\n" +
        "फिर से क्लिक करके बतख उठाएँ और देखें क्या जीते!",
      buttonLabel: "बतख पकड़ें!",
      dir: "ltr",
    },
    ar: {
      title: "بركة البط",
      body: "انقر مرة لقفل المؤشر، ثم وجّه نحو بطة.\n" +
        "انقر مرة أخرى لالتقاطها ومعرفة جائزتك!",
      buttonLabel: "ابدأ الصيد!",
      dir: "rtl",
    },
  },
};

function setupLanguageToggle() {
  // Don't add twice
  if (document.getElementById("lang-toggle")) return;

  const button = document.createElement("button");
  button.id = "lang-toggle";
  button.style.position = "absolute";
  button.style.top = "12px";
  button.style.right = "12px";
  button.style.zIndex = "10000";
  button.style.padding = "8px 14px";
  button.style.borderRadius = "999px";
  button.style.border = "none";
  button.style.fontSize = "14px";
  button.style.cursor = "pointer";
  button.style.background = "#ffdd77";
  button.style.color = "#331100";
  button.style.fontFamily = `"Impact", "Arial Black", system-ui`;
  button.style.textTransform = "uppercase";
  button.style.letterSpacing = "1px";

  const labelFor: Record<LangCode, string> = {
    en: "EN",
    hi: "हिं",
    ar: "ع",
  };

  // deno-lint-ignore prefer-const
  let langOrder: LangCode[] = ["en", "hi", "ar"];

  const applyLang = (lang: LangCode) => {
    currentLang = lang;
    button.textContent = labelFor[lang];

    // If an intro is currently open, re-render it in the new language
    if (currentIntroSceneId !== null) {
      showSceneIntro(currentIntroSceneId);
    }
  };

  button.addEventListener("click", () => {
    const idx = langOrder.indexOf(currentLang);
    const next = langOrder[(idx + 1) % langOrder.length];
    applyLang(next);
  });

  // start in English by default
  applyLang("en");

  document.body.appendChild(button);
}

function showSceneIntro(sceneId: number) {
  const perLang = sceneIntros[sceneId];
  if (!perLang) return;

  // remember what scene’s dialog is open (so we can re-render on lang change)
  currentIntroSceneId = sceneId;

  // pick the right language text, fall back to English
  const intro: SceneIntroText = perLang[currentLang] ?? perLang.en;

  // Remove any existing intro overlay
  const existing = document.getElementById("scene-intro-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "scene-intro-overlay";
  overlay.className = "result-overlay"; // reuse same overlay style as win/lose

  const container = document.createElement("div");
  container.className = "container"; // same container as win/lose

  // Title
  const titleEl = document.createElement("div");
  titleEl.className = "winText";
  titleEl.textContent = intro.title;
  titleEl.dir = intro.dir ?? (currentLang === "ar" ? "rtl" : "ltr");

  // Body
  const bodyEl = document.createElement("div");
  bodyEl.className = "dialogText";
  bodyEl.style.marginTop = "12px";
  bodyEl.style.whiteSpace = "pre-line";
  bodyEl.textContent = intro.body;
  bodyEl.dir = intro.dir ?? (currentLang === "ar" ? "rtl" : "ltr");

  // Button
  const button = document.createElement("button");
  button.className = "dialogButton";
  button.textContent = intro.buttonLabel ?? "OK";
  button.style.marginTop = "20px";
  button.style.padding = "10px 24px";
  button.style.fontSize = "18px";
  button.style.borderRadius = "999px";
  button.style.border = "none";
  button.style.cursor = "pointer";

  const closeIntro = () => {
    overlay.remove();
    currentIntroSceneId = null;
    globalThis.removeEventListener("keydown", keyHandler);
  };

  button.addEventListener("click", (e) => {
    e.stopPropagation();
    closeIntro();
  });

  const keyHandler = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      closeIntro();
    }
  };

  globalThis.addEventListener("keydown", keyHandler);

  container.appendChild(titleEl);
  container.appendChild(bodyEl);
  container.appendChild(button);
  overlay.appendChild(container);
  document.body.appendChild(overlay);
}

// Grab UI elements

document.addEventListener("DOMContentLoaded", () => {
  const invList = document.getElementById("inventory-list");
  if (!invList) {
    console.error("inventory-list element not found");
    return;
  }

  function updateInventoryUI() {
    const items = inventory.getItems();
    invList.innerHTML = "";

    for (const item of items) {
      const li = document.createElement("li");
      li.textContent = `${item.name} x${item.quantity}`;
      invList.appendChild(li);
    }
  }

  // Register UI update listener
  inventory.onChange(updateInventoryUI);
  // Optional: populate UI immediately on load
  updateInventoryUI();
  setupLanguageToggle();
});

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

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

    // 🔹 Show intro popup for this scene
    showSceneIntro(id);
    return;
  }

  if (id === 4) {
    // hide UI for old scene
    if (hasUI(currentScene) && currentScene.hideUI) {
      currentScene.hideUI();
    }

    const freshDuckPond = createDuckPondScene();
    scenes[4] = freshDuckPond;
    currentScene = freshDuckPond;

    // show UI for the new DuckPond instance
    if (hasUI(currentScene) && currentScene.showUI) {
      currentScene.showUI();
    }

    console.log("Switched to scene", id, "(fresh instance)");

    // 🔹 Show intro popup for this scene
    showSceneIntro(id);
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

  // 🔹 Show intro popup for this scene
  showSceneIntro(id);
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
// Show intro for the starting scene (hub)
showSceneIntro(1);
