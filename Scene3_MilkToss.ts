import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

interface BallData {
  velocity: THREE.Vector3;
}

interface BottleData {
  broken: boolean;
  velocity: THREE.Vector3 | null;
  supports?: THREE.Object3D[];
}

export class Scene3_MilkToss {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: PointerLockControls;
  renderer: THREE.WebGLRenderer;

  // UI
  cursorElement: HTMLImageElement | null = null;
  meterElement: HTMLDivElement | null = null;
  meterFillElement: HTMLDivElement | null = null;
  meterValue = 0;

  // Balls-left UI
  ballsLeftElement: HTMLDivElement | null = null;

  // Throwing
  charging = false;
  balls: THREE.Mesh[] = [];
  bottles: THREE.Object3D[] = [];

  // Attempts
  private maxBalls = 4;
  private ballsThrown = 0;

  // Game state
  private hasWon = false;
  private gameOver = false;
  private onWin?: () => void;

  // Prize fox model
  private prizeFox: THREE.Object3D | null = null;

  constructor(renderer: THREE.WebGLRenderer, onWin?: () => void) {
    this.renderer = renderer;
    this.onWin = onWin;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x331144);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      innerWidth / innerHeight,
      0.1,
      1000,
    );
    this.camera.position.set(0, 1.7, 0);

    // Controls
    this.controls = new PointerLockControls(
      this.camera,
      this.renderer.domElement,
    );
    this.renderer.domElement.addEventListener(
      "click",
      () => this.controls.lock(),
    );

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      new THREE.MeshStandardMaterial({ color: 0x224422 }),
    );
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    // Lights
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(5, 10, 5);
    this.scene.add(dir);

    // Cube for pyramid base
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1, 3),
      new THREE.MeshStandardMaterial({ color: 0xffffff }),
    );
    cube.position.set(0, 0.5, -5);
    this.scene.add(cube);

    // Load pyramid bottles
    this.loadBottles(cube.position.clone());

    // Load prize fox model (hidden until win)
    this.loadModel("/assets/models/fox_toy.glb", (model) => {
      model.visible = false;
      model.scale.setScalar(0.6);
      this.prizeFox = model;
      this.scene.add(model);
    });

    // UI
    //this.showUI();

    // Mouse events
    this.renderer.domElement.addEventListener(
      "mousedown",
      () => this.startCharging(),
    );
    this.renderer.domElement.addEventListener(
      "mouseup",
      () => this.throwBall(),
    );
  }

  // ------------- WIN / LOSE ---------------

  private handleWin() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.hasWon = true;
    console.log("[MilkToss] WIN triggered");

    this.hideUI();
    this.controls.unlock();

    // Position fox in front of camera, above the text
    if (this.prizeFox) {
      const dir = new THREE.Vector3();
      this.camera.getWorldDirection(dir);

      this.prizeFox.position
        .copy(this.camera.position)
        .add(dir.multiplyScalar(1.5));

      this.prizeFox.position.y += 0.6;
      this.prizeFox.lookAt(this.camera.position);
      this.prizeFox.visible = true;
    }

    this.injectWinLoseKeyframes();

    const winOverlay = document.createElement("div");
    winOverlay.id = "result-overlay";
    winOverlay.style.position = "absolute";
    winOverlay.style.inset = "0";
    winOverlay.style.display = "flex";
    winOverlay.style.alignItems = "center";
    winOverlay.style.justifyContent = "center";
    winOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
    winOverlay.style.zIndex = "9999";

    const container = document.createElement("div");
    container.style.perspective = "800px";
    container.style.transformStyle = "preserve-3d";

    const text = document.createElement("div");
    text.textContent = "YOU WIN!";
    text.style.fontFamily = `"Impact", "Arial Black", system-ui`;
    text.style.fontSize = "80px";
    text.style.padding = "16px 40px";
    text.style.color = "#ffdd00";
    text.style.letterSpacing = "6px";
    text.style.textShadow =
      "0 0 8px #000, 4px 4px 0 #a00000, -2px -2px 0 #a00000";
    text.style.borderRadius = "10px";
    text.style.border = "4px solid #a00000";
    text.style.boxShadow = "0 0 25px rgba(0,0,0,0.8)";
    text.style.transformOrigin = "center";
    text.style.animation =
      "result-pop-forward 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards";

    container.appendChild(text);
    winOverlay.appendChild(container);
    document.body.appendChild(winOverlay);

    setTimeout(() => {
      winOverlay.remove();
      if (this.prizeFox) this.prizeFox.visible = false;
      this.onWin?.();
    }, 2000);
  }

  private handleLose() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.hasWon = false;
    console.log("[MilkToss] LOSE triggered");

    this.hideUI();
    this.controls.unlock();

    this.injectWinLoseKeyframes();

    const loseOverlay = document.createElement("div");
    loseOverlay.id = "result-overlay";
    loseOverlay.style.position = "absolute";
    loseOverlay.style.inset = "0";
    loseOverlay.style.display = "flex";
    loseOverlay.style.alignItems = "center";
    loseOverlay.style.justifyContent = "center";
    loseOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
    loseOverlay.style.zIndex = "9999";

    const container = document.createElement("div");
    container.style.perspective = "800px";
    container.style.transformStyle = "preserve-3d";

    const text = document.createElement("div");
    text.textContent = "YOU LOSE!";
    text.style.fontFamily = `"Impact", "Arial Black", system-ui`;
    text.style.fontSize = "80px";
    text.style.padding = "16px 40px";
    text.style.color = "#ff5555";
    text.style.letterSpacing = "6px";
    text.style.textShadow =
      "0 0 8px #000, 4px 4px 0 #5a0000, -2px -2px 0 #5a0000";
    text.style.borderRadius = "10px";
    text.style.border = "4px solid #5a0000";
    text.style.boxShadow = "0 0 25px rgba(0,0,0,0.8)";
    text.style.transformOrigin = "center";
    text.style.animation =
      "result-pop-forward 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards";

    container.appendChild(text);
    loseOverlay.appendChild(container);
    document.body.appendChild(loseOverlay);

    setTimeout(() => {
      loseOverlay.remove();
      this.onWin?.(); // same callback: go back to hub
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

  // ------------- LOADING ---------------

  loadModel(path: string, onLoad: (model: THREE.Object3D) => void) {
    const loader = new GLTFLoader();
    loader.load(
      path,
      (gltf: GLTF) => onLoad(gltf.scene),
      undefined,
      (err: ErrorEvent | Error) => console.error("GLB Load Error:", err),
    );
  }

  loadBottles(basePosition: THREE.Vector3) {
    const initialScale = 0.2;
    const spacing = 0.6;

    const pyramidOffsets = [
      [-spacing, 0.75, 0],
      [0, 0.75, 0],
      [spacing, 0.75, 0],
      [-spacing / 2, 0.75 + 0.65, 0],
      [spacing / 2, 0.75 + 0.65, 0],
      [0, 0.75 + 0.65 + 0.65, 0],
    ];

    const supportsMap = [
      [],
      [],
      [],
      [0, 1],
      [1, 2],
      [3, 4],
    ];

    pyramidOffsets.forEach((offset, index) => {
      this.loadModel("/assets/models/bottle.glb", (model) => {
        model.position.set(
          basePosition.x + offset[0],
          basePosition.y + offset[1],
          basePosition.z + offset[2],
        );
        model.scale.setScalar(initialScale);
        model.userData = {
          broken: false,
          velocity: null,
          supports: supportsMap[index].map((i) => this.bottles[i]),
        } as BottleData;
        this.scene.add(model);
        this.bottles.push(model);
      });
    });
  }

  // ------------- UI ---------------

  private updateBallsUI() {
    if (!this.ballsLeftElement) return;
    const left = Math.max(this.maxBalls - this.ballsThrown, 0);
    this.ballsLeftElement.textContent = `Balls left: ${left}`;
  }

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

    if (!this.ballsLeftElement) {
      this.ballsLeftElement = document.createElement("div");
      this.ballsLeftElement.style.position = "absolute";
      this.ballsLeftElement.style.top = "20px";
      this.ballsLeftElement.style.left = "50%";
      this.ballsLeftElement.style.transform = "translateX(-50%)";
      this.ballsLeftElement.style.color = "white";
      this.ballsLeftElement.style.fontFamily = "sans-serif";
      this.ballsLeftElement.style.fontSize = "20px";
      this.ballsLeftElement.style.textShadow = "0 0 4px black";
      document.body.appendChild(this.ballsLeftElement);
    }

    this.updateBallsUI();
  }

  hideUI() {
    if (this.cursorElement && this.cursorElement.parentElement) {
      this.cursorElement.parentElement.removeChild(this.cursorElement);
    }
    if (this.meterElement && this.meterElement.parentElement) {
      this.meterElement.parentElement.removeChild(this.meterElement);
    }
    if (this.ballsLeftElement && this.ballsLeftElement.parentElement) {
      this.ballsLeftElement.parentElement.removeChild(this.ballsLeftElement);
    }
    this.cursorElement = null;
    this.meterElement = null;
    this.meterFillElement = null;
    this.ballsLeftElement = null;
  }

  // ------------- THROWING ---------------

  startCharging() {
    if (this.gameOver) return;
    this.charging = true;
  }

  throwBall() {
    if (!this.charging || this.gameOver) return;

    const minCharge = 0.05;
    if (this.meterValue < minCharge) {
      this.charging = false;
      this.meterValue = 0;
      if (this.meterFillElement) this.meterFillElement.style.width = "0%";
      return;
    }

    // No more balls?
    if (this.ballsThrown >= this.maxBalls) {
      this.charging = false;
      return;
    }

    this.charging = false;

    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffdd00 }),
    );

    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);
    ball.position.copy(this.camera.position).add(
      camDir.clone().multiplyScalar(1),
    );

    const speed = THREE.MathUtils.lerp(5, 20, this.meterValue);
    (ball.userData as BallData).velocity = camDir.clone().multiplyScalar(speed);

    this.scene.add(ball);
    this.balls.push(ball);

    this.ballsThrown++;
    this.updateBallsUI();

    this.meterValue = 0;
    if (this.meterFillElement) this.meterFillElement.style.width = "0%";
  }

  // ------------- UPDATE LOOP ---------------

  update(delta: number) {
    // Update charge meter
    if (this.charging) {
      this.meterValue += delta * 0.5;
      if (this.meterValue > 1) this.meterValue = 1;
      if (this.meterFillElement) {
        this.meterFillElement.style.width = `${this.meterValue * 100}%`;
      }
    }

    // Update balls
    this.balls.forEach((ball) => {
      const velocity = (ball.userData as BallData).velocity;
      velocity.y += -9.8 * delta;
      ball.position.addScaledVector(velocity, delta);

      // Ball hits bottle
      this.bottles.forEach((bottle) => {
        const data = bottle.userData as BottleData;
        if (!data.broken) {
          const distance = ball.position.distanceTo(bottle.position);
          if (distance < 0.5) {
            data.broken = true;
            data.velocity = new THREE.Vector3(
              (Math.random() - 0.5) * 2,
              Math.random() * 2 + 1,
              (Math.random() - 0.5) * 2,
            );
          }
        }
      });

      if (ball.position.y < 0) this.scene.remove(ball);
    });
    this.balls = this.balls.filter((b) => b.position.y >= 0);

    // Update bottles with gravity & support check
    this.bottles.forEach((bottle) => {
      const data = bottle.userData as BottleData;

      if (!data.broken && data.supports && data.supports.length > 0) {
        const allBroken = data.supports.every((s) =>
          (s.userData as BottleData).broken
        );
        if (allBroken) {
          data.broken = true;
          data.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 1.5,
            Math.random() * 2 + 1,
            (Math.random() - 0.5) * 1.5,
          );
        }
      }

      if (data.broken && data.velocity) {
        data.velocity.y += -9.8 * delta;
        bottle.position.addScaledVector(data.velocity, delta);

        if (bottle.position.y < 0.1) {
          bottle.position.y = 0.1;
          data.velocity.set(0, 0, 0);
        }
      }
    });

    // Check win & lose conditions
    let allDown = false;

    if (!this.gameOver && this.bottles.length > 0) {
      allDown = this.bottles.every((bottle) => {
        const data = bottle.userData as BottleData;
        const onGround = bottle.position.y <= 0.11;
        return data.broken && onGround;
      });

      if (allDown) {
        this.handleWin();
      }
    }

    if (
      !this.gameOver &&
      this.ballsThrown >= this.maxBalls &&
      this.balls.length === 0 &&
      !allDown
    ) {
      this.handleLose();
    }

    // Spin prize fox while in win state
    if (this.gameOver && this.hasWon && this.prizeFox && this.prizeFox.visible) {
      this.prizeFox.rotation.y += 2 * delta;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
