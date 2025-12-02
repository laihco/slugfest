//scene1_mainhub.ts
import * as THREE from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { inventory } from "./inventory.ts";
import * as MAIN from "./main.ts";

export class Scene1_MainHub {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;

  player: THREE.Object3D;
  playerScale = 0.25;
  playerHeight = 3;
  playerStartRotationY = Math.PI / 2;
  playerStartPosition = new THREE.Vector3(0, 20, 0);

  speed = 4;
  keys: Record<string, boolean> = {};

  velocityY = 0;
  gravity = -15;

  floorWidth = 50;
  floorDepth = 50;
  floorHeight = 1;
  floorY = 0;
  floorMesh: THREE.Mesh;

  cameraOffset = new THREE.Vector3(4, 6, 8);
  cameraLerpSpeed = 0.1;

  //Scene Transition Cubes
  cubeSize = 2;

  scene3CubePosition = new THREE.Vector3(-10, 0.1, -8);
  cube3Mesh: THREE.Mesh;

  scene4CubePosition = new THREE.Vector3(7, 0.1, -8);
  cube4Mesh: THREE.Mesh;

  //Carnival Tents
  milkTossTentPosition = new THREE.Vector3(-10, 1, -15);
  milkTossTent: THREE.Object3D;

  duckPondPosition = new THREE.Vector3(7, 1, -15);
  duckPondTent: THREE.Object3D;

  tentRotationX = Math.PI;
  tentScale = 3;
  tentRadius = 2.4;

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;

    // Scene
    this.scene = new THREE.Scene();

    // Sky gradient
    this.addSkyGradient();

    // Unique camera for this scene
    this.camera = new THREE.PerspectiveCamera(
      60,
      innerWidth / innerHeight,
      0.1,
      1000,
    );

    // Lights
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(5, 10, 7);
    this.scene.add(dir);

