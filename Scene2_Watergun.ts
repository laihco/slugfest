// scene2_Watergun.ts
import * as THREE from "https://esm.sh/three@0.172.0";
import type { GLTF } from "https://esm.sh/three@0.172.0/examples/jsm/loaders/GLTFLoader.js";
import { GLTFLoader } from "https://esm.sh/three@0.172.0/examples/jsm/loaders/GLTFLoader.js";

export class Scene2_Watergun {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;

  // Player rig (used for yaw rotation)
  private rig: THREE.Object3D;

  // Stand model
  stand?: THREE.Group;

  // Simple mouse-look state
  private yaw = 0;
  private pitch = 0;

  // -----------------------------
  // WATER / SPRAY SYSTEM
  // -----------------------------
  private readonly maxWater = 100;
  private currentWater = this.maxWater;

  // -----------------------------
  // PARTICLE WATER JET
  // -----------------------------
  private particleSystem: THREE.Points | null = null;
  private particleGeometry: THREE.BufferGeometry | null = null;
  private particlePositions: Float32Array | null = null;
  private particleVelocities: Float32Array | null = null;
  private particleLifetimes: Float32Array | null = null;
  private particleAges: Float32Array | null = null;
  private readonly maxParticles = 500;
  private nextParticleIndex = 0;

  // Raycasting & spray state
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2(0, 0); // center of screen
  private spraying = false;

  // Visual beam
  private waterBeam: THREE.Mesh | null = null;

  // Spray tuning
  private readonly maxSprayDistance = 25;
  private readonly sprayTick = 0.03; // hit logic interval (s)
  private sprayTimer = 0;
  private readonly waterDrainRate = 25; // water units / second

  // Potential targets the spray can hit
  private targets: THREE.Object3D[] = [];

  // Game state
  private gameOver = false;
  private hasWon = false;
  private onFinish: () => void;

  // UI
  private crosshair: HTMLDivElement | null = null;
  private waterBarContainer: HTMLDivElement | null = null;
  private waterBarFill: HTMLDivElement | null = null;
  private waterText: HTMLDivElement | null = null;

  constructor(renderer: THREE.WebGLRenderer, onFinish?: () => void) {
    this.renderer = renderer;
    this.onFinish = onFinish ?? (() => {});

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x113355);

    // Camera & rig (player stand-in)
    this.camera = new THREE.PerspectiveCamera(
      60,
      innerWidth / innerHeight,
      0.1,
      1000,
    );

    this.rig = new THREE.Object3D();
    // Move the player farther back from the stand
    this.rig.position.set(0, 5, 20);
    this.scene.add(this.rig);

    // Put camera at eye height on the rig, looking toward -Z by default
    this.rig.add(this.camera);
    this.camera.position.set(0, 0, 0);
    this.camera.rotation.set(0, 0, 0);

