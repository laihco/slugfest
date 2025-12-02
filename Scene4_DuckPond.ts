// Scene4_DuckPond.ts
import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { inventory } from "./inventory.ts";

export class Scene4_DuckPond {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: PointerLockControls;

  // Game state
  private gameOver = false;

  // Ducks
  private ducks: THREE.Object3D[] = [];
  private duckColliders: THREE.Object3D[] = [];
  private duckCount = 0;

  private ringCount = 3;

  // Base oval size (middle ring)
  private pondRadiusX = 7.5;
  private pondRadiusZ = 3.0;

  // Per-ring radii (inner → outer)
  private ringRadiiX = [5.0, 6.0, 7.5];
  private ringRadiiZ = [2.0, 2.4, 3.0];

  // Per-ring speeds (inner → outer)
  private ringSpeeds = [1.0, 0.7, 0.4];

  // Per-ring duck counts
  private ringDuckCounts = [6, 8, 10];

  // Prize odds per ring
  private ringPrizeWeights = [
    { none: 0.2, mini: 0.3, big: 0.5 }, // inner: best chance
    { none: 0.35, mini: 0.4, big: 0.25 }, // middle
    { none: 0.6, mini: 0.3, big: 0.1 }, // outer: hardest
  ];

  // Raycasting
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2(0, 0); // always center for crosshair

  // Duck pick-up animation
  private pickedDuck: THREE.Object3D | null = null;
  private pickStartTime = 0;
  private pickDuration = 0.7;
  private pickStartPos = new THREE.Vector3();

  // Result overlay / state
  private showingOverlay = false;
  private lastPickedRingIndex: number | null = null;

  // Prize Duck (for big prize only)
  private prizeDuck: THREE.Object3D | null = null;
  private lastPrizeWasBig = false;

  // Pond height / water level
  private pondHeight = 1.2;
  private waterY = 0.0;

  // Callback to go back to hub or next scene
  private onDone: () => void;

  constructor(renderer: THREE.WebGLRenderer, onDone?: () => void) {
    this.renderer = renderer;
    this.onDone = onDone ?? (() => {});

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x203050);

    // Camera – at player head height, looking at pond
    this.camera = new THREE.PerspectiveCamera(
      60,
      innerWidth / innerHeight,
      0.1,
      1000,
    );
    this.camera.position.set(0, 5, 5);
    this.camera.lookAt(0, 0.8, 0);

    // Pointer lock controls (mouse look)
    this.controls = new PointerLockControls(
      this.camera,
      this.renderer.domElement,
    );

    // First click: lock pointer. Later clicks: try to pick a duck.
    this.renderer.domElement.addEventListener("click", () => {
      if (!this.controls.isLocked) {
        this.controls.lock();
      } else {
        this.onClick();
      }
    });