    // Floor
    const floorGeometry = new THREE.BoxGeometry(
      this.floorWidth,
      this.floorHeight,
      this.floorDepth,
    );
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x2e8b57 });
    this.floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    this.floorMesh.position.y = this.floorY + this.floorHeight / 2;
    this.floorMesh.receiveShadow = true;
    this.scene.add(this.floorMesh);

    // Player
    this.player = new THREE.Object3D();
    this.player.position.copy(this.playerStartPosition);
    this.player.rotation.y = this.playerStartRotationY;
    this.scene.add(this.player);

    this.loadGLBModel(
      "/assets/models/Player.glb",
      this.player,
      this.playerScale,
    );
    this.setupControls();

    //Scene Cubes
    const cubeGeometry = new THREE.BoxGeometry(
      this.cubeSize,
      this.cubeSize,
      this.cubeSize,
    );
    const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x90EE90 });
    this.cube3Mesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
    this.cube3Mesh.position.copy(this.scene3CubePosition);
    this.scene.add(this.cube3Mesh);

    this.cube4Mesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
    this.cube4Mesh.position.copy(this.scene4CubePosition);
    this.scene.add(this.cube4Mesh);

    //Game Tents
    this.milkTossTent = new THREE.Object3D();
    this.milkTossTent.position.copy(this.milkTossTentPosition);
    this.milkTossTent.rotation.x = this.tentRotationX;
    this.scene.add(this.milkTossTent);

    this.loadGLBModel(
      "/assets/models/milkTent.glb",
      this.milkTossTent,
      this.tentScale,
    );

    this.duckPondTent = new THREE.Object3D();
    this.duckPondTent.position.copy(this.duckPondPosition);
    this.duckPondTent.rotation.x = this.tentRotationX;
    this.scene.add(this.duckPondTent);

    this.loadGLBModel(
      "/assets/models/duckTent.glb",
      this.duckPondTent,
      this.tentScale,
    );
  }

  addSkyGradient() {
    const skyGeo = new THREE.SphereGeometry(500, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vPosition;
        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vPosition;
        void main() {
          float h = normalize(vPosition).y * 0.5 + 0.5;
          vec3 topColor = vec3(0.05, 0.15, 0.5); 
          vec3 bottomColor = vec3(1.0, 0.7, 0.4); 
          gl_FragColor = vec4(mix(bottomColor, topColor, h), 1.0);
        }
      `,
      side: THREE.BackSide,
    });
    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(skyMesh);
  }

  loadGLBModel(path: string, object: THREE.Object3D, scale: number) {
    const loader = new GLTFLoader();
    loader.load(
      path,
      (gltf: GLTF) => {
        const model = gltf.scene;
        model.position.set(0, 0, 0);
        model.scale.set(scale, scale, scale);
        object.add(model);
      },
      undefined,
    );
  }

  setupControls() {
    globalThis.addEventListener("keydown", (e: KeyboardEvent) => {
      this.keys[e.key.toLowerCase()] = true;
    });
    globalThis.addEventListener("keyup", (e: KeyboardEvent) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  updateMovement(delta: number) {
    const forward = new THREE.Vector3(0, 0, -1);
    const right = new THREE.Vector3(1, 0, 0);

    if (this.keys["w"]) {
      this.player.position.addScaledVector(forward, this.speed * delta);
    }
    if (this.keys["s"]) {
      this.player.position.addScaledVector(forward, -this.speed * delta);
    }
    if (this.keys["a"]) {
      this.player.position.addScaledVector(right, -this.speed * delta);
    }
    if (this.keys["d"]) {
      this.player.position.addScaledVector(right, this.speed * delta);
    }

    this.velocityY += this.gravity * delta;
    this.player.position.y += this.velocityY * delta;

    const floorTopY = this.floorY + this.floorHeight;
    const playerFeetY = this.player.position.y - this.playerHeight / 2;
    if (playerFeetY < floorTopY) {
      this.player.position.y = floorTopY + this.playerHeight / 2;
      this.velocityY = 0;
    }

    const playerOffset = new THREE.Vector3(0, 0, 0);
    playerOffset.subVectors(this.player.position, this.milkTossTent.position);
    playerOffset.y = 0;
    if (playerOffset.length() < this.tentRadius * this.tentScale) {
      playerOffset.setLength(this.tentRadius * this.tentScale);
      this.player.position.x = this.milkTossTent.position.x + playerOffset.x;
      this.player.position.z = this.milkTossTent.position.z + playerOffset.z;
    }
  }

  // --------------------------
  // Transition Collisions
  //---------------------------
  detectTransitionCollisions() {
    if (
      Math.abs(this.player.position.x - this.cube3Mesh.position.x) <
        this.cubeSize / 2 &&
      Math.abs(this.player.position.z - this.cube3Mesh.position.z) <
        this.cubeSize / 2
    ) {
      MAIN.switchScene(3);
    }

    if (
      Math.abs(this.player.position.x - this.cube4Mesh.position.x) <
        this.cubeSize / 2 &&
      Math.abs(this.player.position.z - this.cube4Mesh.position.z) <
        this.cubeSize / 2
    ) {
      // REQUIRE 1 FOX PLUSH TO ENTER DUCK POND
      if (inventory.hasItem("fox-plush", 1)) {
        MAIN.switchScene(4);
      } else {
        // Show popup
        let overlay = document.getElementById("popup-overlay");
        let box = document.getElementById("popup-box");

        if (!overlay) {
          overlay = document.createElement("div");
          overlay.id = "popup-overlay";
          overlay.className = "result-overlay";
          overlay.style.display = "none";
          box = document.createElement("div");
          box.id = "popup-box";
          box.className = "loseText";
          overlay.appendChild(box);
          document.body.appendChild(overlay);
        }

        box!.textContent = "You need a fox plush!";
        overlay!.style.display = "flex";

        setTimeout(() => {
          overlay!.style.display = "none";
        }, 1500);
      }
    }
  }

  // -------------------------
  update(delta: number) {
    this.updateMovement(delta);
    this.detectTransitionCollisions();

    const desiredPos = this.player.position.clone().add(this.cameraOffset);
    this.camera.position.lerp(desiredPos, this.cameraLerpSpeed);
    this.camera.lookAt(this.player.position);

    this.renderer.render(this.scene, this.camera);
  }

  //Reset Player spawn
  resetPlayerPosition() {
    // Spawn near the center of the floor.
    this.player.position.set(0, 3, 0);
    this.velocityY = 0;
  }
}