    // Lights
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(5, 10, 5);
    dir.castShadow = true;
    this.scene.add(dir);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({ color: 0x224422 }),
    );
    floor.rotation.x = -Math.PI / 2; // lay it flat
    floor.position.y = -2; // tuck it under the booth; tweak if needed
    this.scene.add(floor);

    // Load the Blender stand
    this.loadWatergunStand("/assets/models/WatergunStand.glb");

    // Tent around the stand
    this.loadModel("/assets/models/milkTent.glb", (tent) => {
      // Same settings as Scene3
      tent.position.set(0, -3, -3); // same origin as the stand
      tent.rotation.x = Math.PI; // flip because of Blender orientation
      tent.scale.setScalar(15); // big enough to surround everything
      this.scene.add(tent);
    });

    // Create water beam
    this.initWaterBeam();
    // Create simple particle system for water jet
    this.initParticles();

    // Input & UI
    this.setupInput();
    this.showUI();
    this.injectResultKeyframes();
    this.updateWaterUI();

    // Apply initial yaw/pitch to camera
    this.updateCameraRotation();
  }

  // -------------------------------------------------
  // MODEL LOADING
  // -------------------------------------------------

  private loadModel(path: string, onLoad: (model: THREE.Object3D) => void) {
    const loader = new GLTFLoader();
    loader.load(
      path,
      (gltf: GLTF) => {
        onLoad(gltf.scene);
      },
      undefined,
      (err: unknown) => {
        console.error("GLB Load Error:", err);
      },
    );
  }

  private loadWatergunStand(path: string) {
    const loader = new GLTFLoader();
    loader.load(
      path,
      (gltf: GLTF) => {
        const model = gltf.scene;
        this.stand = model as THREE.Group;

        model.position.set(0, 0, 0);
        model.scale.setScalar(1);

        model.traverse((child: THREE.Object3D) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }

          // Example target selection:
          // Replace the condition with the actual names/userData from your GLB.
          if (child.name.toLowerCase().includes("target")) {
            this.targets.push(child);
          }
        });

        this.scene.add(model);
      },
      undefined,
      (err: unknown) => {
        console.error("Error loading WatergunStand.glb:", err);
      },
    );
  }

  // -------------------------------------------------
  // WATER BEAM SETUP
  // -------------------------------------------------
  private initWaterBeam() {
    const geom = new THREE.BoxGeometry(1, 1, 6); // big box
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff00ff, // bright magenta
      transparent: false,
    });

    this.waterBeam = new THREE.Mesh(geom, mat);
    this.waterBeam.visible = false;
    this.scene.add(this.waterBeam);
  }

  private initParticles() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxParticles * 3);

    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );

    const material = new THREE.PointsMaterial({
      color: 0x55cfff,
      size: 0.06, // was 0.25 – much smaller
      sizeAttenuation: true, // shrink with distance (default, but explicit)
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    this.scene.add(points);

    this.particleSystem = points;
    this.particleGeometry = geometry;
    this.particlePositions = positions;
    this.particleVelocities = new Float32Array(this.maxParticles * 3);
    this.particleLifetimes = new Float32Array(this.maxParticles);
    this.particleAges = new Float32Array(this.maxParticles);
  }

  // -------------------------------------------------
  // INPUT (pointer lock + mouse look + shooting)
  // -------------------------------------------------
  private setupInput() {
    const canvas = this.renderer.domElement;

    // Pointer lock on click
    canvas.addEventListener("click", () => {
      canvas.requestPointerLock();
    });

    // Mouse look
    document.addEventListener("mousemove", (e: MouseEvent) => {
      if (document.pointerLockElement !== canvas) return;

      const movementX = e.movementX || 0;
      const movementY = e.movementY || 0;

      const sensitivity = 0.0025;
      this.yaw -= movementX * sensitivity;
      this.pitch -= movementY * sensitivity;

      const maxPitch = Math.PI / 3; // limit looking up/down
      this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

      this.updateCameraRotation();
    });

    // Start / stop spraying with left mouse button
    document.addEventListener("mousedown", (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (document.pointerLockElement !== canvas) return;
      if (this.gameOver) return;

      this.spraying = true;
    });

    document.addEventListener("mouseup", (e: MouseEvent) => {
      if (e.button !== 0) return;
      this.spraying = false;
      if (this.waterBeam) this.waterBeam.visible = false;
    });
  }

  private updateCameraRotation() {
    // Yaw on rig, pitch on camera (FPS-style)
    this.rig.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  // -------------------------------------------------
  // MAIN UPDATE LOOP
  // Call this from your game loop with deltaTime (seconds)
  // -------------------------------------------------
  public update(dt: number) {
    if (!this.gameOver && this.spraying) {
      this.updateSpray(dt);
    }

    // always update particles so old drops keep moving/fading
    this.updateParticles(dt);

    this.renderer.render(this.scene, this.camera);
  }

  // -------------------------------------------------
  // SPRAY LOGIC
  // -------------------------------------------------
  private updateSpray(dt: number) {
    console.log("spraying frame", this.currentWater);

    if (this.currentWater <= 0) {
      this.handleLose();
      if (this.waterBeam) this.waterBeam.visible = false;
      this.spraying = false;
      return;
    }

    // Drain water based on time
    this.currentWater -= this.waterDrainRate * dt;
    if (this.currentWater < 0) this.currentWater = 0;
    this.updateWaterUI();

    // Raycast from center of screen
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.targets.length
      ? this.raycaster.intersectObjects(this.targets, false)
      : this.raycaster.intersectObjects(this.scene.children, true);

    let hitPoint: THREE.Vector3;

    if (
      intersects.length > 0 && intersects[0].distance < this.maxSprayDistance
    ) {
      hitPoint = intersects[0].point;

      this.sprayTimer += dt;
      if (this.sprayTimer >= this.sprayTick) {
        this.sprayTimer = 0;
        this.onWaterHit(intersects[0].object);
      }
    } else {
      hitPoint = this.raycaster.ray.origin
        .clone()
        .add(
          this.raycaster.ray.direction.clone().multiplyScalar(
            this.maxSprayDistance,
          ),
        );
    }

    // spawn particles along ray direction
    const origin = this.raycaster.ray.origin;
    const dir = this.raycaster.ray.direction;
    this.spawnSprayParticles(origin, dir, dt);

    // OPTIONAL: you can keep the debug beam or remove it.
    // this.updateBeamVisual(origin, hitPoint);
  }

  private updateBeamVisual(origin: THREE.Vector3, end: THREE.Vector3) {
    if (!this.waterBeam) return;

    // DEBUG VERSION: just put a big box 4 units in front of the camera
    this.waterBeam.visible = true;
    this.waterBeam.position.copy(this.camera.position);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(
      this.camera.quaternion,
    );
    this.waterBeam.position.addScaledVector(forward, 4); // in front of camera

    this.waterBeam.scale.set(2, 2, 6); // make it chunky
    this.waterBeam.rotation.set(0, 0, 0);
  }

  private onWaterHit(obj: THREE.Object3D) {
    // TODO: hook this into your fill/target logic.
    // For now, just log:
    // console.log("Water hit:", obj.name);

    // Example: if you had a "fill" value stored in userData:
    // const data = obj.userData as { fill?: number; maxFill?: number };
    // if (data.maxFill) {
    //   data.fill = Math.min((data.fill ?? 0) + 1, data.maxFill);
    //   if (allTargetsFull) this.handleWin();
    // }
  }

  private spawnSprayParticles(
    origin: THREE.Vector3,
    dir: THREE.Vector3,
    dt: number,
  ) {
    if (
      !this.particlePositions ||
      !this.particleVelocities ||
      !this.particleLifetimes ||
      !this.particleAges
    ) return;

    const spawnRate = 300; // particles per second
    const count = Math.floor(spawnRate * dt);
    const spread = 0.08; // much tighter jet
    const speed = 40; // faster so they reach the stand

    // start them slightly in front of the camera
    const nozzleOffset = 1.0; // meters in front of camera
    const baseOrigin = origin.clone().add(
      dir.clone().normalize().multiplyScalar(nozzleOffset),
    );

    for (let c = 0; c < count; c++) {
      const i = this.nextParticleIndex;
      this.nextParticleIndex = (this.nextParticleIndex + 1) % this.maxParticles;

      const pi = i * 3;

      // random spread around main direction
      const randomDir = dir.clone().normalize();
      randomDir.x += (Math.random() - 0.5) * spread;
      randomDir.y += (Math.random() - 0.5) * spread;
      randomDir.z += (Math.random() - 0.5) * spread;
      randomDir.normalize();

      // start at baseOrigin
      this.particlePositions[pi + 0] = baseOrigin.x;
      this.particlePositions[pi + 1] = baseOrigin.y;
      this.particlePositions[pi + 2] = baseOrigin.z;

      this.particleVelocities[pi + 0] = randomDir.x * speed;
      this.particleVelocities[pi + 1] = randomDir.y * speed;
      this.particleVelocities[pi + 2] = randomDir.z * speed;

      this.particleAges[i] = 0;
      this.particleLifetimes[i] = 0.6 + Math.random() * 0.3; // 0.6–0.9s
    }

    this.particleGeometry!.attributes.position.needsUpdate = true;
  }

  private updateParticles(dt: number) {
    if (
      !this.particlePositions ||
      !this.particleVelocities ||
      !this.particleLifetimes ||
      !this.particleAges ||
      !this.particleGeometry
    ) return;

    const gravity = -9.8; // m/s^2 downward

    let anyAlive = false;

    for (let i = 0; i < this.maxParticles; i++) {
      const life = this.particleLifetimes[i];
      if (life <= 0) continue; // unused slot

      let age = this.particleAges[i];
      age += dt;

      if (age >= life) {
        this.particleLifetimes[i] = 0;
        continue;
      }

      this.particleAges[i] = age;
      anyAlive = true;

      const pi = i * 3;

      // apply gravity to velocity
      this.particleVelocities[pi + 1] += gravity * dt;

      // integrate position
      this.particlePositions[pi + 0] += this.particleVelocities[pi + 0] * dt;
      this.particlePositions[pi + 1] += this.particleVelocities[pi + 1] * dt;
      this.particlePositions[pi + 2] += this.particleVelocities[pi + 2] * dt;
    }

    if (anyAlive) {
      this.particleGeometry.attributes.position.needsUpdate = true;
    }
  }

  // -------------------------------------------------
  // UI
  // -------------------------------------------------
  private showUI() {
    // Crosshair
    if (!this.crosshair) {
      this.crosshair = document.createElement("div");
      this.crosshair.style.position = "absolute";
      this.crosshair.style.top = "50%";
      this.crosshair.style.left = "50%";
      this.crosshair.style.transform = "translate(-50%, -50%)";
      this.crosshair.style.width = "24px";
      this.crosshair.style.height = "24px";
      this.crosshair.style.border = "2px solid white";
      this.crosshair.style.borderRadius = "50%";
      this.crosshair.style.boxShadow = "0 0 8px rgba(0,0,0,0.7)";
      this.crosshair.style.pointerEvents = "none";
      document.body.appendChild(this.crosshair);
    }

    // Water bar
    if (!this.waterBarContainer) {
      this.waterBarContainer = document.createElement("div");
      this.waterBarContainer.style.position = "absolute";
      this.waterBarContainer.style.bottom = "24px";
      this.waterBarContainer.style.left = "50%";
      this.waterBarContainer.style.transform = "translateX(-50%)";
      this.waterBarContainer.style.width = "220px";
      this.waterBarContainer.style.height = "24px";
      this.waterBarContainer.style.border = "2px solid white";
      this.waterBarContainer.style.backgroundColor = "rgba(0,0,0,0.7)";
      this.waterBarContainer.style.boxShadow = "0 0 8px rgba(0,0,0,0.7)";
      document.body.appendChild(this.waterBarContainer);

      this.waterBarFill = document.createElement("div");
      this.waterBarFill.style.height = "100%";
      this.waterBarFill.style.width = "100%";
      this.waterBarFill.style.background =
        "linear-gradient(90deg, #4fc3ff, #00ffcc)";
      this.waterBarFill.style.transition = "width 0.1s linear";
      this.waterBarContainer.appendChild(this.waterBarFill);
    }

    // Water text
    if (!this.waterText) {
      this.waterText = document.createElement("div");
      this.waterText.style.position = "absolute";
      this.waterText.style.bottom = "54px";
      this.waterText.style.left = "50%";
      this.waterText.style.transform = "translateX(-50%)";
      this.waterText.style.color = "white";
      this.waterText.style.fontFamily = "sans-serif";
      this.waterText.style.fontSize = "18px";
      this.waterText.style.textShadow = "0 0 4px black";
      document.body.appendChild(this.waterText);
    }
  }

  private updateWaterUI() {
    const pct = this.currentWater / this.maxWater;
    if (this.waterBarFill) {
      this.waterBarFill.style.width = `${Math.max(0, Math.min(1, pct)) * 100}%`;
    }
    if (this.waterText) {
      this.waterText.textContent = `Water: ${
        Math.round(
          this.currentWater,
        )
      } / ${this.maxWater}`;
    }
  }

  private hideUI() {
    if (this.crosshair && this.crosshair.parentElement) {
      this.crosshair.parentElement.removeChild(this.crosshair);
    }
    if (this.waterBarContainer && this.waterBarContainer.parentElement) {
      this.waterBarContainer.parentElement.removeChild(this.waterBarContainer);
    }
    if (this.waterText && this.waterText.parentElement) {
      this.waterText.parentElement.removeChild(this.waterText);
    }

    this.crosshair = null;
    this.waterBarContainer = null;
    this.waterBarFill = null;
    this.waterText = null;
  }

  // -------------------------------------------------
  // WIN / LOSE
  // -------------------------------------------------
  private handleWin() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.hasWon = true;

    this.hideUI();
    this.showResultOverlay("YOU WIN!", "#ffdd00", "#0066ff");

    setTimeout(() => {
      this.onFinish();
    }, 2000);
  }

  private handleLose() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.hasWon = false;

    this.hideUI();
    this.showResultOverlay("OUT OF WATER!", "#ff5555", "#5a0000");

    setTimeout(() => {
      this.onFinish();
    }, 2000);
  }

  private showResultOverlay(
    textContent: string,
    textColor: string,
    borderColor: string,
  ) {
    const overlay = document.createElement("div");
    overlay.id = "watergun-result-overlay";
    overlay.style.position = "absolute";
    overlay.style.inset = "0";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.backgroundColor = "rgba(0,0,0,0.4)";
    overlay.style.zIndex = "9999";

    const container = document.createElement("div");
    container.style.perspective = "800px";
    container.style.transformStyle = "preserve-3d";

    const text = document.createElement("div");
    text.textContent = textContent;
    text.style.fontFamily = `"Impact", "Arial Black", system-ui`;
    text.style.fontSize = "64px";
    text.style.padding = "16px 40px";
    text.style.color = textColor;
    text.style.letterSpacing = "4px";
    text.style.textShadow = "0 0 8px #000";
    text.style.borderRadius = "10px";
    text.style.border = `4px solid ${borderColor}`;
    text.style.boxShadow = "0 0 25px rgba(0,0,0,0.8)";
    text.style.transformOrigin = "center";
    text.style.animation =
      "watergun-result-pop 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards";

    container.appendChild(text);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.remove();
    }, 1900);
  }

  private injectResultKeyframes() {
    if (document.getElementById("watergun-result-style")) return;
    const style = document.createElement("style");
    style.id = "watergun-result-style";
    style.textContent = `
      @keyframes watergun-result-pop {
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
}
