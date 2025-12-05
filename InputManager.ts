// InputManager.ts
export interface PointerInfo {
  // Raw client coordinates (relative to viewport)
  clientX: number;
  clientY: number;

  // Coordinates relative to the canvas (pixels)
  x: number;
  y: number;

  // Normalized device coordinates for three.js raycasting
  ndcX: number;
  ndcY: number;

  // "mouse", "touch", or "pen"
  pointerType: string;

  originalEvent: PointerEvent;
}

type PointerListener = (info: PointerInfo) => void;

class InputManager {
  private canvas: HTMLCanvasElement;

  private downListeners: PointerListener[] = [];
  private upListeners: PointerListener[] = [];
  private moveListeners: PointerListener[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupListeners();
  }

  private setupListeners() {
    this.canvas.addEventListener(
      "pointerdown",
      (e) => this.handlePointerDown(e),
    );
    this.canvas.addEventListener("pointerup", (e) => this.handlePointerUp(e));
    this.canvas.addEventListener(
      "pointermove",
      (e) => this.handlePointerMove(e),
    );

    // Optional: avoid default right-click menu on canvas
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  private makeInfo(e: PointerEvent): PointerInfo {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ndcX = (x / rect.width) * 2 - 1;
    const ndcY = -(y / rect.height) * 2 + 1;

    return {
      clientX: e.clientX,
      clientY: e.clientY,
      x,
      y,
      ndcX,
      ndcY,
      pointerType: e.pointerType,
      originalEvent: e,
    };
  }

  private handlePointerDown(e: PointerEvent) {
    if (e.button !== 0) return; // only left / primary
    const info = this.makeInfo(e);
    this.downListeners.forEach((cb) => cb(info));
    // Capture pointer during drags
    this.canvas.setPointerCapture(e.pointerId);
  }

  private handlePointerUp(e: PointerEvent) {
    if (e.button !== 0) return;
    const info = this.makeInfo(e);
    this.upListeners.forEach((cb) => cb(info));
    this.canvas.releasePointerCapture(e.pointerId);
  }

  private handlePointerMove(e: PointerEvent) {
    const info = this.makeInfo(e);
    this.moveListeners.forEach((cb) => cb(info));
  }

  onPointerDown(cb: PointerListener) {
    this.downListeners.push(cb);
  }

  onPointerUp(cb: PointerListener) {
    this.upListeners.push(cb);
  }

  onPointerMove(cb: PointerListener) {
    this.moveListeners.push(cb);
  }
}

// --- singleton-style helpers ---

let instance: InputManager | null = null;

export function initInputManager(canvas: HTMLCanvasElement): InputManager {
  if (!instance) {
    instance = new InputManager(canvas);
  }
  return instance;
}

export function getInputManager(): InputManager {
  if (!instance) {
    throw new Error(
      "InputManager not initialized. Call initInputManager() first.",
    );
  }
  return instance;
}
