import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export class Scene3_MilkToss {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: PointerLockControls;
  renderer: THREE.WebGLRenderer;

  // UI Elements
  cursorElement: HTMLImageElement | null = null;
  meterElement: HTMLDivElement | null = null;
  meterFillElement: HTMLDivElement | null = null;
  meterValue = 0; // 0 to 1

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;

    // -------------------------
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x331144);

    // -------------------------
    // Camera - First Person
    this.camera = new THREE.PerspectiveCamera(
      75,
      innerWidth / innerHeight,
      0.1,
      1000,
    );
    this.camera.position.set(0, 1.7, 0); // Player eye height

    // -------------------------
    // Controls
    this.controls = new PointerLockControls(
      this.camera,
      this.renderer.domElement,
    );

    // Enable pointer lock on click
    this.renderer.domElement.addEventListener("click", () => {
      this.controls.lock();
    });

    // -------------------------
    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      new THREE.MeshStandardMaterial({ color: 0x224422 }),
    );
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    // -------------------------
    // Lights
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(5, 10, 5);
    this.scene.add(dir);

    // -------------------------
    // Cube (placeholder)
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 2, 1),
      new THREE.MeshStandardMaterial({ color: 0xffffff }),
    );
    cube.position.set(2, 1, -3);
    this.scene.add(cube);

    // -------------------------
    // Show UI (crosshair + meter) immediately
    this.showUI();
  }

  // -------------------------
  // Load GLB model
  loadModel(path: string) {
    const loader = new GLTFLoader();
    loader.load(
      path,
      (gltf: GLTF) => {
        const model = gltf.scene;
        model.position.set(0, 0, 0);
        this.scene.add(model);
      },
      undefined,
      (err: ErrorEvent | Error) => console.error("GLB Load Error:", err),
    );
  }

  // -------------------------
  showUI() {
    if (!this.cursorElement) {
      this.cursorElement = document.createElement("img");
      this.cursorElement.src = "/assets/crosshair.png";
      this.cursorElement.style.position = "absolute";
      this.cursorElement.style.top = "50%";
      this.cursorElement.style.left = "50%";
      this.cursorElement.style.transform = "translate(-50%, -50%)";
      this.cursorElement.style.pointerEvents = "none";
      this.cursorElement.style.width = "32px";
      this.cursorElement.style.height = "32px";
      document.body.appendChild(this.cursorElement);
    }

    if (!this.meterElement) {
      this.meterElement = document.createElement("div");
      this.meterElement.style.position = "absolute";
      this.meterElement.style.bottom = "20px";
      this.meterElement.style.left = "50%";
      this.meterElement.style.transform = "translateX(-50%)";
      this.meterElement.style.width = "200px";
      this.meterElement.style.height = "20px";
      this.meterElement.style.border = "2px solid white";
      this.meterElement.style.backgroundColor = "#000";
      document.body.appendChild(this.meterElement);

      this.meterFillElement = document.createElement("div");
      this.meterFillElement.style.width = "0%";
      this.meterFillElement.style.height = "100%";
      this.meterFillElement.style.backgroundColor = "lime";
      this.meterElement.appendChild(this.meterFillElement);
    }
  }

  // -------------------------
  hideUI() {
    if (this.cursorElement) {
      document.body.removeChild(this.cursorElement);
      this.cursorElement = null;
    }
    if (this.meterElement) {
      document.body.removeChild(this.meterElement);
      this.meterElement = null;
      this.meterFillElement = null;
    }
  }

  // -------------------------
  update(delta: number) {
    // Update force meter for demo
    if (this.meterFillElement) {
      this.meterValue += delta * 0.2; // fills over ~5 seconds
      if (this.meterValue > 1) this.meterValue = 1;
      this.meterFillElement.style.width = `${this.meterValue * 100}%`;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
