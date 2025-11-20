import * as THREE from "https://esm.sh/three@0.172.0";
import {
  GLTF,
  GLTFLoader,
} from "https://esm.sh/three@0.172.0/examples/jsm/loaders/GLTFLoader.js";

export class Scene1_MainHub {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;

  // Player system
  player: THREE.Object3D;
  playerScale = 0.25;
  playerHeight = 3;
  playerStartRotationY = Math.PI / 2;
  playerStartPosition = new THREE.Vector3(0, 20, 0);

  speed = 4;
  keys: Record<string, boolean> = {};

  // Gravity
  velocityY = 0;
  gravity = -15;

  // Floor
  floorWidth = 50;
  floorDepth = 50;
  floorHeight = 1;
  floorY = 0;
  floorMesh: THREE.Mesh;

  // Camera offset (diagonal over shoulder)
  cameraOffset = new THREE.Vector3(4, 6, 8);
  cameraLerpSpeed = 0.1;

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;

    // Scene
    this.scene = new THREE.Scene();

    // Add afternoon sky gradient
    this.addSkyGradient();

    // Camera
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

    this.loadGLBModel("/assets/models/Player.glb");
    this.setupControls();
  }

  // -------------------------
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

  // -------------------------
  loadGLBModel(path: string) {
    const loader = new GLTFLoader();
    loader.load(
      path,
      (gltf: GLTF) => {
        const model = gltf.scene;
        model.position.set(0, 0, 0);
        model.scale.set(this.playerScale, this.playerScale, this.playerScale);
        this.player.add(model);
      },
      undefined,
    );
  }

  // -------------------------
  setupControls() {
    globalThis.addEventListener("keydown", (e: KeyboardEvent) => {
      this.keys[e.key.toLowerCase()] = true;
    });
    globalThis.addEventListener("keyup", (e: KeyboardEvent) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  // -------------------------
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

    // Gravity
    this.velocityY += this.gravity * delta;
    this.player.position.y += this.velocityY * delta;

    // Floor collision
    const floorTopY = this.floorY + this.floorHeight;
    const playerFeetY = this.player.position.y - this.playerHeight / 2;
    if (playerFeetY < floorTopY) {
      this.player.position.y = floorTopY + this.playerHeight / 2;
      this.velocityY = 0;
    }
  }

  // -------------------------
  update(delta: number) {
    this.updateMovement(delta);

    const desiredPos = this.player.position.clone().add(this.cameraOffset);
    this.camera.position.lerp(desiredPos, this.cameraLerpSpeed);
    this.camera.lookAt(this.player.position);

    this.renderer.render(this.scene, this.camera);
  }
}