    // Lights
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 10, 3);
    this.scene.add(dir);

    // Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({ color: 0x305020 }),
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    // Pond "table" – 3D raised base
    const table = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, this.pondHeight, 32),
      new THREE.MeshStandardMaterial({ color: 0xffdd99 }),
    );
    // Cylinder centered at half-height, so top is at y = pondHeight
    table.position.y = this.pondHeight / 2;
    // Stretch in X/Z to make an oval-ish podium
    table.scale.set(this.pondRadiusX * 1.1, 1, this.pondRadiusZ * 1.1);
    this.scene.add(table);

    // Water surface (oval disc) now ON TOP of the table
    const water = new THREE.Mesh(
      new THREE.CircleGeometry(1, 32),
      new THREE.MeshStandardMaterial({
        color: 0x3b7cff,
        roughness: 0.3,
        metalness: 0.1,
      }),
    );
    water.rotation.x = -Math.PI / 2;

    // Top of table is at y = pondHeight, so put water just above that
    this.waterY = this.pondHeight + 0.02;
    water.position.y = this.waterY;
    water.scale.set(this.pondRadiusX, this.pondRadiusZ, 1);
    this.scene.add(water);

    // Rim around the water so it still looks like a pond edge
    const rim = new THREE.Mesh(
      new THREE.RingGeometry(1.05, 1.3, 32),
      new THREE.MeshStandardMaterial({ color: 0xffd38a }),
    );
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = this.waterY + 0.01;
    rim.scale.set(this.pondRadiusX, this.pondRadiusZ, 1);
    this.scene.add(rim);

    // Ducks (multiple rings)
    this.spawnDucks();

    // Prize Duck (for big prize result, like Milk Toss)
    this.loadModel("/assets/models/duck.glb", (model) => {
      model.visible = false;
      model.scale.setScalar(0.1);
      this.prizeDuck = model;
      this.scene.add(model);
    });

    //load tent
    this.loadModel("/assets/models/duckTent.glb", (model) => {
      model.position.copy(rim.position);
      model.rotation.x = Math.PI;
      model.scale.setScalar(5);
      this.scene.add(model);
    });

    // UI (crosshair only, no timing bar)
    this.showUI();
  }

  // --------- MODEL LOADING ----------

  private loadModel(path: string, onLoad: (obj: THREE.Object3D) => void) {
    const loader = new GLTFLoader();
    loader.load(
      path,
      (gltf: GLTF) => {
        onLoad(gltf.scene);
      },
      undefined,
      (err: ErrorEvent | Error) => console.error("Duck GLB load error:", err),
    );
  }

  private spawnDucks() {
    for (let ring = 0; ring < this.ringCount; ring++) {
      const count = this.ringDuckCounts[ring];
      const radiusX = this.ringRadiiX[ring];
      const radiusZ = this.ringRadiiZ[ring];

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;

        this.loadModel("/assets/models/duck.glb", (model) => {
          model.traverse((child: THREE.Object3D) => {
            const mesh = child as THREE.Mesh;
            if (mesh.isMesh) {
              mesh.castShadow = true;
              mesh.receiveShadow = true;
            }
          });

          model.scale.setScalar(0.15);
          model.position.set(
            Math.cos(angle) * radiusX,
            this.waterY + 0.4,
            Math.sin(angle) * radiusZ,
          );
          model.userData = {
            baseAngle: angle,
            offset: Math.random() * Math.PI * 2,
            ringIndex: ring,
          };

          // Invisible collider sphere attached to duck
          const collider = new THREE.Mesh(
            new THREE.SphereGeometry(0.8, 8, 8),
            new THREE.MeshBasicMaterial({ visible: false }),
          );
          collider.position.set(0, 0.4, 0);
          model.add(collider);
          this.duckColliders.push(collider);

          this.scene.add(model);
          this.ducks.push(model);
        });
      }
    }
  }

  // --------------- UI ----------------

  private showUI() {
    // Crosshair like Milk Toss
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
  }

  private hideUI() {
    if (this.cursorElement && this.cursorElement.parentElement) {
      this.cursorElement.parentElement.removeChild(this.cursorElement);
    }
    this.cursorElement = null;
  }

  private cursorElement: HTMLImageElement | null = null;

  // ------------- CLICK / PICKUP -------------

  private onClick() {
    if (this.showingOverlay || this.pickedDuck) return;

    // Ray from center of screen
    this.mouse.set(0, 0);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObjects(
      this.duckColliders,
      true,
    );
    if (intersects.length === 0) return;

    // Climb up from collider to the top-level duck
    let node = intersects[0].object;
    let duck: THREE.Object3D | null = null;
    while (node) {
      if (this.ducks.includes(node)) {
        duck = node;
        break;
      }
      node = node.parent as THREE.Object3D | null;
    }
    if (!duck) return;
    this.duckCount++;

    const ringIndex = (duck.userData.ringIndex as number | undefined) ?? 1;
    this.lastPickedRingIndex = ringIndex;

    // Start pick-up animation
    this.pickedDuck = duck;
    this.pickStartTime = performance.now() / 1000;
    this.pickStartPos.copy(duck.position);
  }

  private updatePickupAnimation(timeSeconds: number) {
    if (!this.pickedDuck) return;

    const t = (timeSeconds - this.pickStartTime) / this.pickDuration;
    const clamped = THREE.MathUtils.clamp(t, 0, 1);

    // Move up and rotate to show bottom
    const yOffset = THREE.MathUtils.lerp(0, 1.4, clamped);
    this.pickedDuck.position.y = this.pickStartPos.y + yOffset;
    this.pickedDuck.rotation.x = THREE.MathUtils.lerp(0, Math.PI, clamped);
    this.pickedDuck.rotation.y += 2 * (1 / 60); // gentle spin

    if (t >= 1) {
      // Done; remove duck and show result
      this.scene.remove(this.pickedDuck);
      this.ducks = this.ducks.filter((d) => d !== this.pickedDuck);
      this.pickedDuck = null;
      this.showResultOverlay();
    }
  }

  private getPrizeMessage(): string {
    const index = this.lastPickedRingIndex ?? 1;
    const weights = this.ringPrizeWeights[index] ?? this.ringPrizeWeights[1];

    const r = Math.random();
    if (r < weights.big) return "you won the big prize!";
    if (r < weights.big + weights.mini) return "mini prize!";
    return "aw no prize";
  }

  //handle the win condition
  private handleWin() {
    if (this.gameOver) return;
    this.gameOver = true;
    console.log("[DuckPond] WIN triggered");

    this.hideUI();
    this.controls.unlock();

    // Give player duck plush
    inventory.addItem("duck-plush", "Duck Plush", 1); // <-- ADD THIS LINE

    // Position Duck in front of camera, above the text
    if (this.prizeDuck) {
      const dir = new THREE.Vector3();
      this.camera.getWorldDirection(dir);

      this.prizeDuck.position
        .copy(this.camera.position)
        .add(dir.multiplyScalar(1.5));

      this.prizeDuck.position.y += 0.4;
      this.prizeDuck.lookAt(this.camera.position);
      this.prizeDuck.visible = true;
    }

    this.injectWinLoseKeyframes();

    const winOverlay = document.createElement("div");
    winOverlay.classList.add("result-overlay");

    const container = document.createElement("div");
    container.classList.add("container");

    const text = document.createElement("div");
    text.textContent = "You Won the Big Prize!";
    text.classList.add("winText");

    container.appendChild(text);
    winOverlay.appendChild(container);
    document.body.appendChild(winOverlay);

    setTimeout(() => {
      winOverlay.remove();
      if (this.prizeDuck) this.prizeDuck.visible = false;
      this.onDone(); // safe now, non-optional
    }, 2000);
  }

  private handleLose() {
    if (this.gameOver) return;
    this.gameOver = true;
    console.log("[DuckPond] LOSE triggered");

    this.hideUI();
    this.controls.unlock();

    this.injectWinLoseKeyframes();

    const loseOverlay = document.createElement("div");
    loseOverlay.classList.add("result-overlay");

    const container = document.createElement("div");
    container.classList.add("container");

    const text = document.createElement("div");
    text.textContent = "YOU LOSE!";
    text.classList.add("loseText");

    container.appendChild(text);
    loseOverlay.appendChild(container);
    document.body.appendChild(loseOverlay);

    setTimeout(() => {
      loseOverlay.remove();
      this.onDone(); // use same callback to return to hub
    }, 2000);
  }

  private injectWinLoseKeyframes() {
    if (document.getElementById("result-pop-style")) return;
    const style = document.createElement("style");
    style.id = "result-pop-style";
    style.textContent = `
      @keyframes result-pop-forward {
        0% {
          transform: translate3d(0, 0, -200px) scale(0.4) rotateX(15deg);
          opacity: 0;
        }
        60% {
          transform: translate3d(0, 0, 40px) scale(1.25) rotateX(0deg);
          opacity: 1;
        }
        100% {
          transform: translate3d(0, 0, 0) scale(1.1) rotateX(0deg);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  private showResultOverlay() {
    this.showingOverlay = true;
    this.hideUI();
    this.controls.unlock();

    const message = this.getPrizeMessage();
    this.lastPrizeWasBig = message === "you won the big prize!";

    if (this.lastPrizeWasBig || this.duckCount >= 3) {
      return;
    }

    const overlay = document.createElement("div");
    overlay.id = "duckpond-result-overlay";
    overlay.style.position = "absolute";
    overlay.style.inset = "0";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
    overlay.style.zIndex = "9999";
    overlay.style.cursor = "pointer";

    const box = document.createElement("div");
    box.style.padding = "24px 40px";
    box.style.borderRadius = "16px";
    box.style.backgroundColor = "#ffdd77";
    box.style.boxShadow = "0 0 20px rgba(0,0,0,0.6)";
    box.style.fontFamily = `"Impact", "Arial Black", system-ui`;
    box.style.fontSize = "48px";
    box.style.textTransform = "uppercase";
    box.style.letterSpacing = "4px";
    box.style.textAlign = "center";
    box.style.color = "#331100";
    box.textContent = message;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const closeOverlay = () => {
      overlay.remove();
      this.showingOverlay = false;

      if (this.ducks.length === 0) {
        this.onDone();
      } else {
        this.showUI();
      }
    };

    overlay.addEventListener("click", closeOverlay);
    setTimeout(closeOverlay, 2200);
  }

  // ------------- UPDATE LOOP -------------

  update(delta: number) {
    const now = performance.now() / 1000;

    // Ducks orbiting multiple ovals
    // Freeze them while a duck is being picked OR while result overlay is up
    if (!this.pickedDuck && !this.showingOverlay) {
      this.ducks.forEach((duck) => {
        const baseAngle = duck.userData.baseAngle as number;
        const offset = duck.userData.offset as number;
        const ringIndex = duck.userData.ringIndex as number;
        const speed = this.ringSpeeds[ringIndex] ?? this.ringSpeeds[1];
        const radiusX = this.ringRadiiX[ringIndex] ?? this.pondRadiusX;
        const radiusZ = this.ringRadiiZ[ringIndex] ?? this.pondRadiusZ;

        const angle = baseAngle +
          speed * now +
          0.2 * Math.sin(now * 1.3 + offset);

        duck.position.x = Math.cos(angle) * radiusX;
        duck.position.z = Math.sin(angle) * radiusZ;

        duck.rotation.y = -angle + Math.PI / 2;
      });
    }

    // Pick-up animation
    if (this.pickedDuck) {
      this.updatePickupAnimation(now);
    }

    //------ Check the Win and Lose Condition -------
    if (this.lastPrizeWasBig) {
      this.handleWin();
    } else if (this.duckCount >= 3) {
      this.handleLose();
    }

    // Spin prize Duck while visible (big prize only)
    if (
      this.gameOver && this.lastPrizeWasBig && this.prizeDuck &&
      this.prizeDuck.visible
    ) {
      this.prizeDuck.rotation.y += 2 * delta;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
