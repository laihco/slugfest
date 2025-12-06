import { inventory, InventoryItem } from "./inventory.ts";

type SceneWithPlayer = {
  __sceneId?: number;
  player?: {
    position?: {
      x: number;
      y: number;
      z: number;
      set?: (x: number, y: number, z: number) => void;
    };
    rotation?: { y?: number };
  };
};

export interface SavedGame {
  sceneId: number;
  playerPosition?: { x: number; y: number; z: number } | null;
  playerRotationY?: number | null;
  inventory: InventoryItem[];
  timestamp: number;
  name: string | undefined;
}

export class SaveManager {
  private saveKey = "slugfest_save_simple";
  private autosaveKey = "slugfest_autosave_simple";
  private autosaveEnabled = true;
  private autosaveInterval = 15000;
  private autosaveTimerId: number | null = null;

  // callbacks from the app to avoid importing main.ts
  private getCurrentSceneFn: () => unknown = () => ({} as unknown);
  private switchSceneFn: (id: number) => void = () => {};

  constructor(
    opts?: {
      getCurrentScene?: () => unknown;
      switchScene?: (id: number) => void;
      autosaveIntervalMs?: number;
    },
  ) {
    if (opts?.getCurrentScene) this.getCurrentSceneFn = opts.getCurrentScene;
    if (opts?.switchScene) this.switchSceneFn = opts.switchScene;
    if (opts?.autosaveIntervalMs) {
      this.autosaveInterval = opts.autosaveIntervalMs;
    }
    this.startAutosave();
  }

  save(name?: string) {
    const current = this.getCurrentSceneFn();
    type SceneWithPlayer = {
      __sceneId?: number;
      player?: {
        position?: {
          x: number;
          y: number;
          z: number;
          set?: (x: number, y: number, z: number) => void;
        };
        rotation?: { y?: number };
      };
    };
    const sceneTyped = current as SceneWithPlayer;
    const sceneId = sceneTyped.__sceneId ?? 1;

    const payload: SavedGame = {
      sceneId,
      inventory: inventory.getItems(),
      timestamp: Date.now(),
      name: name as string | undefined,
    };

    // Basic hub player position if available
    if (sceneTyped.player && sceneTyped.player.position) {
      payload.playerPosition = {
        x: sceneTyped.player.position.x,
        y: sceneTyped.player.position.y,
        z: sceneTyped.player.position.z,
      };
      payload.playerRotationY = sceneTyped.player.rotation?.y ?? 0;
    }

    localStorage.setItem(this.saveKey, JSON.stringify(payload));
    return payload;
  }

  load() {
    const raw = localStorage.getItem(this.saveKey);
    if (!raw) throw new Error("No save available");
    const payload = JSON.parse(raw) as SavedGame;

    // Restore inventory: clear then add
    const currentItems = inventory.getItems();
    for (const it of currentItems) {
      while (inventory.hasItem(it.id, 1)) inventory.removeItem(it.id, 1);
    }
    for (const it of payload.inventory) {
      inventory.addItem(it.id, it.name, it.quantity);
    }

    // Switch scene if needed
    const currentAfter = this.getCurrentSceneFn() as SceneWithPlayer;
    if (payload.sceneId !== currentAfter.__sceneId) {
      this.switchSceneFn(payload.sceneId);
    }

    // Apply hub position if present and we're in hub
    const scene = this.getCurrentSceneFn() as SceneWithPlayer;
    if (
      payload.playerPosition && scene.player && scene.player.position &&
      scene.player.position.set
    ) {
      const p = payload.playerPosition;
      scene.player.position.set(p.x, p.y, p.z);
      if (
        typeof payload.playerRotationY === "number" && scene.player.rotation
      ) scene.player.rotation.y = payload.playerRotationY;
    }

    return payload;
  }

  delete() {
    localStorage.removeItem(this.saveKey);
  }

  setAutosave(enabled: boolean) {
    this.autosaveEnabled = enabled;
    if (enabled) this.startAutosave();
    else this.stopAutosave();
  }

  private startAutosave() {
    if (!this.autosaveEnabled) return;
    if (this.autosaveTimerId) globalThis.clearInterval(this.autosaveTimerId);
    this.autosaveTimerId = globalThis.setInterval(
      () => this.performAutosave(),
      this.autosaveInterval,
    ) as unknown as number;
  }

  private stopAutosave() {
    if (this.autosaveTimerId) {
      globalThis.clearInterval(this.autosaveTimerId);
      this.autosaveTimerId = null;
    }
  }

  private performAutosave() {
    try {
      const payload = this.save("Autosave");
      localStorage.setItem(this.autosaveKey, JSON.stringify(payload));
    } catch (e) {
      console.error("Autosave failed", e);
    }
  }

  loadAutosave() {
    const raw = localStorage.getItem(this.autosaveKey);
    if (!raw) throw new Error("No autosave available");
    const payload = JSON.parse(raw) as SavedGame;
    // write into main save slot and then load
    localStorage.setItem(this.saveKey, JSON.stringify(payload));
    return this.load();
  }
}

export function createSaveUI(manager: SaveManager) {
  const panel = document.createElement("div");
  panel.id = "save-panel";
  panel.style.position = "absolute";
  panel.style.top = "12px";
  panel.style.left = "12px";
  panel.style.background = "rgba(0,0,0,0.6)";
  panel.style.color = "white";
  panel.style.padding = "8px";
  panel.style.borderRadius = "8px";
  panel.style.fontFamily = "sans-serif";
  panel.style.zIndex = "9999";

  const title = document.createElement("div");
  title.textContent = "Save";
  title.style.fontWeight = "700";
  title.style.marginBottom = "6px";
  panel.appendChild(title);

  const row = document.createElement("div");
  row.style.display = "flex";
  row.style.gap = "6px";
  row.style.alignItems = "center";

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Save";
  saveBtn.onclick = () => {
    manager.save();
    alert("Saved.");
  };
  row.appendChild(saveBtn);

  const loadBtn = document.createElement("button");
  loadBtn.textContent = "Load";
  loadBtn.onclick = () => {
    try {
      manager.load();
      alert("Loaded save.");
    } catch (e) {
      alert(String(e));
    }
  };
  row.appendChild(loadBtn);

  const loadAutoBtn = document.createElement("button");
  loadAutoBtn.textContent = "Load Autosave";
  loadAutoBtn.onclick = () => {
    try {
      manager.loadAutosave();
      alert("Loaded autosave.");
    } catch (e) {
      alert(String(e));
    }
  };
  row.appendChild(loadAutoBtn);

  const delBtn = document.createElement("button");
  delBtn.textContent = "Delete";
  delBtn.onclick = () => {
    if (confirm("Delete save?")) {
      manager.delete();
      alert("Deleted.");
    }
  };
  row.appendChild(delBtn);

  panel.appendChild(row);

  const autoRow = document.createElement("div");
  autoRow.style.marginTop = "6px";
  const autoLabel = document.createElement("label");
  autoLabel.textContent = "Autosave";
  autoRow.appendChild(autoLabel);
  const autoCheckbox = document.createElement("input");
  autoCheckbox.type = "checkbox";
  autoCheckbox.checked = true;
  autoCheckbox.onchange = () => manager.setAutosave(autoCheckbox.checked);
  autoRow.appendChild(autoCheckbox);
  panel.appendChild(autoRow);

  document.body.appendChild(panel);
  return panel;
}
